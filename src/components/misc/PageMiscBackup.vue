<template>
  <div class="backup-header">
    <h2>备份</h2>
    <el-space wrap>
      <el-button
        type="success"
        :icon="DocumentChecked"
        :disabled="writeOperationsDisabled"
        @click="doSave">
        保存设置
      </el-button>
      <el-button type="primary" :disabled="writeOperationsDisabled" @click="showBackup = true">
        立即备份
      </el-button>
      <el-upload
        action=""
        accept=".zip,application/zip"
        :disabled="writeOperationsDisabled"
        :show-file-list="false"
        :before-upload="beforeBackupUpload">
        <el-button :icon="Upload" :loading="importing" :disabled="writeOperationsDisabled">
          导入备份
        </el-button>
      </el-upload>
    </el-space>
  </div>
  <el-alert
    v-if="store.runtimeRestoreRequestPending"
    type="warning"
    :closable="false"
    show-icon
    class="pending-restore-alert">
    <template #title>上次恢复请求的结果仍待确认</template>
    <p>
      备份
      {{ store.runtimeRestoreRequestSource }}
      的请求仍保存在本机。请优先使用同一备份重试，以确认服务端是否已接收。
    </p>
    <p>
      放弃追踪不会取消服务端任务，也不会回滚或阻止恢复。仅在已确认服务端没有执行，或确定不再需要追踪结果后使用。
    </p>
    <el-button
      type="warning"
      plain
      size="small"
      :disabled="store.runtimeRestoreSubmitting"
      @click="confirmAbandonPendingRestore">
      放弃本机追踪
    </el-button>
  </el-alert>
  <div>
    <el-form label-position="left">
      <h3>自动备份</h3>
      <el-checkbox v-model="cfg.autoBackupEnable">开启</el-checkbox>
      <div v-if="cfg.autoBackupEnable" style="margin-top: 1rem">
        <el-form-item>
          <template #label>
            <span
              >备份间隔
              <el-tooltip
                raw-content
                content="备份间隔表达式请参阅 <a href='https://pkg.go.dev/github.com/robfig/cron' target='_blank'>cron文档</a>">
                <el-icon><question-filled /></el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="cfg.autoBackupTime" style="width: 12rem"></el-input>
        </el-form-item>
        <el-form-item label="备份范围">
          <el-checkbox-group v-model="cfg.autoBackupSelectionList">
            <el-checkbox label="基础（含自定义回复）" value="base" checked disabled />
            <el-checkbox label="JS 插件" value="js" />
            <el-checkbox label="牌堆" value="deck" />
            <el-checkbox label="帮助文档" value="helpdoc" />
            <el-checkbox label="敏感词库" value="censor" />
            <el-checkbox label="人名信息" value="name" />
            <el-checkbox label="图片" value="image" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="备份文件名预览">
          <el-text type="info"
            >bak_{{ now }}_auto_r{{
              cfg.autoBackupSelection.toString(16)
            }}_&lt;随机值&gt;.zip</el-text
          >
        </el-form-item>
      </div>
      <h3>自动清理</h3>
      <el-form-item label="清理模式">
        <el-radio-group v-model="cfg.backupCleanStrategy">
          <el-radio-button :value="0">关闭</el-radio-button>
          <el-radio-button :value="1">保留一定数量</el-radio-button>
          <el-radio-button :value="2">保留一定时间内</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="cfg.backupCleanStrategy === 1" label="保留数量">
        <el-input-number v-model="cfg.backupCleanKeepCount" :min="1" :step="1" />
      </el-form-item>
      <el-form-item v-if="cfg.backupCleanStrategy === 2">
        <template #label>
          <span
            >保留时间
            <el-tooltip>
              <template #content>
                请输入带时间单位的时间间隔。支持的时间单位只有 h m s（分别代表小时、分钟、秒）。<br />
                示例：<br />
                720h：代表保留 720 小时（即 30 天）内的备份<br />
                10.5h：代表保留 10.5 小时（即 10 小时 30 分）内的备份<br />
                10h30m：保留 10 小时 30 分内备份的另一种写法
              </template>
              <el-icon><question-filled /></el-icon>
            </el-tooltip>
          </span>
        </template>
        <el-input v-model="cfg.backupCleanKeepDur" style="width: 12rem" />
      </el-form-item>
      <el-form-item v-if="cfg.backupCleanStrategy !== 0">
        <template #label>
          <span
            >触发方式
            <el-tooltip
              raw-content
              content="自动备份后：在每次自动备份完成后，顺便进行备份清理。<br/>定时：按照给定的 cron 表达式，单独触发清理。">
              <el-icon><question-filled /></el-icon>
            </el-tooltip>
          </span>
        </template>
        <el-checkbox-group v-model="backupCleanTriggers">
          <el-checkbox :label="CleanTrigger.AfterAutoBackup">自动备份后</el-checkbox>
          <el-checkbox :label="CleanTrigger.Cron">定时</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item v-if="cfg.backupCleanStrategy !== 0">
        <template #label>
          <span
            >定时间隔
            <el-tooltip
              raw-content
              content="定时间隔表达式请参阅 <a href='https://pkg.go.dev/github.com/robfig/cron' target='_blank'>cron文档</a>">
              <el-icon><question-filled /></el-icon>
            </el-tooltip>
          </span>
        </template>
        <el-input v-model="cfg.backupCleanCron" style="width: 12rem" />
      </el-form-item>
    </el-form>
    <h4>如何恢复备份？</h4>
    <div>
      导入 ZIP
      后，在备份列表中选择恢复。若在线恢复失败，可将骰子彻底关闭，手工解压备份到骰子目录并覆盖 data
      目录。
    </div>
  </div>

  <div style="display: flex; justify-content: space-between; align-items: center">
    <h2>已备份文件</h2>
    <el-button
      type="danger"
      :icon="Delete"
      :disabled="writeOperationsDisabled"
      @click="enterBatchDelete">
      进入批量删除页面
    </el-button>
  </div>

  <div size="small" direction="vertical" class="backup-list" fill>
    <div
      v-for="i in data.items"
      :key="i.name"
      class="backup-line flex flex-wrap justify-between gap-2">
      <div class="flex flex-col">
        <el-text class="self-start" size="large">{{ i.name }}</el-text>
        <el-text v-if="i.valid" class="self-start" size="small" type="info">
          SeaDice {{ i.version }}（版本码 {{ i.versionCode }}）
        </el-text>
        <el-text v-if="i.valid" class="self-start" size="small" type="info"
          >此备份包含：{{ parseSelectionDesc(i.selection).join('、') }}</el-text
        >
        <el-text v-else class="self-start" size="small" type="warning">
          无法恢复：{{ i.restoreError || i.error || '备份内容无法识别' }}
        </el-text>
      </div>
      <el-space size="small" wrap class="justify-end">
        <el-button
          size="small"
          style="text-decoration: none; width: 8rem"
          :loading="downloadingBackupName === i.name"
          :disabled="downloadingBackupName !== undefined"
          @click="downloadBackupFile(i)">
          下载 - {{ filesize(i.fileSize) }}
        </el-button>
        <el-tooltip
          :content="i.restorable ? '恢复此备份' : i.restoreError || i.error || '此备份不可恢复'">
          <span>
            <el-button
              type="warning"
              size="small"
              :icon="RefreshLeft"
              :disabled="!i.restorable || restoring || writeOperationsDisabled"
              plain
              @click="openRestoreDialog(i)" />
          </span>
        </el-tooltip>
        <el-button
          type="danger"
          size="small"
          :icon="Delete"
          :disabled="writeOperationsDisabled"
          plain
          @click="bakDeleteConfirm(i.name)"></el-button>
      </el-space>
    </div>
  </div>

  <el-dialog v-model="showBatchDelete" title="批量删除备份" class="diff-dialog">
    <el-alert
      :closable="false"
      style="margin-bottom: 1.5rem"
      title="默认勾选最近的 5 个备份之前的历史备份，可自行调整。"></el-alert>
    <el-space size="large" alignment="center" style="margin-bottom: 1rem">
      <el-checkbox
        v-model="checkAllBaks"
        :indeterminate="isIndeterminate"
        @change="handleCheckAllChange"
        >{{ checkAllBaks ? '取消全选' : '全选' }}</el-checkbox
      >
      <el-text type="info" size="small"
        >已勾选 {{ selectedBaks.length }} 个备份，共
        {{ filesize(selectedBaks.map(bak => bak.fileSize).reduce((a, b) => a + b, 0)) }}</el-text
      >
    </el-space>
    <el-checkbox-group v-model="selectedBaks" @change="handleCheckedBakChange">
      <div v-for="i of data.items" :key="i.name">
        <el-checkbox :label="i">
          <template #default>{{ i.name }}</template>
        </el-checkbox>
      </div>
    </el-checkbox-group>
    <template #footer>
      <el-space wrap>
        <el-button @click="showBatchDelete = false">取消</el-button>
        <el-button
          type="danger"
          :disabled="writeOperationsDisabled || !(selectedBaks && selectedBaks.length > 0)"
          @click="bakBatchDeleteConfirm"
          >删除所选
        </el-button>
      </el-space>
    </template>
  </el-dialog>

  <el-dialog v-model="showBackup" title="立即备份" class="diff-dialog">
    <el-space direction="vertical" alignment="flex-start">
      <div>
        <span>备份范围：</span>
        <el-checkbox-group v-model="backupSelections">
          <el-checkbox label="基础（含自定义回复）" value="base" checked disabled />
          <el-checkbox label="JS 插件" value="js" />
          <el-checkbox label="牌堆" value="deck" />
          <el-checkbox label="帮助文档" value="helpdoc" />
          <el-checkbox label="敏感词库" value="censor" />
          <el-checkbox label="人名信息" value="name" />
          <el-checkbox label="图片" value="image" />
        </el-checkbox-group>
      </div>
      <div class="flex flex-wrap">
        <span>备份文件名预览：</span>
        <el-text type="info"
          >bak_{{ now }}_r{{
            formatSelection(backupSelections).toString(16)
          }}_&lt;随机值&gt;.zip</el-text
        >
      </div>
    </el-space>
    <template #footer>
      <el-space wrap>
        <el-button @click="showBackup = false">取消</el-button>
        <el-button type="primary" :disabled="writeOperationsDisabled" @click="doBackup">
          立即备份
        </el-button>
      </el-space>
    </template>
  </el-dialog>

  <el-dialog
    v-model="showImportDecision"
    title="导入备份"
    width="min(32rem, 92vw)"
    :close-on-click-modal="!importing"
    :close-on-press-escape="!importing"
    :show-close="!importing"
    @closed="resetBackupImport">
    <el-descriptions v-if="importCandidate" :column="1" border>
      <el-descriptions-item label="文件名">{{ importCandidate.name }}</el-descriptions-item>
      <el-descriptions-item label="大小">{{ filesize(importCandidate.size) }}</el-descriptions-item>
    </el-descriptions>
    <el-form label-position="top" style="margin-top: 1rem">
      <el-form-item label="导入后操作">
        <el-radio-group v-model="importMode" :disabled="importing">
          <el-radio-button value="upload">仅导入</el-radio-button>
          <el-radio-button value="restore">导入后恢复</el-radio-button>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <el-alert
      v-if="importMode === 'restore'"
      type="warning"
      :closable="false"
      show-icon
      title="ZIP 校验通过后还需要再次确认，确认后才会创建安全备份并覆盖数据。" />
    <el-progress
      v-if="importing"
      :percentage="importProgress"
      :indeterminate="importProgress === 0"
      style="margin-top: 1rem" />
    <template #footer>
      <el-button :disabled="importing" @click="cancelBackupImport">取消</el-button>
      <el-button
        type="primary"
        :loading="importing"
        :disabled="writeOperationsDisabled"
        @click="confirmBackupImport">
        {{ importMode === 'restore' ? '导入并继续' : '仅导入' }}
      </el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="showRestore" title="恢复备份" width="min(34rem, 92vw)">
    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="恢复会短暂中断服务，并在同一进程中重新启动 SeaDice。" />
    <el-descriptions v-if="restoreCandidate" :column="1" border style="margin-top: 1rem">
      <el-descriptions-item label="备份文件">{{ restoreCandidate.name }}</el-descriptions-item>
      <el-descriptions-item label="版本">
        {{ restoreCandidate.version }}（{{ restoreCandidate.versionCode }}）
      </el-descriptions-item>
      <el-descriptions-item label="恢复范围">
        {{ parseSelectionDesc(restoreCandidate.selection).join('、') }}
      </el-descriptions-item>
    </el-descriptions>
    <p>系统会先创建当前数据的全量安全备份。恢复仅支持 SQLite，且会覆盖同名文件。</p>
    <el-checkbox v-model="restoreConfirmed">我已了解恢复风险并确认继续</el-checkbox>
    <template #footer>
      <el-button @click="showRestore = false">取消</el-button>
      <el-button
        type="danger"
        :loading="restoring"
        :disabled="!restoreConfirmed || writeOperationsDisabled"
        @click="confirmRestore">
        恢复并重新加载
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { CheckboxValueType, UploadRawFile } from 'element-plus';
import { useStore } from '~/store';
import { filesize } from 'filesize';
import {
  Delete,
  QuestionFilled,
  DocumentChecked,
  RefreshLeft,
  Upload,
} from '@element-plus/icons-vue';
import { sum } from 'lodash-es';
import { dayjs } from 'element-plus';
import {
  downloadBackup,
  getBackupConfig,
  getBackupList,
  postBackupBatchDel,
  postBackupDel,
  postDoBackup,
  setBackupConfig,
  uploadBackup,
} from '~/api/backup';
import type { BackupInfo } from '~/api/backup';

