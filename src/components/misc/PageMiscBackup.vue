<template>
  <div class="backup-header">
    <h2>备份</h2>
    <el-space wrap>
      <el-button type="success" :icon="DocumentChecked" @click="doSave">保存设置</el-button>
      <el-button type="primary" @click="showBackup = true">立即备份</el-button>
      <el-upload
        action=""
        accept=".zip,application/zip"
        :show-file-list="false"
        :before-upload="beforeBackupUpload">
        <el-button :icon="Upload" :loading="importing" :disabled="restoreInProgress">
          导入备份
        </el-button>
      </el-upload>
    </el-space>
  </div>
  <el-alert
    v-if="restoreStatus.state !== 'idle'"
    :type="restoreStatusAlertType"
    :closable="restoreStatus.state === 'succeeded'"
    show-icon
    style="margin-bottom: 1rem"
    @close="dismissRestoreStatus">
    <template #title>{{ restoreStatusTitle }}</template>
    <div v-if="restoreStatus.message">{{ restoreStatus.message }}</div>
    <div v-if="restoreStatus.safetyBackupName">
      恢复前安全备份：{{ restoreStatus.safetyBackupName }}
    </div>
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
    <el-button type="danger" :icon="Delete" @click="enterBatchDelete">进入批量删除页面</el-button>
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
          无法恢复：{{ i.error || '备份内容无法识别' }}
        </el-text>
      </div>
      <el-space size="small" wrap class="justify-end">
        <el-button
          size="small"
          tag="a"
          style="text-decoration: none; width: 8rem"
          :href="`${urlBase}/sd-api/backup/download?name=${encodeURIComponent(i.name)}&token=${encodeURIComponent(store.token)}`">
          下载 - {{ filesize(i.fileSize) }}
        </el-button>
        <el-tooltip :content="i.restorable ? '恢复此备份' : i.error || '此备份不可恢复'">
          <span>
            <el-button
              type="warning"
              size="small"
              :icon="RefreshLeft"
              :disabled="!i.restorable || restoring"
              plain
              @click="openRestoreDialog(i)" />
          </span>
        </el-tooltip>
        <el-button
          type="danger"
          size="small"
          :icon="Delete"
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
          :disabled="!(selectedBaks && selectedBaks.length > 0)"
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
        <el-button type="primary" @click="doBackup">立即备份</el-button>
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
        <el-radio-group v-model="importMode">
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
      <el-button type="primary" :loading="importing" @click="confirmBackupImport">
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
        :disabled="!restoreConfirmed"
        @click="confirmRestore">
        恢复并重新加载
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { CheckboxValueType, UploadRawFile } from 'element-plus';
import { useStore } from '~/store';
import { urlBase } from '~/backend';
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
  clearRuntimeRestoreTracking,
  getRuntimeRestoreTracking,
  rememberRuntimeRestore,
} from '~/utils/runtimeRestore';
import {
  getBackupConfig,
  getBackupList,
  getBackupRestoreStatus,
  postBackupBatchDel,
  postBackupDel,
  postDoBackup,
  restoreBackup,
  setBackupConfig,
  uploadBackup,
} from '~/api/backup';
import type { BackupInfo, BackupRestoreStatus } from '~/api/backup';

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
const restoreStatus = ref<BackupRestoreStatus>({ state: 'idle' });
const trackedRestore = getRuntimeRestoreTracking();
const restoreOperation = ref<{ operationId: string; statusToken: string } | undefined>(
  trackedRestore
    ? { operationId: trackedRestore.operationId, statusToken: trackedRestore.statusToken }
    : undefined,
);
const observedActiveRestore = ref(false);
const activeRestoreStates: BackupRestoreStatus['state'][] = [
  'pending',
  'quiescing',
  'applying',
  'starting',
  'rolling_back',
];
const terminalRestoreStates: BackupRestoreStatus['state'][] = [
  'succeeded',
  'failed',
  'rolled_back',
  'degraded',
];
const restoreInProgress = computed(() => activeRestoreStates.includes(restoreStatus.value.state));
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

const beforeBackupUpload = (file: UploadRawFile) => {
  if (restoreInProgress.value) {
    ElMessage.warning('恢复任务执行期间不能导入备份');
    return false;
  }
  if (terminalRestoreStates.includes(restoreStatus.value.state)) dismissRestoreStatus();
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
  if (!file || importing.value) return;

  const shouldRestore = importMode.value === 'restore';
  importing.value = true;
  importProgress.value = 0;
  try {
    const result = await uploadBackup(file, event => {
      if (event.total) importProgress.value = Math.round((event.loaded / event.total) * 100);
    });
    if (!result.result) {
      ElMessage.error(result.err || '导入备份失败');
      return;
    }
    await refreshList();

    showImportDecision.value = false;
    if (!shouldRestore) {
      ElMessage.success(
        result.item?.reused
          ? `相同备份已存在，已复用 ${result.item.name}`
          : `备份已导入并保存为 ${result.item?.name || '新文件'}`,
      );
      return;
    }
    if (!result.item) {
      ElMessage.error('备份已导入，但服务未返回备份信息，请从列表中发起恢复');
      return;
    }
    if (!result.item.restorable) {
      ElMessage.warning(result.item.error || '备份已导入，但该备份不能用于恢复');
      return;
    }
    ElMessage.success(
      result.item.reused
        ? `相同备份已存在，已复用 ${result.item.name}，请确认恢复`
        : `备份已导入并保存为 ${result.item.name}，请确认恢复`,
    );
    openRestoreDialog(result.item);
  } catch {
    ElMessage.error('导入备份失败');
  } finally {
    importing.value = false;
  }
};

