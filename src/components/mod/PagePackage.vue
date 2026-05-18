<template>
  <section class="package-page-shell">
    <header class="package-page-header">
      <div class="package-header-main">
        <h2 class="package-page-title">扩展包</h2>
        <p class="package-page-description">统一管理已安装包、商店推荐以及上传 / URL 安装。</p>
      </div>

      <button
        type="button"
        class="package-update-card"
        :class="{ 'is-loading': reloadAllLoading }"
        @click="handleReloadPackagesByContent()">
        <span class="package-update-card-icon" aria-hidden="true"></span>
        <span class="package-update-card-label">扩展包有更新</span>
        <span class="package-update-card-badge">{{ pendingReloadPackageCount }}</span>
      </button>
    </header>

    <section class="package-main-panel">
      <el-tabs v-model="activeTab" class="package-tabs">
        <el-tab-pane label="已安装包" name="installed">
          <section class="installed-tab-content">
            <header class="installed-toolbar">
              <el-input
                v-model="installedKeyword"
                class="toolbar-search"
                clearable
                :prefix-icon="Search"
                placeholder="搜索扩展包名称 / ID / 关键词" />
              <el-select
                v-model="installedContentFilter"
                class="toolbar-select"
                placeholder="全部内容">
                <el-option
                  v-for="item in contentFilterOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value" />
              </el-select>
              <el-dropdown
                class="reload-dropdown"
                trigger="click"
                :hide-on-click="true"
                @command="handleReloadDropdownCommand">
                <el-button plain class="reload-dropdown-button" :loading="reloadAllLoading">
                  重载
                  <span class="reload-button-count">{{ pendingReloadPackageCount }}</span>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu class="reload-dropdown-menu">
                    <el-dropdown-item
                      v-for="item in reloadDropdownOptions"
                      :key="item.value"
                      :command="item.value"
                      :disabled="reloadAllLoading">
                      <span class="reload-dropdown-item">
                        <span>{{ item.label }}</span>
                        <span class="reload-dropdown-count">{{ item.count }}</span>
                      </span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button
                plain
                class="installed-disk-refresh-button"
                :icon="Refresh"
                :loading="installedDiskRefreshing"
                @click="handleRefreshPackageInstallations">
                刷新
              </el-button>
              <el-button
                plain
                class="installed-refresh-button"
                :icon="Refresh"
                :loading="installedLoading"
                @click="refreshInstalledPackages">
                检查更新
              </el-button>
            </header>

            <section
              v-loading="installedLoading || installedDiskRefreshing"
              class="package-list-surface">
              <div class="package-card-list">
                <article
                  v-for="pkg in pagedInstalledPackages"
                  :key="getPackageKey(pkg)"
                  class="package-card"
                  :class="[
                    `accent-${getPackageAccent(pkg)}`,
                    `state-${pkg.state}`,
                    { 'source-cache-only': isCacheOnlyPackage(pkg) },
                  ]">
                  <div class="package-card-media" :class="`accent-${getPackageAccent(pkg)}`">
                    <img
                      v-if="pkg.manifest.store?.icon"
                      :src="pkg.manifest.store.icon"
                      alt=""
                      class="package-card-avatar-image" />
                    <span v-else class="package-card-avatar-fallback">{{
                      getPackageAvatarText(pkg)
                    }}</span>
                  </div>

                  <div class="package-card-body">
                    <div class="package-card-head">
                      <div class="package-card-heading">
                        <div class="package-card-title-row">
                          <h3 class="package-card-title">{{ getPackageName(pkg) }}</h3>
                          <span class="package-chip package-chip-id">{{ getPackageId(pkg) }}</span>
                          <span class="package-chip package-chip-version">{{
                            getPackageVersion(pkg)
                          }}</span>
                          <span
                            class="package-chip package-chip-state"
                            :class="`state-${pkg.state}`">
                            {{ getStateLabel(pkg.state) }}
                          </span>
                          <el-tooltip
                            v-if="isCacheOnlyPackage(pkg)"
                            :content="getPackageSourceWarning(pkg)"
                            placement="top">
                            <span class="package-chip package-chip-source-warning">源文件缺失</span>
                          </el-tooltip>
                        </div>
                        <p class="package-card-description">{{ getPackageDescription(pkg) }}</p>
                      </div>

                      <div class="package-card-actions">
                        <el-button plain size="small" @click="openPackageDetail(pkg)"
                          >详情</el-button
                        >
                        <el-button
                          v-if="pkg.state !== 'enabled'"
                          size="small"
                          type="success"
                          :loading="Boolean(packageActionLoading[getPackageId(pkg)])"
                          :disabled="isCacheOnlyPackage(pkg)"
                          :title="
                            isCacheOnlyPackage(pkg) ? getPackageSourceWarning(pkg) : undefined
                          "
                          @click="handleEnablePackage(pkg)">
                          启用
                        </el-button>
                        <el-button
                          v-if="pkg.state === 'enabled'"
                          size="small"
                          type="warning"
                          :loading="Boolean(packageActionLoading[getPackageId(pkg)])"
                          @click="handleDisablePackage(pkg)">
                          禁用
                        </el-button>
                        <el-button size="small" type="danger" @click="openUninstallDialog(pkg)">
                          卸载
                        </el-button>
                      </div>
                    </div>

                    <div class="package-card-tags">
                      <span
                        v-for="content in getPackageContents(pkg)"
                        :key="content"
                        class="package-chip package-chip-content">
                        {{ getContentLabel(content) }}
                      </span>
                      <span
                        v-for="keyword in getPackagePreviewKeywords(pkg)"
                        :key="keyword"
                        class="package-chip package-chip-keyword">
                        {{ keyword }}
                      </span>
                    </div>

                    <div class="package-card-meta">
                      <span class="package-meta-item">
                        <el-icon><User /></el-icon>
                        作者：{{ joinList(pkg.manifest.package.authors) }}
                      </span>
                      <span class="package-meta-item">
                        <el-icon><Clock /></el-icon>
                        安装时间：{{ formatTime(pkg.installTime) }}
                      </span>
                      <span
                        class="package-meta-item package-meta-path"
                        :title="pkg.installPath || '-'">
                        <el-icon><Document /></el-icon>
                        安装路径：{{ pkg.installPath || '-' }}
                      </span>
                    </div>
                  </div>
                </article>

                <el-empty
                  v-if="!installedLoading && filteredInstalledPackages.length === 0"
                  class="package-empty"
                  description="暂无匹配的扩展包"
                  :image-size="96" />
              </div>
            </section>

            <footer v-if="filteredInstalledPackages.length > 0" class="installed-list-footer">
              <span class="installed-list-count"
                >共 {{ filteredInstalledPackages.length }} 个扩展包</span
              >
              <el-config-provider :locale="zhCn">
                <el-pagination
                  v-model:current-page="installedPage"
                  v-model:page-size="installedPageSize"
                  background
                  layout="sizes, prev, pager, next, jumper"
                  :page-sizes="[10, 20, 50]"
                  :total="filteredInstalledPackages.length" />
              </el-config-provider>
            </footer>
          </section>
        </el-tab-pane>
        <el-tab-pane label="商店" name="store">
          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="section-card-header">
                <span>仓库管理</span>
                <el-button
                  link
                  :icon="Refresh"
                  :loading="backendLoading"
                  @click="refreshStoreBackends">
                  刷新仓库列表
                </el-button>
              </div>
            </template>

            <div class="backend-add-row">
              <el-input
                v-model="backendInput"
                clearable
                placeholder="输入仓库 URL"
                @keyup.enter="handleAddBackend" />
              <el-button
                type="primary"
                :icon="Plus"
                :loading="backendAddLoading"
                @click="handleAddBackend">
                添加后端
              </el-button>
            </div>

            <div v-loading="backendLoading" class="backend-list">
              <div
                v-for="backend in storeBackends"
                :key="getBackendKey(backend)"
                class="backend-item">
                <div class="backend-item-main">
                  <el-space wrap>
                    <el-text tag="strong">{{ getBackendLabel(backend) }}</el-text>
                    <el-tag v-if="isBuiltinBackend(backend)" size="small" type="info">内置</el-tag>
                  </el-space>
                  <el-text type="info" class="break-text">{{ getBackendExtra(backend) }}</el-text>
                </div>
                <div class="backend-item-actions">
                  <el-switch
                    :model-value="isBackendEnabled(backend)"
                    active-text="启用"
                    inactive-text="禁用"
                    :loading="Boolean(backendToggleLoading[getBackendKey(backend)])"
                    @change="value => handleToggleBackend(backend, Boolean(value))" />
                  <el-button
                    v-if="!isBuiltinBackend(backend)"
                    type="danger"
                    link
                    :loading="Boolean(backendRemoveLoading[getBackendKey(backend)])"
                    @click="handleRemoveBackend(backend)">
                    删除
                  </el-button>
                </div>
              </div>
              <el-empty
                v-if="!backendLoading && storeBackends.length === 0"
                description="暂无仓库后端"
                :image-size="72" />
            </div>
          </el-card>

          <el-card shadow="never" class="section-card">
            <template #header>
              <div class="section-card-header">
                <span>商店查询</span>
                <el-space wrap>
                  <el-button :loading="storeLoading" @click="loadStoreRecommend">推荐</el-button>
                  <el-button type="primary" :loading="storeLoading" @click="searchStorePackages"
                    >搜索</el-button
                  >
                </el-space>
              </div>
            </template>

            <el-form label-position="top" class="store-query-grid">
              <el-form-item label="仓库后端">
                <el-select v-model="storeQuery.backend" clearable placeholder="全部仓库">
                  <el-option
                    v-for="backend in enabledStoreBackends"
                    :key="getBackendKey(backend)"
                    :label="getBackendLabel(backend)"
                    :value="getBackendValue(backend)" />
                </el-select>
              </el-form-item>
              <el-form-item label="内容类型">
                <el-select v-model="storeQuery.content" placeholder="全部类型">
                  <el-option
                    v-for="item in contentFilterOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="作者">
                <el-input v-model="storeQuery.author" clearable placeholder="按作者筛选" />
              </el-form-item>
              <el-form-item label="名称">
                <el-input v-model="storeQuery.name" clearable placeholder="按名称筛选" />
              </el-form-item>
              <el-form-item label="分类">
                <el-input v-model="storeQuery.category" clearable placeholder="按分类筛选" />
              </el-form-item>
              <el-form-item label="排序字段">
                <el-input v-model="storeQuery.sortBy" clearable placeholder="如 updateTime" />
              </el-form-item>
              <el-form-item label="排序方式">
                <el-select v-model="storeQuery.order" clearable placeholder="默认">
                  <el-option label="升序" value="asc" />
                  <el-option label="降序" value="desc" />
                </el-select>
              </el-form-item>
              <el-form-item label="页码">
                <el-input-number
                  v-model="storeQuery.pageNum"
                  :min="1"
                  :step="1"
                  controls-position="right" />
              </el-form-item>
              <el-form-item label="每页数量">
                <el-input-number
                  v-model="storeQuery.pageSize"
                  :min="1"
                  :step="10"
                  controls-position="right" />
              </el-form-item>
            </el-form>

            <div class="result-hint">
              <el-text type="info">
                当前视图：{{ storeViewMode === 'recommend' ? '推荐列表' : '分页搜索结果' }}
              </el-text>
            </div>

            <div class="table-wrap">
              <el-table v-loading="storeLoading" :data="storePackages" stripe>
                <el-table-column label="名称" min-width="180">
                  <template #default="scope">
                    <div class="font-medium">{{ scope.row.name }}</div>
                    <el-text type="info" size="small">{{ scope.row.version }}</el-text>
                  </template>
                </el-table-column>
                <el-table-column prop="id" label="ID" min-width="220" show-overflow-tooltip />
                <el-table-column label="作者" min-width="160">
                  <template #default="scope">
                    <span>{{ joinList(scope.row.authors) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="内容类型" min-width="180">
                  <template #default="scope">
                    <el-space wrap>
                      <el-tag v-for="content in scope.row.contents" :key="content" size="small">
                        {{ getContentLabel(content) }}
                      </el-tag>
                    </el-space>
                  </template>
                </el-table-column>
                <el-table-column label="分类" min-width="120">
                  <template #default="scope">
                    {{ scope.row.storeAssets?.category || '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="更新时间" min-width="170">
                  <template #default="scope">
                    {{ formatTime(scope.row.download?.updateTime) }}
                  </template>
                </el-table-column>
                <el-table-column label="下载量" min-width="100">
                  <template #default="scope">
                    {{ scope.row.download?.downloadCount ?? '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="安装状态" min-width="120">
                  <template #default="scope">
                    <el-tag :type="isStoreInstalled(scope.row) ? 'success' : 'info'">
                      {{ isStoreInstalled(scope.row) ? '已安装' : '未安装' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" min-width="170">
                  <template #default="scope">
                    <el-space wrap>
                      <el-button link size="small" @click="openStoreDetail(scope.row)"
                        >查看详情</el-button
                      >
                      <el-button
                        link
                        size="small"
                        type="primary"
                        :loading="Boolean(storeDownloadLoading[getStorePackageKey(scope.row)])"
                        @click="handleDownloadStorePackage(scope.row)">
                        {{ isStoreInstalled(scope.row) ? '安装/升级' : '安装' }}
                      </el-button>
                    </el-space>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div v-if="storeViewMode === 'search'" class="pagination-row">
              <el-config-provider :locale="zhCn">
                <el-pagination
                  background
                  layout="total, prev, pager, next"
                  :current-page="storeQuery.pageNum"
                  :page-size="storeQuery.pageSize"
                  :total="storeTotal"
                  @current-change="handleStorePageChange" />
              </el-config-provider>
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="安装" name="install">
          <div class="install-grid">
            <el-card shadow="never" class="section-card">
              <template #header>
                <span>上传安装</span>
              </template>
              <el-form label-position="top">
                <el-form-item label=".sealpack 文件">
                  <el-upload
                    action=""
                    accept=".sealpack"
                    :auto-upload="false"
                    :file-list="installUploadFileList"
                    :on-change="handleInstallUploadFileChange"
                    :on-remove="handleInstallUploadFileRemove">
                    <el-button plain :icon="Upload">选择 sealpack 文件</el-button>
                    <template #tip>
                      <div class="install-upload-tip">文件将以流式请求上传到后端安装。</div>
                    </template>
                  </el-upload>
                </el-form-item>
                <el-form-item>
                  <el-checkbox v-model="installUploadAutoEnable">安装后自动启用</el-checkbox>
                </el-form-item>
              </el-form>
              <el-button
                type="primary"
                :loading="installByUploadLoading"
                @click="handleInstallByUpload">
                上传并安装
              </el-button>
              <div
                v-if="installByUploadLoading || installUploadProgress > 0"
                class="install-upload-progress">
                <el-progress
                  :percentage="installUploadProgress"
                  :status="installUploadProgressStatus" />
                <div class="install-upload-progress-text">{{ installUploadProgressText }}</div>
              </div>
            </el-card>

            <el-card shadow="never" class="section-card">
              <template #header>
                <span>URL 安装</span>
              </template>
              <el-form label-position="top">
                <el-form-item label="sealpack 下载 URL">
                  <el-input
                    v-model="installUrlInput"
                    clearable
                    placeholder="https://example.com/demo.sealpack"
                    @keyup.enter="handleInstallByUrl" />
                </el-form-item>
                <el-form-item>
                  <el-checkbox v-model="installUrlAutoEnable">安装后自动启用</el-checkbox>
                </el-form-item>
              </el-form>
              <el-button type="primary" :loading="installByUrlLoading" @click="handleInstallByUrl">
                从 URL 安装
              </el-button>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>
  </section>

  <PackageInstalledDrawer
    v-model="packageDetailVisible"
    :size="drawerSize"
    :loading="packageDetailLoading"
    :saving="packageConfigSaving"
    :data="currentPackageDetail"
    :config-data="currentPackageConfig"
    :config-schema="currentPackageSchema"
    @save-config="handleSavePackageConfig" />

  <PackageStoreDrawer v-model="storeDetailVisible" :size="drawerSize" :data="currentStorePackage" />

  <el-dialog v-model="uninstallDialogVisible" title="卸载扩展包" width="420px">
    <el-form label-position="top">
      <el-form-item label="目标包">
        <el-text tag="strong">{{
          uninstallTarget
            ? `${getPackageId(uninstallTarget)} @ ${getPackageVersion(uninstallTarget)}`
            : '-'
        }}</el-text>
      </el-form-item>
      <el-form-item label="卸载模式">
        <el-select v-model="uninstallMode" class="w-full">
          <el-option label="full - 完全卸载" value="full" />
          <el-option label="keep_data - 保留数据" value="keep_data" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="uninstallDialogVisible = false">取消</el-button>
      <el-button type="danger" :loading="uninstallLoading" @click="handleConfirmUninstall">
        确认卸载
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { UploadFile, UploadFiles, UploadRawFile } from 'element-plus';
import { Clock, Document, Plus, Refresh, Search, Upload, User } from '@element-plus/icons-vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import dayjs from 'dayjs';
import {
  disablePackage,
  enablePackage,
  getPackageConfig,
  getPackageConfigSchema,
  getPackageDetail,
  getPackageList,
  installPackageByUpload,
  installPackageByUrl,
  previewPackageUpload,
  reloadAllPackages,
  reloadPackageByContent,
  refreshPackageInstallations,
  setPackageConfig,
  uninstallPackage,
  type ContentKind,
  type PackageInstance,
  type PackageRefreshResult,
  type PackageState,
  type PackageUploadPreview,
} from '~/api/package';
import {
  addStoreBackend,
  downloadStorePackage,
  getStoreBackendList,
  getStorePage,
  getStoreRecommend,
  removeStoreBackend,
  setStoreBackendEnabled,
  type StoreBackendRecord,
  type StorePackage,
  type StorePageQuery,
} from '~/api/store';
import PackageInstalledDrawer from '~/components/mod/package/PackageInstalledDrawer.vue';
import PackageStoreDrawer from '~/components/mod/package/PackageStoreDrawer.vue';

const activeTab = ref<'installed' | 'store' | 'install'>('installed');

type ContentFilter = 'all' | ContentKind;
type StoreViewMode = 'recommend' | 'search';

const contentFilterOptions: Array<{ label: string; value: ContentFilter }> = [
  { label: '全部内容', value: 'all' },
  { label: '脚本', value: 'scripts' },
  { label: '牌堆', value: 'decks' },
  { label: '自定义回复', value: 'reply' },
  { label: '帮助文档', value: 'helpdoc' },
  { label: '规则模板', value: 'templates' },
];

const contentLabelMap: Record<ContentFilter, string> = {
  all: '全部',
  scripts: '脚本',
  decks: '牌堆',
  reply: '自定义回复',
  helpdoc: '帮助文档',
  templates: '规则模板',
};

const uploadPreviewContentLabelMap: Record<ContentKind | 'assets', string> = {
  scripts: '脚本',
  decks: '牌堆',
  reply: '自定义回复',
  helpdoc: '帮助文档',
  templates: '规则模板',
  assets: '资源文件',
};

const installedLoading = ref(false);
const installedDiskRefreshing = ref(false);
const reloadAllLoading = ref(false);
const installedPackages = ref<PackageInstance[]>([]);
const installedKeyword = ref('');
const installedContentFilter = ref<ContentFilter>('all');
const reloadContentTarget = ref<ContentFilter>('all');
const installedPage = ref(1);
const installedPageSize = ref(10);
const packageActionLoading = ref<Record<string, boolean>>({});

const packageDetailVisible = ref(false);
const packageDetailLoading = ref(false);
const packageConfigSaving = ref(false);
const currentPackageId = ref('');
const currentPackageDetail = ref<PackageInstance | null>(null);
const currentPackageConfig = ref<Record<string, any> | null>(null);
const currentPackageSchema = ref<Record<string, any> | null>({});

const backendLoading = ref(false);
const backendAddLoading = ref(false);
const backendRemoveLoading = ref<Record<string, boolean>>({});
const backendToggleLoading = ref<Record<string, boolean>>({});
const backendInput = ref('');
const storeBackends = ref<StoreBackendRecord[]>([]);

const storeLoadStarted = ref(false);
const storeLoading = ref(false);
const storeDownloadLoading = ref<Record<string, boolean>>({});
const storePackages = ref<StorePackage[]>([]);
const storeTotal = ref(0);
const storeViewMode = ref<StoreViewMode>('recommend');
const storeDetailVisible = ref(false);
const currentStorePackage = ref<StorePackage | null>(null);
const storeQuery = reactive<
  Required<Pick<StorePageQuery, 'pageNum' | 'pageSize'>> & {
    backend: string;
    content: ContentFilter;
    author: string;
    name: string;
    category: string;
    sortBy: string;
    order: string;
  }
>({
  backend: '',
  content: 'all',
  author: '',
  name: '',
  category: '',
  sortBy: '',
  order: '',
  pageNum: 1,
  pageSize: 20,
});

const installUrlInput = ref('');
const installUploadAutoEnable = ref(true);
const installUrlAutoEnable = ref(true);
const installByUploadLoading = ref(false);
const installByUrlLoading = ref(false);
const installUploadFileList = ref<UploadFile[]>([]);
const installUploadRawFile = ref<UploadRawFile | null>(null);
const installUploadProgress = ref(0);
const installUploadProgressStatus = ref<'success' | 'exception' | undefined>();
const installUploadProgressText = ref('');

const uninstallDialogVisible = ref(false);
const uninstallTarget = ref<PackageInstance | null>(null);
const uninstallMode = ref<'full' | 'keep_data'>('full');
const uninstallLoading = ref(false);

const { width } = useWindowSize();
const drawerSize = computed(() => {
  if (width.value < 768) {
    return '92%';
  }
  if (width.value < 1200) {
    return '72%';
  }
  return '56%';
});
const filteredInstalledPackages = computed(() => {
  const keyword = installedKeyword.value.trim().toLowerCase();
  return installedPackages.value.filter(pkg => {
    const contents = getPackageContents(pkg);
    if (
      installedContentFilter.value !== 'all' &&
      !contents.includes(installedContentFilter.value)
    ) {
      return false;
    }
    if (!keyword) {
      return true;
    }
    const haystacks = [
      getPackageName(pkg),
      getPackageId(pkg),
      getPackageDescription(pkg),
      ...(pkg.manifest.package.authors ?? []),
      ...(pkg.manifest.package.keywords ?? []),
      ...contents,
    ]
      .join(' ')
      .toLowerCase();
    return haystacks.includes(keyword);
  });
});

const installedPackageIdSet = computed(
  () => new Set(installedPackages.value.map(pkg => getPackageId(pkg))),
);
const pendingReloadPackageCount = computed(
  () => installedPackages.value.filter(pkg => (pkg.pendingReload ?? []).length > 0).length,
);

const contentKindValues: ContentKind[] = ['scripts', 'decks', 'reply', 'helpdoc', 'templates'];

const getMatchedReloadKinds = (hint: string) =>
  contentKindValues.filter(kind => reloadHintMatchesContentType(hint, kind));

const packageHasPendingReloadForContent = (pkg: PackageInstance, target: ContentKind) => {
  const pending = pkg.pendingReload ?? [];
  if (pending.length === 0) {
    return false;
  }
  if (pending.some(hint => reloadHintMatchesContentType(hint, target))) {
    return true;
  }
  const hasKnownHint = pending.some(hint => getMatchedReloadKinds(hint).length > 0);
  return !hasKnownHint && getPackageContents(pkg).includes(target);
};

function getPendingReloadCount(target: ContentFilter) {
  if (target === 'all') {
    return pendingReloadPackageCount.value;
  }
  return installedPackages.value.filter(pkg => packageHasPendingReloadForContent(pkg, target))
    .length;
}

const reloadDropdownOptions = computed(() =>
  contentFilterOptions.map(item => ({
    label: item.value === 'all' ? '全部' : item.label,
    value: item.value,
    count: getPendingReloadCount(item.value),
  })),
);

const pagedInstalledPackages = computed(() => {
  const start = (installedPage.value - 1) * installedPageSize.value;
  return filteredInstalledPackages.value.slice(start, start + installedPageSize.value);
});

watch([installedKeyword, installedContentFilter], () => {
  installedPage.value = 1;
});

watch([filteredInstalledPackages, installedPageSize], () => {
  const pageCount = Math.max(
    1,
    Math.ceil(filteredInstalledPackages.value.length / installedPageSize.value),
  );
  if (installedPage.value > pageCount) {
    installedPage.value = pageCount;
  }
});

const getContentLabel = (value: ContentFilter) => contentLabelMap[value] ?? value;

const getUploadPreviewContentLabel = (value: ContentKind | 'assets') =>
  uploadPreviewContentLabelMap[value] ?? value;

const getPackageId = (pkg: PackageInstance) => pkg.manifest.package.id;
const getPackageName = (pkg: PackageInstance) =>
  pkg.manifest.package.name || pkg.manifest.package.id;
const getPackageVersion = (pkg: PackageInstance) => pkg.manifest.package.version || '-';
const getPackageKey = (pkg: PackageInstance) => `${getPackageId(pkg)}@${getPackageVersion(pkg)}`;
const getPackageDescription = (pkg: PackageInstance) =>
  pkg.manifest.package.description || '暂无描述';
const packageAvatarMap: Record<ContentFilter, string> = {
  all: 'EX',
  scripts: 'JS',
  decks: '牌',
  reply: '回',
  helpdoc: '文',
  templates: '模',
};

const getPackageContents = (pkg: PackageInstance): ContentKind[] => {
  return (Object.entries(pkg.manifest.contents ?? {}) as Array<[ContentKind, string[] | undefined]>)
    .filter(([, value]) => Array.isArray(value) && value.length > 0)
    .map(([key]) => key);
};

const getPackageAccent = (pkg: PackageInstance): ContentFilter =>
  getPackageContents(pkg)[0] ?? 'all';

const getPackageAvatarText = (pkg: PackageInstance) => {
  const accent = getPackageAccent(pkg);
  return packageAvatarMap[accent] ?? getPackageName(pkg).slice(0, 2).toUpperCase();
};

const getPackagePreviewKeywords = (pkg: PackageInstance) =>
  (pkg.manifest.package.keywords ?? []).slice(0, 3);

const getStateLabel = (state: PackageState) => {
  switch (state) {
    case 'enabled':
      return '已启用';
    case 'disabled':
      return '已禁用';
    case 'installed':
      return '已安装';
    case 'error':
      return '异常';
    default:
      return state;
  }
};

const isCacheOnlyPackage = (pkg: PackageInstance) => pkg.sourceStatus === 'cache_only';

const getPackageSourceWarning = (pkg: PackageInstance) =>
  pkg.sourceWarning ||
  '源 .sealpack 文件缺失，当前仅保留缓存安装。请将 sealpack 放回 data/packages 后刷新。';

const joinList = (value?: string[]) => {
  if (!value || value.length === 0) {
    return '-';
  }
  return value.join('、');
};

const normalizeTimeValue = (value?: string | number) => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  return value > 9999999999 ? value : value * 1000;
};

const formatTime = (value?: string | number) => {
  const normalized = normalizeTimeValue(value);
  if (!normalized) {
    return '-';
  }
  const parsed = dayjs(normalized);
  if (!parsed.isValid()) {
    return String(value);
  }
  return parsed.format('YYYY-MM-DD HH:mm:ss');
};

const getResponseError = (
  response: { err?: string; message?: string } | undefined,
  fallback: string,
) => {
  return response?.err || response?.message || fallback;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error) {
    return error;
  }
  return fallback;
};

const normalizeReloadHint = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_\-:\uFF1A/\\]+/g, '');

const reloadHintAliasMap: Record<ContentKind, string[]> = {
  scripts: ['scripts', 'script', 'js', 'javascript', 'JS 扩展', 'JS扩展', '扩展脚本'],
  decks: ['decks', 'deck', '牌堆', '牌组', '卡组'],
  reply: ['reply', 'replies', 'custom-reply', 'customreply', '自定义回复', '回复'],
  helpdoc: ['helpdoc', 'helpdocs', 'help-document', 'help', '帮助文档'],
  templates: ['templates', 'template', 'rule-template', 'ruletemplate', '规则模板', '模板'],
};

const reloadHintMatchesContentType = (hint: string, kind: ContentKind) => {
  const normalized = normalizeReloadHint(hint);
  return reloadHintAliasMap[kind].some(alias => {
    const normalizedAlias = normalizeReloadHint(alias);
    return (
      normalized === normalizedAlias ||
      (normalizedAlias.length > 2 && normalized.startsWith(normalizedAlias))
    );
  });
};

const resolveReloadedKinds = (
  target: ContentFilter,
  response: { data?: { reloadedItems?: Record<string, string> } } | undefined,
): ContentKind[] => {
  if (target !== 'all') {
    return [target];
  }
  const keys = Object.keys(response?.data?.reloadedItems ?? {});
  return keys.filter((key): key is ContentKind =>
    ['scripts', 'decks', 'reply', 'helpdoc', 'templates'].includes(key),
  );
};

const stripPackagePendingReload = (pkg: PackageInstance, kinds: ContentKind[]) => {
  const pending = pkg.pendingReload ?? [];
  if (pending.length === 0) {
    return [];
  }
  const hasKnownHint = pending.some(hint => getMatchedReloadKinds(hint).length > 0);
  if (!hasKnownHint && getPackageContents(pkg).some(kind => kinds.includes(kind))) {
    return [];
  }
  return pending.filter(hint => !kinds.some(kind => reloadHintMatchesContentType(hint, kind)));
};

const clearPendingReloadLocally = (kinds: ContentKind[]) => {
  if (kinds.length === 0) {
    return;
  }

  installedPackages.value = installedPackages.value.map(pkg => ({
    ...pkg,
    pendingReload: stripPackagePendingReload(pkg, kinds),
  }));

  if (currentPackageDetail.value) {
    currentPackageDetail.value = {
      ...currentPackageDetail.value,
      pendingReload: stripPackagePendingReload(currentPackageDetail.value, kinds),
    };
  }
};

const setLoadingFlag = (
  target: { value: Record<string, boolean> },
  key: string,
  value: boolean,
) => {
  target.value[key] = value;
};

const unwrapStoreList = (response: any): { list: StorePackage[]; total: number } => {
  const payload = response?.data;
  if (Array.isArray(payload)) {
    return { list: payload, total: Number(response?.total ?? payload.length) };
  }
  if (payload && Array.isArray(payload.list)) {
    return {
      list: payload.list,
      total: Number(payload.total ?? response?.total ?? payload.list.length),
    };
  }
  if (payload && Array.isArray(payload.items)) {
    return {
      list: payload.items,
      total: Number(payload.total ?? response?.total ?? payload.items.length),
    };
  }
  return { list: [], total: Number(response?.total ?? 0) };
};

const refreshInstalledPackages = async () => {
  installedLoading.value = true;
  try {
    const response = await getPackageList();
    if (response.result) {
      installedPackages.value = Array.isArray(response.data) ? response.data : [];
    } else {
      installedPackages.value = [];
      ElMessage.error(getResponseError(response, '获取扩展包列表失败'));
    }
  } finally {
    installedLoading.value = false;
  }
};

const summarizePackageRefresh = (data?: PackageRefreshResult) => {
  if (!data) {
    return '扩展包目录已刷新';
  }
  const parts = [
    data.added?.length ? `新增 ${data.added.length}` : '',
    data.updated?.length ? `更新 ${data.updated.length}` : '',
    data.cacheOnly?.length ? `仅缓存 ${data.cacheOnly.length}` : '',
    data.removed?.length ? `移除 ${data.removed.length}` : '',
  ].filter(Boolean);
  return parts.length > 0 ? `扩展包目录已刷新：${parts.join('，')}` : '扩展包目录已刷新，无变更';
};

const handleRefreshPackageInstallations = async () => {
  installedDiskRefreshing.value = true;
  try {
    const response = await refreshPackageInstallations();
    if (!response.result) {
      ElMessage.error(getResponseError(response, '刷新扩展包目录失败'));
      return;
    }
    if (Array.isArray(response.data?.packages)) {
      installedPackages.value = response.data.packages;
    }
    ElMessage.success(summarizePackageRefresh(response.data));
    await refreshCurrentPackageDetail();
    await refreshCurrentStoreView();
  } finally {
    installedDiskRefreshing.value = false;
  }
};

const loadPackageDetail = async (pkg: PackageInstance) => {
  const packageId = getPackageId(pkg);
  currentPackageId.value = packageId;
  currentPackageDetail.value = pkg;
  currentPackageConfig.value = pkg.config ?? pkg.manifest.config ?? {};
  currentPackageSchema.value = {};
  packageDetailLoading.value = true;
  try {
    const [detailResp, configResp, schemaResp] = await Promise.all([
      getPackageDetail(packageId),
      getPackageConfig(packageId),
      getPackageConfigSchema(packageId),
    ]);

    if (detailResp.result && detailResp.data) {
      currentPackageDetail.value = detailResp.data;
    } else if (!detailResp.result) {
      ElMessage.error(getResponseError(detailResp, '获取扩展包详情失败'));
    }

    if (configResp.result) {
      currentPackageConfig.value = (configResp.data ?? {}) as Record<string, any>;
    } else {
      currentPackageConfig.value = pkg.config ?? pkg.manifest.config ?? {};
      ElMessage.error(getResponseError(configResp, '获取扩展包配置失败'));
    }

    if (schemaResp.result) {
      currentPackageSchema.value = schemaResp.data ?? {};
    } else {
      currentPackageSchema.value = {};
      ElMessage.error(getResponseError(schemaResp, '获取配置 Schema 失败'));
    }
  } finally {
    packageDetailLoading.value = false;
  }
};

const openPackageDetail = async (pkg: PackageInstance) => {
  packageDetailVisible.value = true;
  await loadPackageDetail(pkg);
};

const refreshCurrentPackageDetail = async (packageId = currentPackageId.value) => {
  if (!packageDetailVisible.value || !packageId) {
    return;
  }
  const refreshed = installedPackages.value.find(pkg => getPackageId(pkg) === packageId);
  if (!refreshed) {
    packageDetailVisible.value = false;
    currentPackageId.value = '';
    currentPackageDetail.value = null;
    currentPackageConfig.value = null;
    currentPackageSchema.value = {};
    return;
  }
  await loadPackageDetail(refreshed);
};

const handleSavePackageConfig = async (config: Record<string, any>) => {
  if (!currentPackageId.value) {
    return;
  }
  packageConfigSaving.value = true;
  try {
    const response = await setPackageConfig(currentPackageId.value, config);
    if (!response.result) {
      ElMessage.error(getResponseError(response, '保存扩展包配置失败'));
      return;
    }
    ElMessage.success('配置已保存');
    const current = installedPackages.value.find(
      pkg => getPackageId(pkg) === currentPackageId.value,
    );
    if (current) {
      await loadPackageDetail(current);
    }
    await refreshInstalledPackages();
  } finally {
    packageConfigSaving.value = false;
  }
};

const isContentFilter = (value: string): value is ContentFilter =>
  contentFilterOptions.some(item => item.value === value);

const handleReloadDropdownCommand = async (command: string | number | object) => {
  if (typeof command !== 'string' || !isContentFilter(command)) {
    return;
  }
  await handleReloadPackagesByContent(command);
};

const getReloadConfirmMessage = (target: ContentFilter, pendingCount: number) => {
  if (target === 'all') {
    return pendingCount > 0
      ? `将重载全部扩展包内容，其中 ${pendingCount} 个扩展包当前标记为需要重载。确认继续吗？`
      : '当前没有待重载的扩展包内容。确认仍要重载全部内容吗？';
  }
  return `当前没有待重载的${getContentLabel(target)}内容。确认仍要重载${getContentLabel(target)}吗？`;
};

const confirmReloadIfNeeded = async (target: ContentFilter, pendingCount: number) => {
  if (target !== 'all' && pendingCount > 0) {
    return true;
  }
  try {
    await ElMessageBox.confirm(getReloadConfirmMessage(target, pendingCount), '确认重载扩展包', {
      confirmButtonText: '确认重载',
      cancelButtonText: '取消',
      type: target === 'all' ? 'warning' : 'info',
    });
    return true;
  } catch {
    return false;
  }
};

const handleReloadPackagesByContent = async (target: ContentFilter = reloadContentTarget.value) => {
  reloadContentTarget.value = target;
  const pendingCount = getPendingReloadCount(target);
  const actionText = target === 'all' ? '全部内容' : getContentLabel(target);
  const confirmed = await confirmReloadIfNeeded(target, pendingCount);
  if (!confirmed) {
    return;
  }

  reloadAllLoading.value = true;
  try {
    const response =
      target === 'all' ? await reloadAllPackages() : await reloadPackageByContent(target);
    if (!response.result) {
      ElMessage.error(getResponseError(response, `${getContentLabel(target)}重载失败`));
      return;
    }
    const reloadedKinds = resolveReloadedKinds(
      target,
      response as { data?: { reloadedItems?: Record<string, string> } },
    );
    ElMessage.success(`已重载${actionText}，相关待重载项已清理。`);
    await refreshInstalledPackages();
    clearPendingReloadLocally(reloadedKinds);
    await refreshCurrentPackageDetail();
  } finally {
    reloadAllLoading.value = false;
  }
};

const handleEnablePackage = async (pkg: PackageInstance) => {
  if (isCacheOnlyPackage(pkg)) {
    ElMessage.warning(getPackageSourceWarning(pkg));
    return;
  }
  const packageId = getPackageId(pkg);
  setLoadingFlag(packageActionLoading, packageId, true);
  try {
    const response = await enablePackage(packageId);
    if (!response.result) {
      ElMessage.error(getResponseError(response, '启用扩展包失败'));
      return;
    }
    ElMessage.success('扩展包已启用；如有未重载项，请在顶部按类型重载。');
    await refreshInstalledPackages();
    await refreshCurrentPackageDetail(packageId);
  } finally {
    setLoadingFlag(packageActionLoading, packageId, false);
  }
};

const handleDisablePackage = async (pkg: PackageInstance) => {
  const packageId = getPackageId(pkg);
  try {
    await ElMessageBox.confirm(
      '确认禁用扩展包 ' + packageId + ' 吗？禁用后会删除临时缓存，重新启用时会自动重建。',
      '禁用扩展包',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  setLoadingFlag(packageActionLoading, packageId, true);
  try {
    const response = await disablePackage(packageId);
    if (!response.result) {
      ElMessage.error(getResponseError(response, '禁用扩展包失败'));
      return;
    }
    ElMessage.success('扩展包已禁用，已删掉临时缓存。');
    await refreshInstalledPackages();
    await refreshCurrentPackageDetail(packageId);
  } finally {
    setLoadingFlag(packageActionLoading, packageId, false);
  }
};

const openUninstallDialog = (pkg: PackageInstance) => {
  uninstallTarget.value = pkg;
  uninstallMode.value = 'full';
  uninstallDialogVisible.value = true;
};

const handleConfirmUninstall = async () => {
  if (!uninstallTarget.value) {
    return;
  }
  uninstallLoading.value = true;
  const packageId = getPackageId(uninstallTarget.value);
  try {
    const response = await uninstallPackage({ id: packageId, mode: uninstallMode.value });
    if (!response.result) {
      ElMessage.error(getResponseError(response, '卸载扩展包失败'));
      return;
    }
    ElMessage.success('扩展包卸载成功');
    uninstallDialogVisible.value = false;
    if (currentPackageId.value === packageId) {
      packageDetailVisible.value = false;
      currentPackageId.value = '';
      currentPackageDetail.value = null;
      currentPackageConfig.value = null;
      currentPackageSchema.value = {};
    }
    await refreshInstalledPackages();
    await refreshCurrentStoreView();
  } finally {
    uninstallLoading.value = false;
  }
};
const refreshStoreBackends = async () => {
  backendLoading.value = true;
  try {
    const response = await getStoreBackendList();
    if (response.result) {
      storeBackends.value = Array.isArray(response.data) ? response.data : [];
    } else {
      storeBackends.value = [];
      ElMessage.error(getResponseError(response, '获取仓库后端列表失败'));
    }
  } finally {
    backendLoading.value = false;
  }
};

const getBackendValue = (backend: StoreBackendRecord) => {
  return backend.backendID || backend.id || backend.url || '';
};

const looksUnreadableText = (value?: string) => {
  if (!value) {
    return true;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  const stripped = trimmed.replace(/[?？\[\]\d\s:_-]/g, '');
  return stripped.length === 0;
};

const getOfficialBackendLabel = (backend: StoreBackendRecord) => {
  const rawId = backend.id || backend.backendID || '';
  const match = rawId.match(/^official:(\d+)$/);
  if (match) {
    return `官方仓库 [节点 ${match[1]}]`;
  }
  return '官方仓库';
};

const getBackendLabel = (backend: StoreBackendRecord) => {
  if (backend.name && !looksUnreadableText(backend.name)) {
    return backend.name;
  }
  if (
    backend.type === 'official' ||
    (backend.id || backend.backendID || '').startsWith('official')
  ) {
    return getOfficialBackendLabel(backend);
  }
  return backend.backendID || backend.id || backend.url || '未命名后端';
};

const getBackendExtra = (backend: StoreBackendRecord) => {
  const extras = [
    backend.url,
    backend.backendID && backend.backendID !== backend.name
      ? `backendID: ${backend.backendID}`
      : '',
  ]
    .filter(Boolean)
    .join(' | ');
  return extras || '无附加信息';
};

const getBackendKey = (backend: StoreBackendRecord) => {
  return getBackendValue(backend) || getBackendLabel(backend);
};

const isBuiltinBackend = (backend: StoreBackendRecord) =>
  Boolean(backend.builtin || backend.official || backend.type === 'official');

const isBackendEnabled = (backend: StoreBackendRecord) => {
  if (typeof backend.enabled === 'boolean') {
    return backend.enabled;
  }
  if (typeof backend.disabled === 'boolean') {
    return !backend.disabled;
  }
  return true;
};

const enabledStoreBackends = computed(() => storeBackends.value.filter(isBackendEnabled));

const getBackendActionPayload = (backend: StoreBackendRecord) => {
  if (backend.backendID) {
    return { backendID: backend.backendID };
  }
  if (backend.id) {
    return { id: backend.id };
  }
  if (backend.url) {
    return { url: backend.url };
  }
  return backend;
};

const handleAddBackend = async () => {
  const url = backendInput.value.trim();
  if (!url) {
    ElMessage.warning('请输入仓库 URL');
    return;
  }
  backendAddLoading.value = true;
  try {
    const response = await addStoreBackend(url);
    if (!response.result) {
      ElMessage.error(getResponseError(response, '添加仓库后端失败'));
      return;
    }
    ElMessage.success('仓库后端已添加');
    backendInput.value = '';
    await refreshStoreBackends();
  } finally {
    backendAddLoading.value = false;
  }
};

const handleToggleBackend = async (backend: StoreBackendRecord, enabled: boolean) => {
  const key = getBackendKey(backend);
  setLoadingFlag(backendToggleLoading, key, true);
  try {
    const response = await setStoreBackendEnabled(getBackendActionPayload(backend), enabled);
    if (!response.result) {
      ElMessage.error(
        getResponseError(response, enabled ? '启用仓库后端失败' : '禁用仓库后端失败'),
      );
      return;
    }
    ElMessage.success(enabled ? '仓库后端已启用' : '仓库后端已禁用');
    await refreshStoreBackends();
    if (!enabled && storeQuery.backend === getBackendValue(backend)) {
      storeQuery.backend = '';
    }
    await refreshCurrentStoreView();
  } finally {
    setLoadingFlag(backendToggleLoading, key, false);
  }
};

const handleRemoveBackend = async (backend: StoreBackendRecord) => {
  const key = getBackendKey(backend);
  try {
    await ElMessageBox.confirm(
      `确认删除仓库后端「${getBackendLabel(backend)}」吗？`,
      '删除仓库后端',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  setLoadingFlag(backendRemoveLoading, key, true);
  try {
    const response = await removeStoreBackend(getBackendActionPayload(backend));
    if (!response.result) {
      ElMessage.error(getResponseError(response, '删除仓库后端失败'));
      return;
    }
    ElMessage.success('仓库后端已删除');
    await refreshStoreBackends();
    if (storeQuery.backend === getBackendValue(backend)) {
      storeQuery.backend = '';
      await refreshCurrentStoreView();
    }
  } finally {
    setLoadingFlag(backendRemoveLoading, key, false);
  }
};

const buildStoreQuery = () => {
  const query: StorePageQuery = {
    pageNum: storeQuery.pageNum,
    pageSize: storeQuery.pageSize,
  };
  if (storeQuery.backend) {
    query.backend = storeQuery.backend;
  }
  if (storeQuery.content !== 'all') {
    query.content = storeQuery.content;
  }
  if (storeQuery.author.trim()) {
    query.author = storeQuery.author.trim();
  }
  if (storeQuery.name.trim()) {
    query.name = storeQuery.name.trim();
  }
  if (storeQuery.category.trim()) {
    query.category = storeQuery.category.trim();
  }
  if (storeQuery.sortBy.trim()) {
    query.sortBy = storeQuery.sortBy.trim();
  }
  if (storeQuery.order.trim()) {
    query.order = storeQuery.order.trim();
  }
  return query;
};

const loadStoreRecommend = async () => {
  storeViewMode.value = 'recommend';
  storeLoading.value = true;
  try {
    const response = await getStoreRecommend(
      storeQuery.backend ? { backend: storeQuery.backend } : undefined,
    );
    if (!response.result) {
      storePackages.value = [];
      storeTotal.value = 0;
      ElMessage.error(getResponseError(response, '获取商店推荐失败'));
      return;
    }
    const { list, total } = unwrapStoreList(response);
    storePackages.value = list;
    storeTotal.value = total || list.length;
  } finally {
    storeLoading.value = false;
  }
};

const searchStorePackages = async () => {
  storeViewMode.value = 'search';
  storeLoading.value = true;
  try {
    const response = await getStorePage(buildStoreQuery());
    if (!response.result) {
      storePackages.value = [];
      storeTotal.value = 0;
      ElMessage.error(getResponseError(response, '搜索商店扩展包失败'));
      return;
    }
    const { list, total } = unwrapStoreList(response);
    storePackages.value = list;
    storeTotal.value = total || list.length;
  } finally {
    storeLoading.value = false;
  }
};

const refreshCurrentStoreView = async () => {
  if (!storeLoadStarted.value) {
    return;
  }
  if (storeViewMode.value === 'search') {
    await searchStorePackages();
  } else {
    await loadStoreRecommend();
  }
};

const handleStorePageChange = async (page: number) => {
  storeQuery.pageNum = page;
  await searchStorePackages();
};

const openStoreDetail = (pkg: StorePackage) => {
  currentStorePackage.value = pkg;
  storeDetailVisible.value = true;
};

const ensureStoreLoaded = async () => {
  if (storeLoadStarted.value) {
    return;
  }
  storeLoadStarted.value = true;
  try {
    await Promise.all([refreshStoreBackends(), loadStoreRecommend()]);
  } catch {
    storeLoadStarted.value = false;
  }
};

const getStorePackageKey = (pkg: StorePackage) => `${pkg.id}@${pkg.version}`;

const isStoreInstalled = (pkg: StorePackage) =>
  Boolean(pkg.installed || installedPackageIdSet.value.has(pkg.id));

const handleDownloadStorePackage = async (pkg: StorePackage) => {
  const actionText = isStoreInstalled(pkg) ? '安装/升级' : '安装';
  try {
    await ElMessageBox.confirm(
      `确认${actionText}扩展包「${pkg.id} @ ${pkg.version}」吗？`,
      `${actionText}扩展包`,
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  const key = getStorePackageKey(pkg);
  setLoadingFlag(storeDownloadLoading, key, true);
  try {
    const response = await downloadStorePackage({ id: pkg.id, version: pkg.version });
    if (!response.result) {
      ElMessage.error(getResponseError(response, `${actionText}扩展包失败`));
      return;
    }
    ElMessage.success(`${actionText}请求已提交`);
    await refreshInstalledPackages();
    await refreshCurrentStoreView();
  } finally {
    setLoadingFlag(storeDownloadLoading, key, false);
  }
};

type InstalledPackageSnapshot = {
  id: string;
  version: string;
  installTime: number;
};

type InstallAutoEnableResult =
  | { status: 'skipped' }
  | { status: 'not_found' }
  | {
      status: 'enabled' | 'already_enabled' | 'failed';
      packageId: string;
      message?: string;
    };

const getPackageInstallTimestamp = (pkg: PackageInstance) => {
  const normalized = normalizeTimeValue(pkg.installTime);
  if (!normalized) {
    return 0;
  }
  const parsed = dayjs(normalized);
  return parsed.isValid() ? parsed.valueOf() : 0;
};

const captureInstalledPackageSnapshot = (): InstalledPackageSnapshot[] =>
  installedPackages.value.map(pkg => ({
    id: getPackageId(pkg),
    version: getPackageVersion(pkg),
    installTime: getPackageInstallTimestamp(pkg),
  }));

const findPostInstallPackage = (
  beforeInstallPackages: InstalledPackageSnapshot[],
): PackageInstance | null => {
  const beforeById = new Map(beforeInstallPackages.map(pkg => [pkg.id, pkg]));

  if (beforeInstallPackages.length > 0) {
    const newPackage = installedPackages.value.find(pkg => !beforeById.has(getPackageId(pkg)));
    if (newPackage) {
      return newPackage;
    }

    const upgradedPackage = installedPackages.value.find(pkg => {
      const previous = beforeById.get(getPackageId(pkg));
      return Boolean(previous && previous.version !== getPackageVersion(pkg));
    });
    if (upgradedPackage) {
      return upgradedPackage;
    }
  }

  return (
    [...installedPackages.value].sort(
      (left, right) => getPackageInstallTimestamp(right) - getPackageInstallTimestamp(left),
    )[0] ?? null
  );
};

const enableInstalledPackageAfterInstall = async (
  pkg: PackageInstance | null,
  autoEnable: boolean,
): Promise<InstallAutoEnableResult> => {
  if (!autoEnable) {
    return { status: 'skipped' };
  }
  if (!pkg) {
    return { status: 'not_found' };
  }

  const packageId = getPackageId(pkg);
  if (pkg.state === 'enabled') {
    return { status: 'already_enabled', packageId };
  }

  setLoadingFlag(packageActionLoading, packageId, true);
  try {
    const response = await enablePackage(packageId);
    if (!response.result) {
      return {
        status: 'failed',
        packageId,
        message: getResponseError(response, '自动启用扩展包失败'),
      };
    }
    return { status: 'enabled', packageId };
  } finally {
    setLoadingFlag(packageActionLoading, packageId, false);
  }
};

const getPostInstallNotice = (result: InstallAutoEnableResult) => {
  switch (result.status) {
    case 'enabled':
      return `扩展包「${result.packageId}」已安装并自动启用。请切到“已安装包”页面，点击顶部“重载”进行重载后生效。`;
    case 'already_enabled':
      return `扩展包「${result.packageId}」已安装且已处于启用状态。请切到“已安装包”页面，点击顶部“重载”进行重载后生效。`;
    case 'failed':
      return `扩展包已安装，但自动启用「${result.packageId}」失败：${result.message ?? '未知错误'}。请切到“已安装包”页面手动启用，并点击顶部“重载”进行重载后生效。`;
    case 'not_found':
      return '扩展包已安装，但未能定位新安装的包。请切到“已安装包”页面检查启用状态，并点击顶部“重载”进行重载后生效。';
    case 'skipped':
    default:
      return '扩展包已安装。请切到“已安装包”页面启用扩展包，并在启用后点击顶部“重载”进行重载后生效。';
  }
};

const getPostInstallNoticeType = (
  result: InstallAutoEnableResult,
): 'success' | 'warning' | 'info' => {
  if (result.status === 'failed' || result.status === 'not_found') {
    return 'warning';
  }
  if (result.status === 'skipped') {
    return 'info';
  }
  return 'success';
};

const showPostInstallNotice = async (message: string, type: 'success' | 'warning' | 'info') => {
  try {
    await ElMessageBox.alert(message, '扩展包安装完成', {
      confirmButtonText: '去已安装包',
      type,
    });
    activeTab.value = 'installed';
  } catch {
    return;
  }
};

const handlePostInstallSuccess = async (
  beforeInstallPackages: InstalledPackageSnapshot[],
  autoEnable: boolean,
) => {
  await refreshInstalledPackages();
  const installedPackage = findPostInstallPackage(beforeInstallPackages);
  const autoEnableResult = await enableInstalledPackageAfterInstall(installedPackage, autoEnable);

  if (autoEnableResult.status === 'enabled') {
    await refreshInstalledPackages();
  }
  if (autoEnableResult.status === 'enabled' || autoEnableResult.status === 'already_enabled') {
    await refreshCurrentPackageDetail(autoEnableResult.packageId);
  }
  await refreshCurrentStoreView();

  void showPostInstallNotice(
    getPostInstallNotice(autoEnableResult),
    getPostInstallNoticeType(autoEnableResult),
  );
};

const resetInstallUploadProgress = () => {
  installUploadProgress.value = 0;
  installUploadProgressStatus.value = undefined;
  installUploadProgressText.value = '';
};

const updateInstallUploadProgress = (phase: string, loaded: number, total?: number) => {
  if (total && total > 0) {
    installUploadProgress.value = Math.min(99, Math.round((loaded / total) * 100));
  } else if (loaded > 0) {
    installUploadProgress.value = Math.max(installUploadProgress.value, 1);
  }
  installUploadProgressText.value = phase;
};

const getUploadPreviewContentsText = (preview: PackageUploadPreview) => {
  const counts = preview.contentCounts ?? {};
  const items = (
    ['scripts', 'decks', 'reply', 'helpdoc', 'templates', 'assets'] as Array<ContentKind | 'assets'>
  )
    .map(kind => ({ kind, count: counts[kind] ?? 0 }))
    .filter(item => item.count > 0)
    .map(item => `${getUploadPreviewContentLabel(item.kind)} ${item.count} 个`);
  return items.length > 0 ? items.join('、') : '未声明扩展内容';
};

const getUploadPreviewFileSamples = (preview: PackageUploadPreview) =>
  preview.files.slice(0, 8).join('\n') +
  (preview.files.length > 8 ? `\n...另有 ${preview.files.length - 8} 个文件` : '');

const getUploadPreviewMessage = (preview: PackageUploadPreview, file: UploadRawFile) => {
  const info = preview.manifest.package;
  const actionText =
    preview.installAction === 'upgrade'
      ? `升级已安装版本 ${preview.existingVersion ?? '-'} -> ${info.version}`
      : '全新安装';
  return [
    `文件：${file.name}`,
    `包名：${info.name || info.id}`,
    `ID：${info.id}`,
    `版本：${info.version}`,
    `作者：${joinList(info.authors)}`,
    `描述：${info.description || '暂无描述'}`,
    `内容：${getUploadPreviewContentsText(preview)}`,
    `文件数：${preview.fileCount}`,
    `动作：${actionText}`,
    '',
    '将安装的文件预览：',
    getUploadPreviewFileSamples(preview),
  ].join('\n');
};

const previewInstallUpload = async (file: UploadRawFile) => {
  installUploadProgressText.value = '正在上传并解析扩展包预览...';
  try {
    const response = await previewPackageUpload(file, event => {
      updateInstallUploadProgress('正在上传并解析扩展包预览...', event.loaded, event.total);
    });
    if (!response.result || !response.data) {
      throw new Error(getResponseError(response, '扩展包预览失败'));
    }
    installUploadProgress.value = 100;
    installUploadProgressStatus.value = 'success';
    installUploadProgressText.value = '预览解析完成';
    return response.data;
  } catch (error) {
    installUploadProgress.value = Math.max(installUploadProgress.value, 1);
    installUploadProgressStatus.value = 'exception';
    installUploadProgressText.value = '扩展包预览失败';
    throw error;
  }
};

const confirmInstallUploadPreview = async (preview: PackageUploadPreview, file: UploadRawFile) => {
  try {
    await ElMessageBox.confirm(getUploadPreviewMessage(preview, file), '确认上传安装扩展包', {
      confirmButtonText: installUploadAutoEnable.value ? '安装并启用' : '仅安装',
      cancelButtonText: '取消',
      type: 'info',
      customClass: 'package-upload-preview-message',
    });
    return true;
  } catch {
    return false;
  }
};

const isSealPackageUploadFile = (file: UploadRawFile) =>
  file.name.toLowerCase().endsWith('.sealpack');

const handleInstallUploadFileChange = (uploadFile: UploadFile) => {
  const rawFile = uploadFile.raw;
  if (!rawFile) {
    installUploadRawFile.value = null;
    installUploadFileList.value = [];
    return;
  }
  if (!isSealPackageUploadFile(rawFile)) {
    ElMessage.warning('请选择 .sealpack 文件');
    installUploadRawFile.value = null;
    installUploadFileList.value = [];
    return;
  }
  installUploadRawFile.value = rawFile;
  installUploadFileList.value = [uploadFile];
};

const handleInstallUploadFileRemove = (_uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  installUploadFileList.value = uploadFiles;
  installUploadRawFile.value = uploadFiles[uploadFiles.length - 1]?.raw ?? null;
};

const handleInstallByUpload = async () => {
  const file = installUploadRawFile.value;
  if (!file) {
    ElMessage.warning('请选择要上传的 .sealpack 文件');
    return;
  }
  if (!isSealPackageUploadFile(file)) {
    ElMessage.warning('请选择 .sealpack 文件');
    return;
  }

  const beforeInstallPackages = captureInstalledPackageSnapshot();
  installByUploadLoading.value = true;
  resetInstallUploadProgress();
  try {
    const preview = await previewInstallUpload(file);
    const confirmed = await confirmInstallUploadPreview(preview, file);
    if (!confirmed) {
      resetInstallUploadProgress();
      return;
    }

    installUploadProgress.value = 0;
    installUploadProgressStatus.value = undefined;
    installUploadProgressText.value = '正在上传并安装扩展包...';
    const response = await installPackageByUpload(file, event => {
      updateInstallUploadProgress('正在上传并安装扩展包...', event.loaded, event.total);
    });
    if (!response.result) {
      installUploadProgress.value = Math.max(installUploadProgress.value, 1);
      installUploadProgressStatus.value = 'exception';
      installUploadProgressText.value = '上传安装失败';
      ElMessage.error(getResponseError(response, '上传安装失败'));
      return;
    }
    installUploadProgress.value = 100;
    installUploadProgressStatus.value = 'success';
    installUploadProgressText.value = '上传安装完成';
    installUploadRawFile.value = null;
    installUploadFileList.value = [];
    await handlePostInstallSuccess(beforeInstallPackages, installUploadAutoEnable.value);
  } catch (error) {
    if (installUploadProgressStatus.value !== 'exception') {
      installUploadProgress.value = Math.max(installUploadProgress.value, 1);
      installUploadProgressStatus.value = 'exception';
      installUploadProgressText.value = '上传安装失败';
    }
    ElMessage.error(getErrorMessage(error, '上传安装失败'));
  } finally {
    installByUploadLoading.value = false;
  }
};

const handleInstallByUrl = async () => {
  const url = installUrlInput.value.trim();
  if (!url) {
    ElMessage.warning('请输入扩展包 URL');
    return;
  }
  const beforeInstallPackages = captureInstalledPackageSnapshot();
  installByUrlLoading.value = true;
  try {
    const response = await installPackageByUrl({ url });
    if (!response.result) {
      ElMessage.error(getResponseError(response, 'URL 安装失败'));
      return;
    }
    installUrlInput.value = '';
    await handlePostInstallSuccess(beforeInstallPackages, installUrlAutoEnable.value);
  } finally {
    installByUrlLoading.value = false;
  }
};

watch(activeTab, tab => {
  if (tab === 'store') {
    void ensureStoreLoaded();
  }
});

onBeforeMount(async () => {
  await refreshInstalledPackages();
  if (activeTab.value === 'store') {
    await ensureStoreLoaded();
  }
});
</script>

<style scoped lang="css">
.package-page-shell {
  --package-blue: #2f73f6;
  --package-blue-soft: #edf4ff;
  --package-border: #e2e9f2;
  --package-text: #101f3c;
  --package-muted: #5f718c;
  --package-line: #e7edf5;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin-top: -0.65rem;
  color: var(--package-text);
}

.package-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.package-header-main {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 2.4rem;
}

.package-page-title {
  margin: 0;
  color: #0d1b34;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.package-page-description {
  margin: 0;
  color: #607089;
  font-size: 14px;
  line-height: 1.65;
}

.package-update-card {
  flex: 0 0 auto;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0 0.48rem;
  border: 1px solid #e6ebf2;
  border-radius: 0.38rem;
  background: #f5f8fc;
  color: #34445d;
  cursor: pointer;
}

.package-update-card.is-loading {
  opacity: 0.72;
}

.package-update-card-icon {
  display: none;
}

.package-update-card-label {
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.package-update-card-badge {
  min-width: 14px;
  height: 14px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--package-blue);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}

.package-main-panel {
  background: transparent;
  border: 0;
  box-shadow: none;
}

.package-tabs :deep(.el-tabs__header) {
  margin: 0 0 1.15rem;
}

.package-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: #dce4ef;
}

.package-tabs :deep(.el-tabs__active-bar) {
  height: 2px;
  border-radius: 999px;
  background: var(--package-blue);
}

.package-tabs :deep(.el-tabs__item) {
  height: 40px;
  padding: 0 1.25rem;
  color: #1f2f48;
  font-size: 14px;
  font-weight: 600;
}

.package-tabs :deep(.el-tabs__item.is-active) {
  color: var(--package-blue);
}

.package-tabs :deep(.el-tabs__content) {
  overflow: visible;
}

.installed-tab-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.installed-toolbar {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.toolbar-search {
  flex: 0 1 23.5rem;
  width: 23.5rem;
  min-width: 15rem;
}

.toolbar-select {
  flex: 0 0 7.2rem;
  width: 7.2rem;
}

.reload-dropdown {
  flex: 0 0 auto;
}

.reload-dropdown-button {
  min-width: 6rem;
  height: 36px;
  border-radius: 0.45rem;
  color: #263852;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.reload-button-count {
  min-width: 18px;
  height: 18px;
  margin-left: 0.25rem;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #edf4ff;
  color: var(--package-blue);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

:global(.reload-dropdown-item) {
  min-width: 9.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

:global(.reload-dropdown-count) {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #eef4ff;
  color: var(--package-blue);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.installed-disk-refresh-button,
.installed-refresh-button {
  min-width: 6.8rem;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  border-radius: 0.45rem;
  border-color: #dfe7f1;
  color: #263852;
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.installed-disk-refresh-button {
  min-width: 5.8rem;
  margin-left: auto;
}

.installed-toolbar :deep(.installed-refresh-button.el-button) {
  margin-left: 0;
}

.installed-toolbar :deep(.installed-disk-refresh-button .el-icon),
.installed-toolbar :deep(.installed-refresh-button .el-icon) {
  align-self: center;
}

.installed-toolbar :deep(.el-input__wrapper),
.installed-toolbar :deep(.el-select__wrapper) {
  min-height: 36px;
  border-radius: 0.45rem;
  background: #fff;
  box-shadow: 0 0 0 1px var(--package-border) inset;
}

.installed-toolbar :deep(.el-input__wrapper:hover),
.installed-toolbar :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px #c7d7ee inset;
}

.package-list-surface {
  border: 1px solid var(--package-border);
  border-radius: 0.55rem;
  background: #fff;
  padding: 0 0.95rem 0.9rem;
  box-shadow: 0 12px 28px -26px rgba(15, 23, 42, 0.3);
}

.package-card-list {
  display: flex;
  flex-direction: column;
}

.package-card {
  min-width: 0;
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr);
  gap: 1.25rem;
  padding: 1.22rem 0;
}

.package-card.source-cache-only {
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.08), rgba(255, 255, 255, 0) 34%);
}

.package-card + .package-card {
  border-top: 1px solid var(--package-line);
}

.package-card-media {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.55rem;
  color: #fff;
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1;
}

.package-card-media.accent-all,
.package-card-media.accent-decks {
  background: linear-gradient(135deg, #2f73f6, #5d9cff);
}

.package-card-media.accent-scripts {
  background: linear-gradient(135deg, #f2a400, #ffc22a);
}

.package-card-media.accent-reply {
  background: linear-gradient(135deg, #31bd55, #53d675);
}

.package-card-media.accent-helpdoc {
  background: linear-gradient(135deg, #10aeca, #35cde5);
}

.package-card-media.accent-templates {
  background: linear-gradient(135deg, #f85c5c, #ff7f39);
}

.package-card-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.package-card-avatar-fallback {
  color: #fff;
  font-size: 1.45rem;
  font-weight: 800;
}

.package-card-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.package-card-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: start;
}

.package-card-heading {
  min-width: 0;
}

.package-card-title-row {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
}

.package-card-title {
  margin: 0;
  color: #0f1f3a;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
}

.package-card-description {
  margin: 0.32rem 0 0;
  color: #263852;
  font-size: 14px;
  line-height: 1.55;
}

.package-card-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.7rem;
  justify-content: flex-end;
}

.package-card-actions :deep(.el-button) {
  min-width: 3.95rem;
  height: 32px;
  margin-left: 0;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.package-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.package-chip {
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 0.66rem;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}

.package-chip-id {
  overflow-wrap: anywhere;
  word-break: break-word;
  min-height: auto;
  padding: 0;
  border-radius: 0;
  background: transparent;
  color: #6b7c92;
  font-size: 12px;
  font-weight: 500;
}

.package-chip-version {
  background: #f1f5fa;
  color: #596a80;
}

.package-chip-state.state-enabled {
  background: #dcfce7;
  color: #14843b;
}

.package-chip-state.state-disabled,
.package-chip-state.state-installed {
  background: #fef3c7;
  color: #b45309;
}

.package-chip-state.state-error {
  background: #fee2e2;
  color: #b91c1c;
}

.package-chip-source-warning {
  border: 1px solid #fed7aa;
  background: #fff7ed;
  color: #c2410c;
}

.package-chip-content {
  background: #eef4ff;
  color: var(--package-blue);
}

.package-chip-keyword {
  background: #f4f6f9;
  color: #34445d;
}

.package-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 1.25rem;
  color: #62738b;
  font-size: 13px;
  line-height: 1.6;
}

.package-meta-item {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  overflow-wrap: anywhere;
}

.package-meta-item .el-icon {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 14px;
}

.package-meta-path {
  flex: 1 1 18rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.package-empty {
  padding: 1.4rem 0;
}

.installed-list-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.installed-list-count {
  color: #263852;
  font-size: 0.9rem;
  font-weight: 700;
}

.installed-list-footer :deep(.el-pagination) {
  margin-left: auto;
}

.package-main-panel :deep(.el-pagination.is-background .btn-prev),
.package-main-panel :deep(.el-pagination.is-background .btn-next),
.package-main-panel :deep(.el-pagination.is-background .el-pager li) {
  min-width: 2rem;
  border-radius: 0.35rem;
  background: #f3f6fa;
  color: #607089;
}

.package-main-panel :deep(.el-pagination.is-background .el-pager li.is-active) {
  background: var(--package-blue);
  color: #fff;
}

.section-card {
  margin-bottom: 1rem;
  border: 1px solid var(--package-border);
  border-radius: 0.55rem;
  box-shadow: none;
}

.section-card :deep(.el-card__header) {
  padding: 0.95rem 1.1rem;
  border-bottom: 1px solid var(--package-line);
  background: #fff;
}

.section-card :deep(.el-card__body) {
  padding: 1.1rem;
}

.section-card-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
}

.backend-add-row {
  margin-bottom: 1rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
}

.backend-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.backend-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  background: #f8fafc;
}

.backend-item-main {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.35rem;
}

.backend-item-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 1.8rem;
}

.store-query-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 1rem;
}

.result-hint {
  margin-bottom: 0.75rem;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.table-wrap :deep(.el-table) {
  border-radius: 0.55rem;
  overflow: hidden;
}

.table-wrap :deep(.el-table th.el-table__cell) {
  background: #f8fafc;
  color: #475569;
}

.pagination-row {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.install-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: 1rem;
}

.install-upload-tip {
  margin-top: 0.45rem;
  color: var(--package-muted);
  font-size: 0.82rem;
}

.install-upload-progress {
  margin-top: 0.8rem;
}

.install-upload-progress-text {
  margin-top: 0.35rem;
  color: var(--package-muted);
  font-size: 0.82rem;
}

.break-text {
  white-space: pre-wrap;
  word-break: break-all;
}

:global(.package-upload-preview-message .el-message-box__message) {
  white-space: pre-wrap;
  word-break: break-word;
}

@media screen and (max-width: 960px) {
  .package-page-header,
  .package-header-main {
    flex-direction: column;
    align-items: stretch;
    gap: 0.45rem;
  }

  .package-update-card {
    align-self: flex-start;
  }

  .installed-toolbar {
    flex-wrap: wrap;
  }

  .toolbar-search {
    flex: 1 1 100%;
    width: 100%;
  }

  .installed-refresh-button {
    margin-left: 0;
  }

  .installed-disk-refresh-button {
    margin-left: 0;
  }

  .package-card-head {
    grid-template-columns: minmax(0, 1fr);
  }

  .package-card-actions {
    justify-content: flex-start;
  }

  .store-query-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media screen and (max-width: 768px) {
  .package-page-title {
    font-size: 1.35rem;
  }

  .package-tabs :deep(.el-tabs__item) {
    padding: 0 0.7rem;
  }

  .package-card {
    grid-template-columns: minmax(0, 1fr);
    padding: 1rem 0;
  }

  .package-card-media {
    width: 56px;
    height: 56px;
  }

  .package-card-actions {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .package-card-title-row,
  .package-card-meta {
    min-width: 0;
  }

  .package-chip-id,
  .package-meta-path {
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .package-list-surface,
  .section-card :deep(.el-card__body) {
    padding-inline: 0.85rem;
  }

  .backend-add-row,
  .install-grid,
  .store-query-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .backend-item {
    flex-direction: column;
    align-items: stretch;
  }

  .backend-item-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .toolbar-select,
  .reload-dropdown,
  .reload-dropdown-button,
  .installed-disk-refresh-button,
  .installed-refresh-button {
    flex: 1 1 100%;
    width: 100%;
  }

  .installed-list-footer,
  .pagination-row {
    justify-content: flex-start;
  }

  .installed-list-footer :deep(.el-pagination) {
    margin-left: 0;
  }
}
</style>