const store = useStore();

const data = ref<{
  items: BackupInfo[];
}>({
  items: [],
});

const cfg = ref<any>({});
const now = ref(dayjs().format('YYMMDD_HHmmss'));
const showBackup = ref<boolean>(false);
const importing = ref(false);
const importProgress = ref(0);
const showImportDecision = ref(false);
const importCandidate = ref<UploadRawFile>();
const importMode = ref<'upload' | 'restore'>('upload');
const restoring = ref(false);
const showRestore = ref(false);
const restoreConfirmed = ref(false);
const restoreCandidate = ref<BackupInfo>();
const downloadingBackupName = ref<string>();
const writeOperationsDisabled = computed(
  () => store.authStatus !== 'authenticated' || store.runtimeMaintenance,
);
const backupSelections = ref<string[]>([
  'base',
  'js',
  'deck',
  'helpdoc',
  'censor',
  'name',
  'image',
]);

const parseSelection = (selection: number): string[] => {
  const list = ['base'];
  const jsMark = selection & 0b000001;
  if (jsMark) {
    list.push('js');
  }
  const deckMark = selection & 0b000010;
  if (deckMark) {
    list.push('deck');
  }
  const helpdocMark = selection & 0b000100;
  if (helpdocMark) {
    list.push('helpdoc');
  }
  const censorMark = selection & 0b001000;
  if (censorMark) {
    list.push('censor');
  }
  const nameMark = selection & 0b010000;
  if (nameMark) {
    list.push('name');
  }
  const resourceMark = selection & 0b100000;
  if (resourceMark) {
    list.push('image');
  }
  return list;
};