const refreshRestoreStatus = async () => {
  const operation = restoreOperation.value;
  if (!operation) {
    restoreStatus.value = { state: 'idle' };
    return;
  }

  try {
    const result = await getBackupRestoreStatus(operation.operationId, operation.statusToken);

    if (result.status.operationId && result.status.operationId !== operation.operationId) {
      dismissRestoreStatus();
      return;
    }

    // 成功提示只属于发起或观察到本次恢复的页面，不在刷新后重复展示。
    if (result.status.state === 'succeeded' && !observedActiveRestore.value) {
      restoreStatus.value = { state: 'idle' };
      restoreOperation.value = undefined;
      clearRuntimeRestoreTracking();
      return;
    }

    restoreStatus.value = result.status;
    if (activeRestoreStates.includes(result.status.state)) observedActiveRestore.value = true;
    if (terminalRestoreStates.includes(result.status.state)) clearRuntimeRestoreTracking();
  } catch {
    // 服务切换期间连接失败属于预期行为。
  }
};

const dismissRestoreStatus = () => {
  restoreStatus.value = { state: 'idle' };
  restoreOperation.value = undefined;
  observedActiveRestore.value = false;
  clearRuntimeRestoreTracking();
};

const restoreStatusTitle = computed(() => {
  const titles: Record<BackupRestoreStatus['state'], string> = {
    idle: '',
    pending: '恢复任务已排队，服务即将重新加载',
    quiescing: '正在停止当前 Runtime',
    applying: '正在应用备份',
    starting: '正在初始化新 Runtime',
    rolling_back: '恢复失败，正在回滚原数据',
    succeeded: '备份恢复成功',
    failed: '备份恢复失败',
    rolled_back: '恢复未完成，已自动回滚',
    degraded: '恢复和回滚后的 Runtime 均无法启动',
  };
  return titles[restoreStatus.value.state];
});

const restoreStatusAlertType = computed<'success' | 'warning' | 'error' | 'info'>(() => {
  if (restoreStatus.value.state === 'succeeded') return 'success';
  if (['failed', 'degraded'].includes(restoreStatus.value.state)) return 'error';
  if (restoreStatus.value.state === 'rolled_back') return 'warning';
  return 'info';
});

const openRestoreDialog = (item: BackupInfo) => {
  restoreCandidate.value = item;
  restoreConfirmed.value = false;
  showRestore.value = true;
};

const pollRestoreStatus = async () => {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    await refreshRestoreStatus();
    if (terminalRestoreStates.includes(restoreStatus.value.state)) {
      await refreshList();
      break;
    }
  }
};

const confirmRestore = async () => {
  if (!restoreCandidate.value || !restoreConfirmed.value) return;
  restoring.value = true;
  try {
    const result = await restoreBackup(restoreCandidate.value.name);
    if (!result.result) {
      ElMessage.error(result.err || '创建恢复任务失败');
      return;
    }
    if (!result.operationId || !result.statusToken) {
      ElMessage.error('恢复服务未返回状态凭证');
      return;
    }
    restoreOperation.value = {
      operationId: result.operationId,
      statusToken: result.statusToken,
    };
    rememberRuntimeRestore(result.operationId, result.statusToken);
    observedActiveRestore.value = true;
    restoreStatus.value = {
      state: 'pending',
      sourceName: restoreCandidate.value.name,
      safetyBackupName: result.safetyBackupName,
    };
    showRestore.value = false;
    ElMessage.success('恢复任务已创建，服务即将重新加载');
    void pollRestoreStatus();
  } catch {
    ElMessage.error('创建恢复任务失败');
  } finally {
    restoring.value = false;
  }
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
  const ret = await ElMessageBox.confirm('确认删除？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });
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
  const ret = await ElMessageBox.confirm('确认删除所选备份？删除的内容无法找回！', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });
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

const refreshNow = async () => {
  now.value = dayjs().format('YYMMDD_HHmmss');
  await setTimeout(refreshNow, 1000);
};

onBeforeMount(async () => {
  await configGet();
  await refreshList();
  await refreshRestoreStatus();
  if (activeRestoreStates.includes(restoreStatus.value.state)) void pollRestoreStatus();
  await refreshNow();
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
