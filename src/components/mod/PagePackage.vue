<template>
  <section class="package-page-shell">
    <header class="package-page-header">
      <div class="package-header-main">
        <h2 class="package-page-title">扩展包</h2>
        <p class="package-page-description">统一管理已安装包、商店推荐以及上传 / URL 安装。</p>
      </div>

      <div class="package-update-actions" :class="{ 'has-pending': hasPendingReloadPackages }">
        <button
          type="button"
          class="package-update-card"
          :class="{ 'is-loading': reloadAllLoading, 'has-pending': hasPendingReloadPackages }"
          @click="handleReloadPackagesByContent()">
          <span class="package-update-card-icon" aria-hidden="true"></span>
          <span class="package-update-card-label">重载扩展</span>
          <span class="package-update-card-badge">{{ pendingReloadPackageCount }}</span>
        </button>
        <el-dropdown
          class="package-update-dropdown"
          trigger="click"
          :hide-on-click="true"
          @command="handleReloadDropdownCommand">
          <button
            type="button"
            class="package-update-dropdown-trigger"
            :class="{ 'has-pending': hasPendingReloadPackages }"
            :disabled="reloadAllLoading"
            aria-label="选择重载内容">
            <el-icon><CaretBottom /></el-icon>
          </button>
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
      </div>
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
              <el-button
                plain
                class="installed-export-button"
                :icon="Download"
                :disabled="installedPackages.length === 0"
                @click="installedExportVisible = true">
                导出清单
              </el-button>
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
                      v-if="getPackageIconUrl(pkg)"
                      :src="getPackageIconUrl(pkg)"
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
                        <el-button
                          v-if="getInstalledPackageStoreDetailHref(pkg)"
                          plain
                          size="small"
                          tag="a"
                          :icon="TopRight"
                          :href="getInstalledPackageStoreDetailHref(pkg)"
                          target="_blank"
                          rel="noopener noreferrer">
                          商店
                        </el-button>
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
                <span>扩展包商店</span>
                <el-button plain :icon="DocumentAdd" @click="openManifestInstallDialog">
                  从清单安装
                </el-button>
              </div>
            </template>

            <div class="store-search-bar">
              <el-input
                v-model="storeQuery.name"
                class="store-search-input"
                clearable
                :prefix-icon="Search"
                placeholder="搜索扩展包名称"
                @clear="handleStoreSearch"
                @keyup.enter="handleStoreSearch" />
              <el-button
                type="primary"
                :icon="Search"
                :loading="storeLoading"
                @click="handleStoreSearch">
                搜索
              </el-button>
            </div>

            <div class="table-wrap">
              <el-table v-loading="storeLoading" :data="storePackages" stripe>
                <el-table-column label="名称" min-width="220">
                  <template #default="scope">
                    <div class="store-package-name-cell">
                      <span
                        class="store-package-icon"
                        :class="`accent-${getStorePackageAccent(scope.row)}`">
                        <img
                          v-if="getStorePackageIconUrl(scope.row)"
                          :src="getStorePackageIconUrl(scope.row)"
                          alt=""
                          class="store-package-icon-image" />
                        <span v-else class="store-package-icon-fallback">{{
                          getStorePackageAvatarText(scope.row)
                        }}</span>
                      </span>
                      <span class="store-package-name-main">
                        <span class="store-package-name-title">{{ scope.row.name }}</span>
                        <span class="store-package-name-version">{{ scope.row.version }}</span>
                      </span>
                    </div>
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
                <el-table-column label="大小" min-width="110" align="right">
                  <template #default="scope">
                    <span class="store-package-size">{{ formatStorePackageSize(scope.row) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="安装状态" min-width="120">
                  <template #default="scope">
                    <el-tag :type="isStoreInstalled(scope.row) ? 'success' : 'info'">
                      {{ isStoreInstalled(scope.row) ? '已安装' : '未安装' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" width="220">
                  <template #default="scope">
                    <div class="store-package-actions">
                      <el-link
                        class="store-detail-link"
                        type="primary"
                        :underline="false"
                        :href="getStorePackageDetailHref(scope.row)"
                        target="_blank"
                        rel="noopener noreferrer">
                        <el-icon class="store-detail-link-icon"><TopRight /></el-icon>
                        <span>查看详情</span>
                      </el-link>
                      <el-button
                        v-if="findInstalledPackageByStore(scope.row)"
                        link
                        size="small"
                        type="danger"
                        @click="handleStoreUninstall(scope.row)">
                        卸载
                      </el-button>
                      <el-button
                        link
                        size="small"
                        type="primary"
                        :loading="isStorePackageActionLoading(scope.row)"
                        @click="handleOpenStoreInstallPreview(scope.row)">
                        {{ getStoreActionText(scope.row) }}
                      </el-button>
                    </div>
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

        <el-tab-pane label="其他" name="manage">
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
                <el-form-item>
                  <el-checkbox
                    v-model="installUploadAutoReload"
                    :disabled="!installUploadAutoEnable">
                    安装并启用后自动重载
                  </el-checkbox>
                  <div class="install-reload-tip">
                    如果插件很多，重载会花费较长时间，特别是帮助文档。
                  </div>
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
                <el-form-item>
                  <el-checkbox v-model="installUrlAutoReload" :disabled="!installUrlAutoEnable">
                    安装并启用后自动重载
                  </el-checkbox>
                  <div class="install-reload-tip">
                    如果插件很多，重载会花费较长时间，特别是帮助文档。
                  </div>
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
    :store-detail-url="currentPackageStoreDetailUrl"
    @save-config="handleSavePackageConfig" />

  <el-dialog
    v-model="installedExportVisible"
    title="导出扩展包清单"
    width="680px"
    class="installed-export-dialog">
    <div class="installed-export-content">
      <div class="installed-export-count">共 {{ installedPackageListItems.length }} 个扩展包</div>
      <el-input
        :model-value="installedExportContent"
        type="textarea"
        :rows="12"
        resize="vertical"
        readonly />
    </div>
    <template #footer>
      <el-button @click="installedExportVisible = false">关闭</el-button>
      <el-button plain :icon="CopyDocument" @click="copyInstalledPackageList">复制</el-button>
      <el-button type="primary" :icon="Download" @click="downloadInstalledPackageList">
        下载
      </el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="manifestInstallVisible"
    title="从清单安装扩展包"
    width="760px"
    class="manifest-install-dialog"
    :close-on-click-modal="!manifestInstallLoading"
    :close-on-press-escape="!manifestInstallLoading"
    :show-close="!manifestInstallLoading">
    <div class="manifest-install-content">
      <input
        ref="manifestInstallFileInput"
        class="manifest-install-file-input"
        type="file"
        accept=".toml,application/toml,text/plain"
        @change="handleManifestInstallFileChange" />

      <div class="manifest-install-source-actions">
        <el-button
          plain
          :icon="Upload"
          :disabled="manifestInstallLoading"
          @click="manifestInstallFileInput?.click()">
          选择清单文件
        </el-button>
        <span v-if="manifestInstallFileName" class="manifest-install-file-name">
          {{ manifestInstallFileName }}
        </span>
      </div>

      <el-input
        v-model="manifestInstallContent"
        type="textarea"
        :rows="8"
        resize="vertical"
        :disabled="manifestInstallLoading"
        placeholder='# Generated by the SealRepo extension list.&#10;[dependencies]&#10;"author/package" = "=1.0.0"'
        @input="handleManifestInstallContentInput" />

      <el-alert
        v-if="manifestInstallPreview.error"
        type="error"
        :title="manifestInstallPreview.error"
        :closable="false"
        show-icon />
      <el-alert
        v-else-if="manifestInstallPreview.items"
        type="success"
        :title="`已识别 ${manifestInstallPreview.items.length} 个扩展包`"
        :closable="false"
        show-icon />

      <div v-if="manifestInstallPreview.items" class="manifest-install-table-wrap">
        <el-table
          :data="manifestInstallPreview.items"
          size="small"
          max-height="280"
          :row-class-name="getManifestInstallRowClassName">
          <el-table-column width="46" align="center">
            <template #header>
              <el-checkbox
                :model-value="manifestInstallAllSelected"
                :indeterminate="manifestInstallSelectionIndeterminate"
                :disabled="manifestInstallSelectableItems.length === 0 || manifestInstallLoading"
                aria-label="选择全部可安装扩展包"
                @change="handleManifestInstallSelectAll" />
            </template>
            <template #default="scope">
              <el-checkbox
                :model-value="isManifestInstallItemSelected(scope.row.id)"
                :disabled="isManifestInstallItemExactVersion(scope.row) || manifestInstallLoading"
                :aria-label="`选择 ${getManifestInstallPackageName(scope.row.id) || scope.row.id}`"
                @change="value => handleManifestInstallItemSelection(scope.row.id, value)" />
            </template>
          </el-table-column>
          <el-table-column prop="id" label="扩展包 ID" min-width="180" />
          <el-table-column label="扩展名称" min-width="140">
            <template #default="scope">
              <span v-if="getManifestInstallPackageName(scope.row.id)">
                {{ getManifestInstallPackageName(scope.row.id) }}
              </span>
              <span v-else class="manifest-install-name-placeholder">
                {{ manifestInstallPackageInfoLoading ? '查询中...' : '-' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="version" label="目标版本" min-width="100" />
          <el-table-column label="当前版本" min-width="100">
            <template #default="scope">
              {{ getInstalledVersionById(scope.row.id) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="结果" min-width="130">
            <template #default="scope">
              <el-tooltip
                :disabled="!getManifestInstallResult(scope.row.id)?.message"
                :content="getManifestInstallResult(scope.row.id)?.message"
                placement="top">
                <el-tag :type="getManifestInstallResultTagType(scope.row.id)" size="small">
                  {{ getManifestInstallResultText(scope.row.id) }}
                </el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="manifestInstallPreview.items" class="manifest-install-options">
        <el-checkbox v-model="manifestInstallAutoEnable" :disabled="manifestInstallLoading">
          安装后自动启用
        </el-checkbox>
        <el-checkbox
          v-model="manifestInstallAutoReload"
          :disabled="manifestInstallLoading || !manifestInstallAutoEnable">
          安装并启用后自动重载
        </el-checkbox>
      </div>

      <div
        v-if="manifestInstallLoading || manifestInstallProgress > 0"
        class="manifest-install-progress">
        <el-progress
          :percentage="manifestInstallProgress"
          :status="manifestInstallProgressStatus"
          :indeterminate="manifestInstallLoading"
          :duration="2" />
        <span>{{ manifestInstallProgressText }}</span>
      </div>
    </div>

    <template #footer>
      <el-button :disabled="manifestInstallLoading" @click="manifestInstallVisible = false">
        {{ manifestInstallResults.length > 0 ? '完成' : '取消' }}
      </el-button>
      <el-button
        type="primary"
        :loading="manifestInstallLoading"
        :disabled="manifestInstallSelectedItems.length === 0"
        @click="handleManifestInstall">
        安装 {{ manifestInstallSelectedItems.length }} 个扩展包
      </el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="storeInstallPreviewVisible"
    title="安装扩展包"
    width="720px"
    class="store-install-preview-dialog">
    <template v-if="storeInstallPreviewTarget">
      <div
        v-loading="storeInstallPreviewLoading"
        class="store-install-preview"
        element-loading-text="正在获取安装预览">
        <template v-if="storeInstallPreviewData">
          <el-descriptions :column="2" border class="store-install-preview-summary">
            <el-descriptions-item label="名称">
              <span class="store-install-preview-name-cell">
                <span v-if="storeInstallPreviewIconUrl" class="store-install-preview-icon">
                  <img :src="storeInstallPreviewIconUrl" alt="" />
                </span>
                <span>{{
                  storeInstallPreviewTarget.name || storeInstallPreviewTarget.id || '-'
                }}</span>
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="ID">{{
              storeInstallPreviewTarget.id || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="目标版本">{{
              storeInstallPreviewTarget.version || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="当前版本">{{
              getInstalledVersionByStore(storeInstallPreviewTarget) || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="作者">{{
              joinList(storeInstallPreviewTarget.authors)
            }}</el-descriptions-item>
            <el-descriptions-item label="动作">{{
              getStoreActionText(storeInstallPreviewTarget)
            }}</el-descriptions-item>
            <el-descriptions-item :span="2" label="描述">
              <span class="break-text">{{
                storeInstallPreviewTarget.description || '暂无描述'
              }}</span>
            </el-descriptions-item>
            <el-descriptions-item :span="2" label="内容统计">
              {{ getStorePreviewContentsText(storeInstallPreviewTarget, storeInstallPreviewData) }}
            </el-descriptions-item>
            <el-descriptions-item :span="2" label="文件数量">
              {{ storeInstallPreviewData.length }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="store-install-preview-options" role="group" aria-label="安装选项">
            <div class="store-install-preview-option-row">
              <el-checkbox
                v-model="storeInstallPreviewAutoEnable"
                class="store-install-preview-checkbox">
                安装后启用
              </el-checkbox>
            </div>
            <div class="store-install-preview-option-row">
              <el-checkbox
                v-model="storeInstallPreviewAutoReload"
                :disabled="!storeInstallPreviewAutoEnable"
                class="store-install-preview-checkbox">
                安装并启用后自动重载
              </el-checkbox>
              <div class="install-reload-tip store-install-preview-reload-tip">
                如果插件很多，重载会花费较长时间，特别是帮助文档。
              </div>
            </div>
          </div>

          <section class="store-install-preview-files">
            <header class="store-install-preview-files-title">文件清单</header>
            <PackageFileTree :files="storeInstallPreviewFiles" />
          </section>
        </template>

        <el-empty
          v-else-if="!storeInstallPreviewLoading"
          description="未能获取扩展包预览"
          :image-size="88" />
      </div>
    </template>
    <template #footer>
      <el-button @click="storeInstallPreviewVisible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="
          Boolean(
            storeInstallPreviewTarget &&
              storeDownloadLoading[getStorePackageKey(storeInstallPreviewTarget)],
          )
        "
        :disabled="
          !storeInstallPreviewTarget || !storeInstallPreviewData || storeInstallPreviewLoading
        "
        @click="handleConfirmStoreInstallPreview">
        {{ storeInstallPreviewTarget ? getStoreActionText(storeInstallPreviewTarget) : '安装' }}
      </el-button>
    </template>
  </el-dialog>

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
      <el-form-item>
        <el-checkbox v-model="uninstallAutoReload">卸载后自动重载</el-checkbox>
        <div class="install-reload-tip">如果插件很多，重载会花费较长时间，特别是帮助文档。</div>
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
import {
  CaretBottom,
  Clock,
  CopyDocument,
  Document,
  DocumentAdd,
  Download,
  Plus,
  Refresh,
  Search,
  TopRight,
  Upload,
  User,
} from '@element-plus/icons-vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { filesize } from 'filesize';
import {
  disablePackage,
  enablePackage,
  getPackageAssetUrl,
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
  getStorePackageAssetUrl,
  getStorePackageDetailUrl,
  getStorePackageDetailUrlById,
  getStorePackageFiles,
  getStorePackageInfoList,
  getStorePage,
  getStoreRecommend,
  installStorePackageList,
  removeStoreBackend,
  setStoreBackendEnabled,
  type StoreBackendRecord,
  type StorePackage,
  type StorePackageFile,
  type StoreInstallListItemResult,
  type StoreInstallListItemStatus,
  type StorePageQuery,
} from '~/api/store';
import PackageInstalledDrawer from '~/components/mod/package/PackageInstalledDrawer.vue';
import PackageFileTree from '~/components/mod/package/PackageFileTree.vue';
import {
  parsePackageInstallList,
  serializePackageInstallList,
  type PackageInstallListItem,
} from '~/components/mod/package/package-install-list';
import { formatTime, getTimeTimestamp } from '~/components/mod/package/time';

type PackageTab = 'installed' | 'store' | 'manage';

const packageTabs: PackageTab[] = ['installed', 'store', 'manage'];
const route = useRoute();
const router = useRouter();
const getPackageTab = (value: unknown): PackageTab =>
  typeof value === 'string' && packageTabs.includes(value as PackageTab)
    ? (value as PackageTab)
    : 'installed';

const activeTab = computed<PackageTab>({
  get: () => getPackageTab(route.query.tab),
  set: tab => {
    if (route.query.tab !== tab) {
      void router.push({ query: { ...route.query, tab } });
    }
  },
});

type ContentFilter = 'all' | ContentKind;
type StoreViewMode = 'recommend' | 'search';
type ManifestInstallResultStatus = StoreInstallListItemStatus | 'enabled' | 'enable_failed';
type ManifestInstallResult = Omit<StoreInstallListItemResult, 'status'> & {
  status: ManifestInstallResultStatus;
};

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
const installedPageSize = ref(20);
const packageActionLoading = ref<Record<string, boolean>>({});
const installedExportVisible = ref(false);

const packageDetailVisible = ref(false);
const packageDetailLoading = ref(false);
const packageConfigSaving = ref(false);
const currentPackageId = ref('');
const currentPackageDetail = ref<PackageInstance | null>(null);
const currentPackageConfig = ref<Record<string, any> | null>(null);
const currentPackageSchema = ref<Record<string, any> | null>({});
const currentPackageStoreDetailUrl = ref('');

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
const storeInstallPreviewVisible = ref(false);
const storeInstallPreviewLoading = ref(false);
const storeInstallPreviewTarget = ref<StorePackage | null>(null);
const storeInstallPreviewData = ref<StorePackageFile[] | null>(null);
const storeInstallPreviewAutoEnable = ref(true);
const storeInstallPreviewAutoReload = ref(false);
const manifestInstallVisible = ref(false);
const manifestInstallLoading = ref(false);
const manifestInstallContent = ref('');
const manifestInstallFileName = ref('');
const manifestInstallFileInput = ref<HTMLInputElement | null>(null);
const manifestInstallAutoEnable = ref(true);
const manifestInstallAutoReload = ref(false);
const manifestInstallResults = ref<ManifestInstallResult[]>([]);
const manifestInstallProgress = ref(0);
const manifestInstallProgressStatus = ref<'success' | 'exception' | undefined>();
const manifestInstallProgressText = ref('');
const manifestInstallPackageNames = ref<Record<string, string>>({});
const manifestInstallPackageInfoLoading = ref(false);
const manifestInstallSelectedIds = ref<Set<string>>(new Set());
let manifestInstallPackageInfoRequest = 0;
const storeQuery = reactive<
  Required<Pick<StorePageQuery, 'pageNum' | 'pageSize'>> & { name: string }
>({
  name: '',
  pageNum: 1,
  pageSize: 20,
});

const installUrlInput = ref('');
const installUploadAutoEnable = ref(true);
const installUploadAutoReload = ref(false);
const installUrlAutoEnable = ref(true);
const installUrlAutoReload = ref(false);
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
const uninstallAutoReload = ref(false);
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

const installedPackageListItems = computed<PackageInstallListItem[]>(() =>
  installedPackages.value.map(pkg => ({
    id: getPackageId(pkg),
    version: getPackageVersion(pkg),
  })),
);

const installedExportContent = computed(() =>
  serializePackageInstallList(installedPackageListItems.value),
);

const manifestInstallPreview = computed<{
  items: PackageInstallListItem[] | null;
  error: string;
}>(() => {
  if (!manifestInstallContent.value.trim()) {
    return { items: null, error: '' };
  }
  try {
    return { items: parsePackageInstallList(manifestInstallContent.value), error: '' };
  } catch (error) {
    return { items: null, error: getErrorMessage(error, '无法解析这份扩展包清单。') };
  }
});

const manifestInstallResultMap = computed(
  () => new Map(manifestInstallResults.value.map(item => [item.id, item])),
);

const manifestInstallSelectableItems = computed(() =>
  (manifestInstallPreview.value.items ?? []).filter(
    item => !isManifestInstallItemExactVersion(item),
  ),
);

const manifestInstallSelectedItems = computed(() =>
  manifestInstallSelectableItems.value.filter(item =>
    manifestInstallSelectedIds.value.has(item.id),
  ),
);

const manifestInstallAllSelected = computed(
  () =>
    manifestInstallSelectableItems.value.length > 0 &&
    manifestInstallSelectedItems.value.length === manifestInstallSelectableItems.value.length,
);

const manifestInstallSelectionIndeterminate = computed(
  () =>
    manifestInstallSelectedItems.value.length > 0 &&
    manifestInstallSelectedItems.value.length < manifestInstallSelectableItems.value.length,
);
const pendingReloadPackageCount = computed(
  () => installedPackages.value.filter(pkg => (pkg.pendingReload ?? []).length > 0).length,
);
const hasPendingReloadPackages = computed(() => pendingReloadPackageCount.value > 0);

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

const isAbsoluteAssetUrl = (value: string) =>
  /^(https?:)?\/\//i.test(value) || /^(data|blob):/i.test(value) || value.startsWith('/');

const getPackageIconUrl = (pkg: PackageInstance) => {
  const icon = pkg.manifest.store?.icon?.trim();
  if (!icon) {
    return '';
  }
  if (isAbsoluteAssetUrl(icon)) {
    return icon;
  }
  return getPackageAssetUrl(getPackageId(pkg), icon);
};

const getStorePackageName = (pkg: StorePackage) => pkg.name || pkg.id;

const getStorePackageAccent = (pkg: StorePackage): ContentFilter => pkg.contents?.[0] ?? 'all';

const getStorePackageAvatarText = (pkg: StorePackage) => {
  const accent = getStorePackageAccent(pkg);
  return packageAvatarMap[accent] ?? getStorePackageName(pkg).slice(0, 2).toUpperCase();
};

const getStorePackageBackendUrl = (pkg?: StorePackage | null) => {
  const backendID = pkg?.backendID;
  if (!backendID) {
    return '';
  }
  const backend = storeBackends.value.find(item =>
    [item.backendID, item.id, item.url].filter(Boolean).includes(backendID),
  );
  return backend?.url ?? '';
};

const getStorePackageIconUrl = (pkg?: StorePackage | null) =>
  pkg
    ? getStorePackageAssetUrl(pkg, pkg.storeAssets?.icon ?? '', getStorePackageBackendUrl(pkg))
    : '';

const getStorePackageDetailHref = (pkg: StorePackage) =>
  getStorePackageDetailUrl(pkg, getStorePackageBackendUrl(pkg));

const getInstalledPackageStoreDetailHref = (pkg: PackageInstance) => {
  const storePackage = storePackages.value.find(item => item.id === getPackageId(pkg));
  if (storePackage) {
    return getStorePackageDetailHref(storePackage);
  }
  const backend =
    storeBackends.value.find(item => isBackendEnabled(item) && isBuiltinBackend(item)) ??
    storeBackends.value.find(isBackendEnabled);
  return backend?.url ? getStorePackageDetailUrlById(getPackageId(pkg), backend.url) : '';
};

const storeInstallPreviewIconUrl = computed(() =>
  getStorePackageIconUrl(storeInstallPreviewTarget.value),
);

const storeInstallPreviewFiles = computed(
  () => storeInstallPreviewData.value?.map(file => file.path) ?? [],
);

const getStorePackageSize = (pkg: StorePackage) => {
  const size = pkg.download?.size;
  return typeof size === 'number' && Number.isFinite(size) && size >= 0 ? size : null;
};

const formatStorePackageSize = (pkg: StorePackage) => {
  const size = getStorePackageSize(pkg);
  return size === null ? '-' : filesize(size);
};

const joinList = (value?: string[]) => {
  if (!value || value.length === 0) {
    return '-';
  }
  return value.join('、');
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

const loadPackageStoreDetailUrl = async (packageId: string) => {
  const knownPackage = storePackages.value.find(pkg => pkg.id === packageId);
  if (knownPackage) {
    currentPackageStoreDetailUrl.value = getStorePackageDetailHref(knownPackage);
    return;
  }

  try {
    const response = await getStorePage({ name: packageId, pageNum: 1, pageSize: 20 });
    const storePackage = response.result
      ? unwrapStoreList(response).list.find(pkg => pkg.id === packageId)
      : null;
    if (currentPackageId.value === packageId && storePackage) {
      currentPackageStoreDetailUrl.value = getStorePackageDetailHref(storePackage);
    }
  } catch {
    return;
  }
};

const openPackageDetail = async (pkg: PackageInstance) => {
  const packageId = getPackageId(pkg);
  currentPackageStoreDetailUrl.value = '';
  packageDetailVisible.value = true;
  await Promise.all([loadPackageDetail(pkg), loadPackageStoreDetailUrl(packageId)]);
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
    currentPackageStoreDetailUrl.value = '';
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

const reloadPackagesAfterPackageChange = async () => {
  reloadAllLoading.value = true;
  try {
    const response = await reloadAllPackages();
    if (!response.result) {
      return getResponseError(response, '扩展包自动重载失败');
    }
    const reloadedKinds = resolveReloadedKinds(
      'all',
      response as { data?: { reloadedItems?: Record<string, string> } },
    );
    await refreshInstalledPackages();
    clearPendingReloadLocally(reloadedKinds);
    await refreshCurrentPackageDetail();
    return '';
  } catch (error) {
    return getErrorMessage(error, '扩展包自动重载失败');
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
  uninstallAutoReload.value = false;
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
      currentPackageStoreDetailUrl.value = '';
    }
    await refreshInstalledPackages();
    if (uninstallAutoReload.value) {
      const reloadError = await reloadPackagesAfterPackageChange();
      if (reloadError) {
        ElMessage.warning(`扩展包已卸载，但自动重载失败：${reloadError}`);
      } else {
        ElMessage.success('扩展包已卸载并完成重载');
      }
    }
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
    await refreshCurrentStoreView();
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
    await refreshCurrentStoreView();
  } finally {
    setLoadingFlag(backendRemoveLoading, key, false);
  }
};

const buildStoreQuery = () => {
  const query: StorePageQuery = {
    pageNum: storeQuery.pageNum,
    pageSize: storeQuery.pageSize,
  };
  if (storeQuery.name.trim()) {
    query.name = storeQuery.name.trim();
  }
  return query;
};

const loadStoreRecommend = async () => {
  storeViewMode.value = 'recommend';
  storeLoading.value = true;
  try {
    const response = await getStoreRecommend();
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

const handleStoreSearch = async () => {
  storeQuery.pageNum = 1;
  if (storeQuery.name.trim()) {
    await searchStorePackages();
  } else {
    await loadStoreRecommend();
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

const ensureStoreLoaded = async () => {
  if (storeLoadStarted.value) {
    return;
  }
  storeLoadStarted.value = true;
  try {
    await loadStoreRecommend();
  } catch {
    storeLoadStarted.value = false;
  }
};

const getStorePackageKey = (pkg: StorePackage) => `${pkg.id}@${pkg.version}`;

const isStorePackageActionLoading = (pkg: StorePackage) => {
  const key = getStorePackageKey(pkg);
  const previewTarget = storeInstallPreviewTarget.value;
  return (
    Boolean(storeDownloadLoading.value[key]) ||
    (storeInstallPreviewLoading.value &&
      previewTarget !== null &&
      getStorePackageKey(previewTarget) === key)
  );
};

const isStoreInstalled = (pkg: StorePackage) =>
  Boolean(pkg.installed || installedPackageIdSet.value.has(pkg.id));

const findInstalledPackageByStore = (pkg: StorePackage) =>
  installedPackages.value.find(installed => getPackageId(installed) === pkg.id) ?? null;

const getInstalledVersionByStore = (pkg: StorePackage) =>
  findInstalledPackageByStore(pkg)?.manifest.package.version || '';

const getInstalledVersionById = (id: string) =>
  installedPackages.value.find(pkg => getPackageId(pkg) === id)?.manifest.package.version || '';

const isManifestInstallItemExactVersion = (item: PackageInstallListItem) =>
  getInstalledVersionById(item.id) === item.version;

const isManifestInstallItemSelected = (id: string) => manifestInstallSelectedIds.value.has(id);

const resetManifestInstallSelection = (items: PackageInstallListItem[] | null) => {
  manifestInstallSelectedIds.value = new Set(
    (items ?? []).filter(item => !isManifestInstallItemExactVersion(item)).map(item => item.id),
  );
};

const handleManifestInstallItemSelection = (id: string, selected: boolean | string | number) => {
  const next = new Set(manifestInstallSelectedIds.value);
  if (Boolean(selected)) {
    next.add(id);
  } else {
    next.delete(id);
  }
  manifestInstallSelectedIds.value = next;
};

const handleManifestInstallSelectAll = (selected: boolean | string | number) => {
  manifestInstallSelectedIds.value = Boolean(selected)
    ? new Set(manifestInstallSelectableItems.value.map(item => item.id))
    : new Set();
};

const getManifestInstallRowClassName = ({ row }: { row: PackageInstallListItem }) =>
  isManifestInstallItemExactVersion(row) ? 'manifest-install-row-disabled' : '';

const copyInstalledPackageList = async () => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(installedExportContent.value);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = installedExportContent.value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      if (!copied) {
        throw new Error('copy failed');
      }
    }
    ElMessage.success(`已复制 ${installedPackageListItems.value.length} 个扩展包的清单`);
  } catch {
    ElMessage.error('复制失败，请检查浏览器的剪贴板权限');
  }
};

const downloadInstalledPackageList = () => {
  const blob = new Blob([installedExportContent.value], {
    type: 'application/toml;charset=utf-8',
  });
  const objectURL = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectURL;
  anchor.download = 'sealpack-dependencies.toml';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectURL), 0);
  ElMessage.success('扩展包清单已下载');
};

const getManifestInstallPackageName = (id: string) => manifestInstallPackageNames.value[id] || '';

const refreshManifestInstallPackageNames = async (items: PackageInstallListItem[] | null) => {
  const requestID = ++manifestInstallPackageInfoRequest;
  manifestInstallPackageInfoLoading.value = false;
  if (!items) {
    manifestInstallPackageNames.value = {};
    return;
  }

  const names: Record<string, string> = {};
  const unresolved = items.filter(item => {
    const installed = installedPackages.value.find(pkg => getPackageId(pkg) === item.id);
    const storePackage = storePackages.value.find(pkg => pkg.id === item.id);
    const name = installed?.manifest.package.name || storePackage?.name;
    if (name) {
      names[item.id] = name;
      return false;
    }
    return true;
  });
  manifestInstallPackageNames.value = names;
  if (unresolved.length === 0) {
    return;
  }

  manifestInstallPackageInfoLoading.value = true;
  try {
    const response = await getStorePackageInfoList(unresolved);
    if (requestID !== manifestInstallPackageInfoRequest) {
      return;
    }
    if (response.result && response.data) {
      response.data.forEach(item => {
        if (item.name) {
          names[item.id] = item.name;
        }
      });
      manifestInstallPackageNames.value = { ...names };
    }
  } catch {
    // Individual metadata failures leave a dash in the name column.
  } finally {
    if (requestID === manifestInstallPackageInfoRequest) {
      manifestInstallPackageInfoLoading.value = false;
    }
  }
};

const getStoreActionText = (pkg: StorePackage) => {
  if (!isStoreInstalled(pkg)) {
    return '安装';
  }
  return getInstalledVersionByStore(pkg) === pkg.version ? '重装' : '升级';
};

const resetManifestInstallResults = () => {
  manifestInstallResults.value = [];
  manifestInstallProgress.value = 0;
  manifestInstallProgressStatus.value = undefined;
  manifestInstallProgressText.value = '';
};

const openManifestInstallDialog = () => {
  manifestInstallContent.value = '';
  manifestInstallFileName.value = '';
  manifestInstallAutoEnable.value = true;
  manifestInstallAutoReload.value = false;
  resetManifestInstallResults();
  resetManifestInstallSelection(null);
  void refreshManifestInstallPackageNames(null);
  manifestInstallVisible.value = true;
};

const handleManifestInstallContentInput = () => {
  manifestInstallFileName.value = '';
  resetManifestInstallResults();
};

const handleManifestInstallFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) {
    return;
  }
  if (file.size > 1024 * 1024) {
    ElMessage.error('清单文件不能超过 1 MB');
    return;
  }

  try {
    manifestInstallContent.value = await file.text();
    manifestInstallFileName.value = file.name;
    resetManifestInstallResults();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '无法读取这个清单文件。'));
  }
};

const getManifestInstallResult = (id: string) => manifestInstallResultMap.value.get(id);

const getManifestInstallResultText = (id: string) => {
  switch (getManifestInstallResult(id)?.status) {
    case 'installed':
      return '安装成功';
    case 'skipped':
      return '无需安装';
    case 'failed':
      return '安装失败';
    case 'enabled':
      return '已安装并启用';
    case 'enable_failed':
      return '启用失败';
    default:
      if (!getInstalledVersionById(id)) {
        return '待安装';
      }
      return manifestInstallPreview.value.items?.some(
        item => item.id === id && isManifestInstallItemExactVersion(item),
      )
        ? '已安装'
        : '待升级';
  }
};

const getManifestInstallResultTagType = (id: string): 'success' | 'info' | 'warning' | 'danger' => {
  switch (getManifestInstallResult(id)?.status) {
    case 'installed':
    case 'enabled':
      return 'success';
    case 'skipped':
      return 'info';
    case 'enable_failed':
      return 'warning';
    case 'failed':
      return 'danger';
    default:
      if (!getInstalledVersionById(id)) {
        return 'info';
      }
      return manifestInstallPreview.value.items?.some(
        item => item.id === id && isManifestInstallItemExactVersion(item),
      )
        ? 'info'
        : 'warning';
  }
};

const handleManifestInstall = async () => {
  const items = manifestInstallSelectedItems.value;
  if (items.length === 0 || manifestInstallLoading.value) {
    return;
  }

  manifestInstallLoading.value = true;
  manifestInstallResults.value = [];
  manifestInstallProgress.value = 10;
  manifestInstallProgressStatus.value = undefined;
  manifestInstallProgressText.value = '正在从扩展商店下载并安装清单...';

  try {
    const response = await installStorePackageList(items);
    if (!response.result || !response.data) {
      manifestInstallProgressStatus.value = 'exception';
      manifestInstallProgressText.value = '清单安装失败';
      ElMessage.error(getResponseError(response, '清单安装失败'));
      return;
    }

    manifestInstallResults.value = response.data.items.map(item => ({ ...item }));
    manifestInstallProgress.value = 60;
    manifestInstallProgressText.value = manifestInstallAutoEnable.value
      ? '安装完成，正在启用扩展包...'
      : '扩展包安装完成';
    await refreshInstalledPackages();

    let enableFailedCount = 0;
    let enableCandidateCount = 0;
    if (manifestInstallAutoEnable.value) {
      const candidates = manifestInstallResults.value.filter(item => item.status !== 'failed');
      enableCandidateCount = candidates.length;
      for (let index = 0; index < candidates.length; index += 1) {
        const item = candidates[index];
        const installedPackage = installedPackages.value.find(pkg => getPackageId(pkg) === item.id);
        if (!installedPackage) {
          item.status = 'enable_failed';
          item.message = '安装完成后未找到扩展包记录';
          enableFailedCount += 1;
        } else if (installedPackage.state === 'enabled') {
          item.status = 'enabled';
          item.message = '扩展包已处于启用状态';
        } else {
          try {
            const enableResponse = await enablePackage(item.id);
            if (enableResponse.result) {
              item.status = 'enabled';
              item.message = '扩展包已启用';
            } else {
              item.status = 'enable_failed';
              item.message = getResponseError(enableResponse, '自动启用扩展包失败');
              enableFailedCount += 1;
            }
          } catch (error) {
            item.status = 'enable_failed';
            item.message = getErrorMessage(error, '自动启用扩展包失败');
            enableFailedCount += 1;
          }
        }
        manifestInstallProgress.value = Math.min(
          90,
          60 + Math.round(((index + 1) / Math.max(candidates.length, 1)) * 30),
        );
      }
      await refreshInstalledPackages();
    }

    let reloadError = '';
    if (
      manifestInstallAutoReload.value &&
      enableCandidateCount > 0 &&
      enableFailedCount < enableCandidateCount
    ) {
      manifestInstallProgress.value = 92;
      manifestInstallProgressText.value = '正在重载扩展包内容...';
      reloadError = await reloadPackagesAfterPackageChange();
    }

    await refreshCurrentStoreView();
    const failedCount = response.data.failed + enableFailedCount;
    manifestInstallProgress.value = 100;
    manifestInstallProgressStatus.value = failedCount > 0 || reloadError ? 'exception' : 'success';
    manifestInstallProgressText.value = [
      `安装 ${response.data.installed} 个`,
      `跳过 ${response.data.skipped} 个`,
      `失败 ${response.data.failed} 个`,
      enableFailedCount > 0 ? `启用失败 ${enableFailedCount} 个` : '',
      reloadError ? `重载失败：${reloadError}` : '',
    ]
      .filter(Boolean)
      .join('，');

    if (failedCount > 0 || reloadError) {
      ElMessage.warning('清单已处理完成，部分扩展包需要手动检查');
    } else {
      ElMessage.success('清单中的扩展包已处理完成');
    }
  } catch (error) {
    manifestInstallProgress.value = Math.max(manifestInstallProgress.value, 10);
    manifestInstallProgressStatus.value = 'exception';
    manifestInstallProgressText.value = '清单安装失败';
    ElMessage.error(getErrorMessage(error, '清单安装失败'));
  } finally {
    manifestInstallLoading.value = false;
  }
};

const handleStoreUninstall = (pkg: StorePackage) => {
  const installed = findInstalledPackageByStore(pkg);
  if (!installed) {
    ElMessage.warning('当前未找到已安装的扩展包记录，请先刷新列表');
    return;
  }
  openUninstallDialog(installed);
};

const handleOpenStoreInstallPreview = async (pkg: StorePackage) => {
  storeInstallPreviewTarget.value = pkg;
  storeInstallPreviewData.value = null;
  storeInstallPreviewAutoEnable.value = true;
  storeInstallPreviewAutoReload.value = false;
  storeInstallPreviewVisible.value = true;
  storeInstallPreviewLoading.value = true;

  try {
    const response = await getStorePackageFiles(pkg);
    if (!response.result) {
      ElMessage.error(getResponseError(response, '获取扩展包文件清单失败'));
      storeInstallPreviewVisible.value = false;
      return;
    }
    storeInstallPreviewData.value = response.data ?? [];
  } finally {
    storeInstallPreviewLoading.value = false;
  }
};

const handleConfirmStoreInstallPreview = async () => {
  const pkg = storeInstallPreviewTarget.value;
  if (!pkg) {
    return;
  }
  const key = getStorePackageKey(pkg);
  const actionText = getStoreActionText(pkg);
  const beforeInstallPackages = captureInstalledPackageSnapshot();
  setLoadingFlag(storeDownloadLoading, key, true);
  try {
    const response = await downloadStorePackage({ id: pkg.id, version: pkg.version });
    if (!response.result) {
      ElMessage.error(getResponseError(response, `${actionText}扩展包失败`));
      return;
    }
    storeInstallPreviewVisible.value = false;
    await handlePostInstallSuccess(
      beforeInstallPackages,
      storeInstallPreviewAutoEnable.value,
      storeInstallPreviewAutoReload.value,
    );
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

type PostInstallReloadResult = 'skipped' | 'success' | 'failed' | 'not_applicable';

const getPackageInstallTimestamp = (pkg: PackageInstance) => {
  return getTimeTimestamp(pkg.installTime);
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

const autoReloadAfterInstall = async (
  enableResult: InstallAutoEnableResult,
  autoReload: boolean,
): Promise<{ status: PostInstallReloadResult; message?: string }> => {
  if (!autoReload) {
    return { status: 'skipped' };
  }
  if (enableResult.status !== 'enabled' && enableResult.status !== 'already_enabled') {
    return { status: 'not_applicable' };
  }
  const reloadError = await reloadPackagesAfterPackageChange();
  if (reloadError) {
    return { status: 'failed', message: reloadError };
  }
  return { status: 'success' };
};

const getPostInstallReloadNotice = (
  result: { status: PostInstallReloadResult; message?: string },
  enableResult: InstallAutoEnableResult,
) => {
  switch (result.status) {
    case 'success':
      return '已自动重载，扩展包已应用。';
    case 'failed':
      return `已尝试自动重载，但失败：${result.message ?? '未知错误'}。请稍后在“已安装包”页面手动重载。`;
    case 'not_applicable':
      return enableResult.status === 'skipped'
        ? '未自动启用，因此没有执行自动重载。'
        : '自动启用未完成，因此没有执行自动重载。';
    case 'skipped':
    default:
      return '需要重载后才能应用。如果插件很多，重载会花费较长时间，特别是帮助文档。';
  }
};

const getPostInstallNotice = (
  result: InstallAutoEnableResult,
  reloadResult: { status: PostInstallReloadResult; message?: string },
) => {
  const reloadNotice = getPostInstallReloadNotice(reloadResult, result);
  switch (result.status) {
    case 'enabled':
      return `扩展包「${result.packageId}」已安装并自动启用。${reloadNotice}`;
    case 'already_enabled':
      return `扩展包「${result.packageId}」已安装且已处于启用状态。${reloadNotice}`;
    case 'failed':
      return `扩展包已安装，但自动启用「${result.packageId}」失败：${result.message ?? '未知错误'}。请切到“已安装包”页面手动启用；启用后需要重载才能应用。`;
    case 'not_found':
      return '扩展包已安装，但未能定位新安装的包。请切到“已安装包”页面检查启用状态；启用后需要重载才能应用。';
    case 'skipped':
    default:
      return '扩展包已安装。请切到“已安装包”页面启用扩展包；启用后需要重载才能应用。';
  }
};

const getPostInstallNoticeType = (
  result: InstallAutoEnableResult,
  reloadResult: { status: PostInstallReloadResult; message?: string },
): 'success' | 'warning' | 'info' => {
  if (reloadResult.status === 'failed' || reloadResult.status === 'not_applicable') {
    return 'warning';
  }
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
  autoReload: boolean,
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
  const autoReloadResult = await autoReloadAfterInstall(autoEnableResult, autoReload);
  await refreshCurrentStoreView();

  void showPostInstallNotice(
    getPostInstallNotice(autoEnableResult, autoReloadResult),
    getPostInstallNoticeType(autoEnableResult, autoReloadResult),
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

const getStorePreviewContentsText = (pkg: StorePackage, files: StorePackageFile[]) => {
  const counts = new Map<ContentKind | 'assets', number>();
  files.forEach(file => {
    const kind = file.path.split('/', 1)[0] as ContentKind | 'assets';
    if (kind in uploadPreviewContentLabelMap) {
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
  });
  const kinds = new Set<ContentKind | 'assets'>(pkg.contents);
  if (counts.has('assets')) {
    kinds.add('assets');
  }
  const items = [...kinds].map(kind => {
    const count = counts.get(kind) ?? 0;
    return count > 0
      ? `${getUploadPreviewContentLabel(kind)} ${count} 个`
      : getUploadPreviewContentLabel(kind);
  });
  return items.length > 0 ? items.join('、') : '未声明扩展内容';
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
    `安装后自动启用：${installUploadAutoEnable.value ? '是' : '否'}`,
    `自动重载：${installUploadAutoReload.value ? '是' : '否'}`,
    installUploadAutoReload.value ? '提示：如果插件很多，重载会花费较长时间，特别是帮助文档。' : '',
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
    await handlePostInstallSuccess(
      beforeInstallPackages,
      installUploadAutoEnable.value,
      installUploadAutoReload.value,
    );
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
    await handlePostInstallSuccess(
      beforeInstallPackages,
      installUrlAutoEnable.value,
      installUrlAutoReload.value,
    );
  } finally {
    installByUrlLoading.value = false;
  }
};

watch(activeTab, tab => {
  if (tab === 'store') {
    void ensureStoreLoaded();
  }
});

watch(storeInstallPreviewVisible, visible => {
  if (!visible && !storeInstallPreviewLoading.value) {
    storeInstallPreviewTarget.value = null;
    storeInstallPreviewData.value = null;
    storeInstallPreviewAutoEnable.value = true;
    storeInstallPreviewAutoReload.value = false;
  }
});

watch(installUploadAutoEnable, enabled => {
  if (!enabled) {
    installUploadAutoReload.value = false;
  }
});

watch(installUrlAutoEnable, enabled => {
  if (!enabled) {
    installUrlAutoReload.value = false;
  }
});

watch(manifestInstallAutoEnable, enabled => {
  if (!enabled) {
    manifestInstallAutoReload.value = false;
  }
});

watch(manifestInstallContent, () => {
  manifestInstallPackageInfoRequest += 1;
  manifestInstallPackageNames.value = {};
  manifestInstallPackageInfoLoading.value = Boolean(manifestInstallPreview.value.items);
  resetManifestInstallSelection(manifestInstallPreview.value.items);
});

watchDebounced(
  manifestInstallContent,
  () => {
    void refreshManifestInstallPackageNames(manifestInstallPreview.value.items);
  },
  { debounce: 350, maxWait: 1000 },
);

watch(storeInstallPreviewAutoEnable, enabled => {
  if (!enabled) {
    storeInstallPreviewAutoReload.value = false;
  }
});

onBeforeMount(async () => {
  if (route.query.tab !== activeTab.value) {
    await router.replace({ query: { ...route.query, tab: activeTab.value } });
  }
  await Promise.all([refreshInstalledPackages(), refreshStoreBackends()]);
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
  letter-spacing: 0;
}

.package-page-description {
  margin: 0;
  color: #607089;
  font-size: 14px;
  line-height: 1.65;
}

.package-update-actions {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: stretch;
  border-radius: 0.38rem;
}

.package-update-actions.has-pending {
  box-shadow: 0 0 0 3px rgb(248 92 92 / 12%);
}

.package-update-card {
  flex: 0 0 auto;
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0 0.7rem;
  border: 1px solid #e6ebf2;
  border-radius: 0.38rem;
  background: #f5f8fc;
  color: #34445d;
  cursor: pointer;
}

.package-update-actions .package-update-card {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.package-update-card.is-loading {
  opacity: 0.72;
}

.package-update-card.has-pending {
  border-color: #f97373;
  background: #fff1f1;
  color: #b42318;
  box-shadow: 0 0 0 3px rgb(248 92 92 / 12%);
}

.package-update-actions .package-update-card.has-pending {
  box-shadow: none;
}

.package-update-card-icon {
  width: 7px;
  height: 7px;
  display: inline-block;
  border-radius: 999px;
  background: #91a4bd;
}

.package-update-card.has-pending .package-update-card-icon {
  background: #ef4444;
}

.package-update-card-label {
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.package-update-card-badge {
  min-width: 18px;
  height: 18px;
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

.package-update-card.has-pending .package-update-card-badge {
  background: #ef4444;
}

.package-update-dropdown {
  display: inline-flex;
}

.package-update-dropdown-trigger {
  width: 32px;
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e6ebf2;
  border-left: 0;
  border-radius: 0 0.38rem 0.38rem 0;
  background: #f5f8fc;
  color: #34445d;
  cursor: pointer;
}

.package-update-dropdown-trigger.has-pending {
  border-color: #f97373;
  border-left-color: #fecaca;
  background: #fff1f1;
  color: #b42318;
}

.package-update-dropdown-trigger:disabled {
  opacity: 0.72;
  cursor: default;
}

.package-update-dropdown-trigger :deep(.el-icon) {
  font-size: 14px;
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

.installed-export-button,
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

.installed-export-button {
  margin-left: auto;
}

.installed-disk-refresh-button {
  min-width: 5.8rem;
  margin-left: 0;
}

.installed-toolbar :deep(.installed-refresh-button.el-button) {
  margin-left: 0;
}

.installed-toolbar :deep(.installed-disk-refresh-button .el-icon),
.installed-toolbar :deep(.installed-export-button .el-icon),
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
  --package-list-padding-x: 0.95rem;
  --package-list-padding-bottom: 0.9rem;

  border: 1px solid var(--package-border);
  border-radius: 0.55rem;
  background: #fff;
  padding: 0 var(--package-list-padding-x) var(--package-list-padding-bottom);
  box-shadow: 0 12px 28px -26px rgba(15, 23, 42, 0.3);
}

.package-card-list {
  display: flex;
  flex-direction: column;
}

.package-card {
  min-width: 0;
  position: relative;
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr);
  gap: 1.25rem;
  padding: 1.22rem 0;
}

.package-card.source-cache-only::before {
  content: '';
  position: absolute;
  inset-block: 0;
  left: calc(var(--package-list-padding-x) * -1);
  right: calc(var(--package-list-padding-x) * -1);
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.08), rgba(255, 255, 255, 0) 34%);
  pointer-events: none;
  z-index: 0;
}

.package-card.source-cache-only:last-child::before {
  bottom: calc(var(--package-list-padding-bottom) * -1);
}

.package-card > * {
  position: relative;
  z-index: 1;
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

.store-search-bar {
  max-width: 42rem;
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.store-search-input {
  min-width: 0;
  flex: 1 1 auto;
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

.store-package-actions {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
}

.store-package-actions :deep(.el-button) {
  margin-left: 0;
}

.store-detail-link {
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.store-detail-link :deep(.el-link__inner) {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  line-height: 1;
}

.store-detail-link-icon {
  flex: 0 0 auto;
  margin: 0;
  font-size: 13px;
}

.store-package-name-cell {
  min-width: 0;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: center;
  column-gap: 0.75rem;
}

.store-package-icon {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.45rem;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 800;
  line-height: 1;
}

.store-package-icon.accent-all,
.store-package-icon.accent-decks {
  background: linear-gradient(135deg, #2f73f6, #5d9cff);
}

.store-package-icon.accent-scripts {
  background: linear-gradient(135deg, #f2a400, #ffc22a);
}

.store-package-icon.accent-reply {
  background: linear-gradient(135deg, #31bd55, #53d675);
}

.store-package-icon.accent-helpdoc {
  background: linear-gradient(135deg, #10aeca, #35cde5);
}

.store-package-icon.accent-templates {
  background: linear-gradient(135deg, #f85c5c, #ff7f39);
}

.store-package-icon-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.store-package-name-main {
  min-width: 0;
  display: grid;
  justify-items: start;
  gap: 0.08rem;
}

.store-package-name-title {
  max-width: 100%;
  display: block;
  overflow: hidden;
  color: #1f2f46;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-package-name-version {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-extra-small);
  line-height: 1.35;
  text-align: left;
}

.store-package-size {
  color: #1f2f46;
  font-weight: 700;
  white-space: nowrap;
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

.install-upload-tip,
.install-reload-tip {
  margin-top: 0.45rem;
  color: var(--package-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.install-upload-progress {
  margin-top: 0.8rem;
}

.install-upload-progress-text {
  margin-top: 0.35rem;
  color: var(--package-muted);
  font-size: 0.82rem;
}

:global(.installed-export-dialog) {
  max-width: calc(100vw - 32px);
}

.installed-export-content {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.installed-export-count {
  color: #000;
  font-size: 0.85rem;
}

.installed-export-content :deep(.el-textarea__inner) {
  color: #000;
  -webkit-text-fill-color: #000;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.55;
}

:global(.manifest-install-dialog) {
  display: flex;
  max-width: calc(100vw - 32px);
  max-height: min(82vh, 780px);
  flex-direction: column;
  overflow: hidden;
}

:global(.manifest-install-dialog .el-dialog__header),
:global(.manifest-install-dialog .el-dialog__footer) {
  flex: 0 0 auto;
}

:global(.manifest-install-dialog .el-dialog__body) {
  min-height: 0;
  flex: 1 1 auto;
  overflow: auto;
}

.manifest-install-content {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.manifest-install-file-input {
  display: none;
}

.manifest-install-source-actions {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.manifest-install-file-name {
  min-width: 0;
  overflow: hidden;
  color: var(--package-muted);
  font-size: 0.85rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manifest-install-name-placeholder {
  color: var(--package-muted);
}

.manifest-install-content :deep(.el-textarea__inner) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.55;
}

.manifest-install-table-wrap {
  overflow: hidden;
  border: 1px solid var(--package-border);
  border-radius: 0.45rem;
}

.manifest-install-table-wrap :deep(.manifest-install-row-disabled > .el-table__cell),
.manifest-install-table-wrap
  :deep(.el-table__body tr.manifest-install-row-disabled:hover > .el-table__cell) {
  background: #f5f7fa;
  color: #a8abb2;
}

.manifest-install-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 1.25rem;
}

.manifest-install-options :deep(.el-checkbox) {
  margin-right: 0;
}

.manifest-install-progress {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  color: var(--package-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.store-install-preview {
  min-height: 12rem;
}

:global(.store-install-preview-dialog) {
  display: flex;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 120px);
  max-height: min(76vh, 680px);
  flex-direction: column;
  overflow: hidden;
}

:global(.store-install-preview-dialog .el-dialog__header),
:global(.store-install-preview-dialog .el-dialog__footer) {
  flex: 0 0 auto;
}

:global(.store-install-preview-dialog .el-dialog__body) {
  min-height: 0;
  flex: 1 1 auto;
  overflow: auto;
}

.store-install-preview-summary {
  margin-bottom: 1rem;
}

.store-install-preview-name-cell {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 0.55rem;
  vertical-align: middle;
}

.store-install-preview-icon {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  overflow: hidden;
  border: 1px solid #dce5ef;
  border-radius: 0.4rem;
  background: #f8fafc;
}

.store-install-preview-icon img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.store-install-preview-options {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-bottom: 1rem;
}

.store-install-preview-option-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.store-install-preview-checkbox {
  min-height: 22px;
  height: auto;
}

.store-install-preview-checkbox :deep(.el-checkbox__input) {
  flex: 0 0 auto;
}

.store-install-preview-checkbox :deep(.el-checkbox__label) {
  white-space: normal;
  line-height: 1.35;
}

.store-install-preview-option-row .install-reload-tip {
  margin-top: 0.2rem;
  margin-left: 22px;
}

.store-install-preview-reload-tip {
  color: #8a98aa;
  font-size: 0.78rem;
}

.store-install-preview-files {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.store-install-preview-files :deep(.package-file-tree) {
  max-height: none;
  overflow: visible;
}

.store-install-preview-files-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #263852;
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

  .package-update-actions {
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

  .installed-export-button,
  .installed-disk-refresh-button {
    margin-left: 0;
  }

  .package-card-head {
    grid-template-columns: minmax(0, 1fr);
  }

  .package-card-actions {
    justify-content: flex-start;
  }
}

@media screen and (max-width: 768px) {
  .manifest-install-options,
  .manifest-install-source-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .manifest-install-file-name {
    max-width: 100%;
  }

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

  .package-list-surface {
    --package-list-padding-x: 0.85rem;
  }

  .backend-add-row,
  .install-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .store-search-bar {
    max-width: none;
    flex-direction: column;
  }

  .store-search-bar :deep(.el-button) {
    width: 100%;
    margin-left: 0;
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
  .installed-export-button,
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