const parseSelectionDesc = (selection: number): string[] => {
  const list = ['基础'];
  const jsMark = selection & 0b000001;
  if (jsMark) {
    list.push('JS 插件');
  }
  const deckMark = selection & 0b000010;
  if (deckMark) {
    list.push('牌堆');
  }
  const helpdocMark = selection & 0b000100;
  if (helpdocMark) {
    list.push('帮助文档');
  }
  const censorMark = selection & 0b001000;
  if (censorMark) {
    list.push('敏感词库');
  }
  const nameMark = selection & 0b010000;
  if (nameMark) {
    list.push('人名信息');
  }
  const resourceMark = selection & 0b100000;
  if (resourceMark) {
    list.push('图片');
  }
  return list;
};

const formatSelection = (selections: string[]): number => {
  let mark = 0;
  if (selections.includes('js')) {
    mark |= 0b000001;
  }
  if (selections.includes('deck')) {
    mark |= 0b000010;
  }
  if (selections.includes('helpdoc')) {
    mark |= 0b000100;
  }
  if (selections.includes('censor')) {
    mark |= 0b001000;
  }
  if (selections.includes('name')) {
    mark |= 0b010000;
  }
  if (selections.includes('image')) {
    mark |= 0b100000;
  }
  return mark;
};

watch(
  () => cfg.value.autoBackupSelectionList,
  v => {
    cfg.value.autoBackupSelection = formatSelection(v);
  },
);

const refreshList = async () => {
  const lst = await getBackupList();
  data.value = lst;
};

const downloadBackupFile = async (item: BackupInfo) => {
  if (downloadingBackupName.value !== undefined) return;
  downloadingBackupName.value = item.name;
  let objectUrl: string | undefined;
  try {
    const blob = await downloadBackup(item.name);
    objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = item.name;
    document.body.appendChild(anchor);
    try {
      anchor.click();
    } finally {
      anchor.remove();
    }
  } catch {
    ElMessage.error('下载备份失败');
  } finally {
    downloadingBackupName.value = undefined;
    const urlToRevoke = objectUrl;
    if (urlToRevoke) window.setTimeout(() => URL.revokeObjectURL(urlToRevoke), 0);
  }
};

const beforeBackupUpload = (file: UploadRawFile) => {
  if (writeOperationsDisabled.value) {
    ElMessage.warning('请等待登录或 Runtime 维护结束后再导入备份');
    return false;
  }
  if (!file.name.toLowerCase().endsWith('.zip')) {
    ElMessage.error('请选择 ZIP 格式的 SeaDice 备份');
    return false;
  }
  importCandidate.value = file;
  importMode.value = 'upload';
  importProgress.value = 0;
  showImportDecision.value = true;
  return false;
};

const resetBackupImport = () => {
  if (importing.value) return;
  importCandidate.value = undefined;
  importMode.value = 'upload';
  importProgress.value = 0;
};

const cancelBackupImport = () => {
  if (importing.value) return;
  showImportDecision.value = false;
};

const confirmBackupImport = async () => {
  const file = importCandidate.value;
  if (!file || importing.value || writeOperationsDisabled.value) return;

  const shouldRestore = importMode.value === 'restore';
  importing.value = true;
  importProgress.value = 0;
  let result: Awaited<ReturnType<typeof uploadBackup>> | undefined;
  try {
    result = await uploadBackup(file, event => {
      if (event.total) importProgress.value = Math.round((event.loaded / event.total) * 100);
    });
    if (!result.result) {
      ElMessage.error(result.err || '导入备份失败');
      return;
    }
  } catch {
    ElMessage.error('导入备份失败');
  } finally {
    importing.value = false;
  }

  if (!result?.result) return;

  showImportDecision.value = false;
  ElMessage.success(
    result.item?.reused
      ? `相同备份已存在，已复用 ${result.item.name}`
      : `备份已导入并保存为 ${result.item?.name || '新文件'}`,
  );

  try {
    await refreshList();
  } catch {
    ElMessage.warning('备份已导入，但列表刷新失败，请稍后重试');
  }

  if (!shouldRestore) return;
  if (!result.item) {
    ElMessage.error('备份已导入，但服务未返回备份信息，请从列表中发起恢复');
    return;
  }
  if (!result.item.restorable) {
    ElMessage.warning(
      result.item.restoreError || result.item.error || '备份已导入，但该备份不能用于恢复',
    );
    return;
  }
  openRestoreDialog(result.item);
};

const openRestoreDialog = (item: BackupInfo) => {
  if (writeOperationsDisabled.value) {
    ElMessage.warning('请等待登录或 Runtime 维护结束后再发起恢复');
    return;
  }
  restoreCandidate.value = item;
  restoreConfirmed.value = false;
  showRestore.value = true;
};

const confirmRestore = async () => {
  if (!restoreCandidate.value || !restoreConfirmed.value || writeOperationsDisabled.value) return;
  restoring.value = true;
  try {
    await store.startRuntimeRestore(restoreCandidate.value.name);
    showRestore.value = false;
    ElMessage.info('恢复任务已创建，服务即将重新加载');
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '创建恢复任务失败');
  } finally {
    restoring.value = false;
  }
};

const confirmAbandonPendingRestore = async () => {
  if (!store.runtimeRestoreRequestPending || store.runtimeRestoreSubmitting) return;

  try {
    await ElMessageBox.confirm(
      '此操作只会删除当前标签页保存的请求信息，不会取消服务端任务，也不会回滚或阻止恢复。请仅在已确认服务端没有执行，或确定不再需要追踪结果时继续。',
      '确认放弃本机追踪',
      {
        confirmButtonText: '确认仅放弃本机追踪',
        cancelButtonText: '继续保留',
        type: 'warning',
        closeOnClickModal: false,
      },
    );
  } catch {
    return;
  }

  if (!store.abandonPendingRuntimeRestoreRequest()) {
    ElMessage.error('未能清除本机恢复请求，请刷新页面后重试');
    return;
  }
  ElMessage.warning('已放弃本机追踪；服务端任务未被取消');
};

const configGet = async () => {
  const data = await getBackupConfig();
  cfg.value = data;
  cfg.value.autoBackupSelectionList = parseSelection(data.autoBackupSelection);
  if (data.backupCleanTrigger) {
    const triggers: CleanTrigger[] = [];
    if (data.backupCleanTrigger & CleanTrigger.Cron) {
      triggers.push(CleanTrigger.Cron);
    }
    if (data.backupCleanTrigger & CleanTrigger.AfterAutoBackup) {
      triggers.push(CleanTrigger.AfterAutoBackup);
    }
    backupCleanTriggers.value = triggers;
  }
};

const bakDeleteConfirm = async (name: string) => {
  if (writeOperationsDisabled.value) return;
  const ret = await ElMessageBox.confirm('确认删除？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });
  if (writeOperationsDisabled.value) return;
  if (ret) {
    const r = await postBackupDel(name);
    if (!r.success) {
      ElMessage.error('删除失败');
    } else {
      ElMessage.success('已删除');
    }
  }
  await refreshList();
};

const showBatchDelete = ref<boolean>(false);
const selectedBaks = ref<any[]>([]); // 他不是string[]，是备份项的一种格式
const checkAllBaks = ref(false);
const isIndeterminate = ref(true);

const enterBatchDelete = async () => {
  if (writeOperationsDisabled.value) return;
  selectedBaks.value = data.value.items.filter((_, index) => index >= 5);
  showBatchDelete.value = true;
};

const handleCheckAllChange = (val: CheckboxValueType) => {
  selectedBaks.value = val ? data.value.items : [];
  isIndeterminate.value = false;
};

const handleCheckedBakChange = (value: CheckboxValueType[]) => {
  const checkedCount = value.length;
  checkAllBaks.value = checkedCount === data.value.items.length;
  isIndeterminate.value = checkedCount > 0 && checkedCount < data.value.items.length;
};

const bakBatchDeleteConfirm = async () => {
  if (writeOperationsDisabled.value) return;
  const ret = await ElMessageBox.confirm('确认删除所选备份？删除的内容无法找回！', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });
  if (writeOperationsDisabled.value) return;
  if (ret) {
    const res = await postBackupBatchDel(selectedBaks.value.map(bak => bak.name));
    if (res.result) {
      ElMessage.success('已删除所选备份');
    } else {
      ElMessage.error('有备份删除失败！失败文件：\n' + res.fails.join('\n'));
    }
  }
  showBatchDelete.value = false;
  await refreshList();
};

const doBackup = async () => {
  if (writeOperationsDisabled.value) return;
  const ret = await postDoBackup(formatSelection(backupSelections.value));
  showBackup.value = false;
  await refreshList();
  if (ret.testMode) {
    ElMessage.success('展示模式无法备份');
  } else {
    ElMessage.success('已进行备份');
  }
};

const doSave = async () => {
  if (writeOperationsDisabled.value) return;
  await setBackupConfig(cfg.value);
  ElMessage.success('已保存');
};

const enum CleanTrigger {
  // 定时
  Cron = 1 << 0,
  // 自动备份后
  AfterAutoBackup = 1 << 1,
}

const backupCleanTriggers = ref<CleanTrigger[]>();

watch(backupCleanTriggers, newStrategies => {
  cfg.value.backupCleanTrigger = sum(newStrategies);
});

const refreshNow = () => {
  now.value = dayjs().format('YYMMDD_HHmmss');
};

let pageDataLoad: Promise<void> | undefined;
let pageDataLoaded = false;
const loadPageData = async () => {
  if (pageDataLoad) return pageDataLoad;
  if (writeOperationsDisabled.value) return;

  pageDataLoad = (async () => {
    await store.resumeRuntimeRestore();
    if (writeOperationsDisabled.value) return;

    const [configResult, listResult] = await Promise.allSettled([configGet(), refreshList()]);
    if (configResult.status === 'rejected') ElMessage.error('读取备份设置失败');
    if (listResult.status === 'rejected') ElMessage.error('读取备份列表失败');
    pageDataLoaded = configResult.status === 'fulfilled' && listResult.status === 'fulfilled';
  })().finally(() => {
    pageDataLoad = undefined;
  });
  return pageDataLoad;
};

watch(
  () => [store.authStatus, store.runtimeRestoreStatus.state] as const,
  ([authStatus], [previousAuthStatus]) => {
    if (authStatus !== 'authenticated' || store.runtimeRestoreInProgress) {
      pageDataLoaded = false;
      return;
    }
    if (previousAuthStatus !== 'authenticated' || !pageDataLoaded) void loadPageData();
  },
);

let nowTimer: number | undefined;
onBeforeMount(async () => {
  refreshNow();
  nowTimer = window.setInterval(refreshNow, 1000);
  await store.initializeSession();
  await loadPageData();
});

onBeforeUnmount(() => {
  if (nowTimer !== undefined) window.clearInterval(nowTimer);
});
</script>

<style lang="css">
.backup-list {
  display: flex;
  flex-direction: column;

  .backup-line {
    padding: 5px 0;
  }

  .backup-line:not(:first-child) {
    border-top: 1px solid var(--el-border-color);
  }
}

.backup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}
</style>
