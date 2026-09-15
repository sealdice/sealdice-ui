<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <el-container id="root" class="bg-gray-600 mx-auto my-0 h-screen flex flex-col">
    <el-header class="nav bg-inherit flex-none text-white flex justify-between">
      <el-space alignment="center" :size="0" style="height: 60px">
        <div class="menu-button-wrapper mx-2">
          <el-button link size="large" @click="drawerMenu = true">
            <el-icon color="#fff" size="1.5rem">
              <IconMenu />
            </el-icon>
          </el-button>
        </div>

        <el-space
          v-show="store.canAccess"
          direction="vertical"
          alignment="flex-start"
          :size="0"
          style="">
          <el-space size="small" alignment="center">
            <span style="font-size: 1.2rem; cursor: pointer" @click="enableAdvancedConfig"
              >SealDice</span
            >
            <el-tooltip
              v-if="store.diceServers.length > 0 && store.diceServers[0].baseInfo.containerMode"
              class="flex items-center">
              <template #content>当前以容器模式启动，部分功能受到限制。</template>
              <el-icon type="info">
                <i-carbon-container-software />
              </el-icon>
            </el-tooltip>
          </el-space>
          <span v-if="store.diceServers.length > 0" size="small" style="font-size: 0.7rem">
            {{ store.diceServers[0].baseInfo.OS }} -
            {{ store.diceServers[0].baseInfo.arch }}
          </span>
        </el-space>
      </el-space>

      <el-space
        v-show="store.canAccess"
        size="large"
        style="color: #fff; font-size: small; text-align: right">
        <div style="cursor: pointer" @click="dialogFeed = true">
          <el-badge value="new" :hidden="newsChecked">
            <img :src="imgNews" alt="news" style="width: 2.3rem" />
          </el-badge>
        </div>

        <div style="display: flex; flex-direction: column; align-items: center">
          <div style="display: flex; align-items: center">
            <el-tag
              effect="dark"
              size="small"
              disable-transitions
              style="margin-right: 0.3rem"
              :type="store.curDice.baseInfo.appChannel === 'stable' ? 'success' : 'info'">
              {{ store.curDice.baseInfo.appChannel === 'stable' ? '正式版' : '测试版' }}
            </el-tag>
            <el-tooltip :content="store.curDice.baseInfo.version" placement="bottom">
              <el-text size="large" style="color: #fff">
                {{ store.curDice.baseInfo.versionSimple }}
              </el-text>
            </el-tooltip>
          </div>
          <div v-if="store.curDice.baseInfo.versionCode < store.curDice.baseInfo.versionNewCode">
            🆕{{ store.curDice.baseInfo.versionNew }}
          </div>
        </div>
      </el-space>
    </el-header>

    <div class="flex-grow overflow-y-auto flex">
      <div class="menu bg-inherit flex-none overflow-y-auto no-scrollbar">
        <Menu v-model:advanced-config-counter="advancedConfigCounter" type="dark" />
      </div>

      <div class="bg-gray-100 h-auto text-left flex-1 overflow-y-auto flex flex-col">
        <el-alert
          v-if="restoreStatus.state !== 'idle' && restoreStatus.state !== 'succeeded'"
          :title="restoreStatusTitle"
          :type="restoreStatusAlertType"
          :closable="restoreStatusClosable"
          show-icon
          class="runtime-status-alert"
          @close="store.dismissRuntimeRestoreStatus">
          <div v-if="restoreStatus.message">{{ restoreStatus.message }}</div>
          <div v-if="restoreStatus.safetyBackupName">
            恢复前安全备份：{{ restoreStatus.safetyBackupName }}
          </div>
          <div v-if="store.runtimeRestorePollingUnavailable && store.runtimeRestoreInProgress">
            状态连接暂时中断，系统会继续自动查询。
          </div>
        </el-alert>
        <el-alert
          v-else-if="store.authStatus === 'maintenance'"
          :title="runtimeMaintenanceTitle"
          type="warning"
          :closable="false"
          show-icon
          class="runtime-status-alert" />
        <el-main ref="rightbox" v-loading="loading" class="main-container w-full h-full">
          <router-view
            v-if="!loading"
            @update:advanced-settings-show="(show: boolean) => refreshAdvancedSettings(show)" />
        </el-main>
      </div>
    </div>
  </el-container>

  <el-drawer
    v-model="drawerMenu"
    direction="ltr"
    :show-close="false"
    size="50%"
    class="drawer-menu bg-gray-600">
    <template #header>
      <div class="text-white flex items-center justify-between">
        <el-space v-show="store.canAccess" direction="vertical" alignment="flex-start" :size="0">
          <span style="font-size: 1.2rem; cursor: pointer" @click="enableAdvancedConfig"
            >SealDice</span
          >
          <span v-if="store.diceServers.length > 0" style="font-size: 0.7rem">
            {{ store.diceServers[0].baseInfo.OS }} -
            {{ store.diceServers[0].baseInfo.arch }}
          </span>
        </el-space>

        <el-tag
          effect="dark"
          size="small"
          disable-transitions
          :type="store.curDice.baseInfo.appChannel === 'stable' ? 'success' : 'info'">
          {{ store.curDice.baseInfo.appChannel === 'stable' ? '正式版' : '测试版' }}
        </el-tag>
      </div>
    </template>
    <Menu v-model:advanced-config-counter="advancedConfigCounter" type="dark" />
  </el-drawer>

  <el-dialog
    :model-value="showPasswordDialog"
    title=""
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    class="the-dialog">
    <h3>输入密码解锁</h3>
    <el-input v-model="password" type="password"></el-input>
    <el-button
      type="primary"
      :loading="unlocking"
      style="padding: 0px 50px; margin-top: 1rem"
      @click="doUnlock">
      确认
    </el-button>
  </el-dialog>

  <el-dialog
    :model-value="store.authStatus === 'offline'"
    title="主程序离线"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    class="the-dialog">
    <div>与主程序断开连接，请耐心等待连接恢复</div>
    <div>如果失去响应过久，请登录服务器处理</div>
  </el-dialog>

  <el-dialog
    v-model="dialogFeed"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="dialog-feed"
    :show-close="false">
    <template #header="{ close, titleId, titleClass }">
      <div class="my-header">
        <h4 :id="titleId" :class="titleClass" style="margin: 0.5rem">海豹新闻</h4>
        <el-button type="success" :icon="Check" @click="checkNews(close)">确认已读</el-button>
      </div>
    </template>

    <div style="text-align: left" v-html="newsData"></div>
  </el-dialog>
</template>

<script setup lang="ts">
import { useStore } from './store';
import imgNews from '~/assets/news.png';

import { Check, Menu as IconMenu } from '@element-plus/icons-vue';

import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import { isAxiosError } from 'axios';
import type { BackupRestoreStatus } from './api/backup';

import { passwordHash } from './utils';
import { getNewUtils, postUtilsCheckNews } from './api/utils';
import { checkSecurity } from './api/others';

dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

const loading = useStorage('router-view-loading', true);

const store = useStore();
const password = ref('');
const unlocking = ref(false);

const dialogFeed = ref(false);

const newsData = ref(`<div>暂无内容</div>`);
const newsChecked = ref(true);
const newsMark = ref('');
const checkNews = async (close: any) => {
  try {
    const ret = await postUtilsCheckNews(newsMark.value);
    if (ret?.result) {
      ElMessage.success('已阅读最新的海豹新闻');
    } else {
      ElMessage.error('阅读海豹新闻失败');
    }
    await updateNews();
    close();
  } catch {
    ElMessage.error('阅读海豹新闻失败');
  }
};
const updateNews = async () => {
  const newsInfo = await getNewUtils();
  if (newsInfo.result) {
    newsData.value = newsInfo.news;
    newsChecked.value = newsInfo.checked;
    newsMark.value = newsInfo.newsMark;
  } else {
    ElMessage.error(newsInfo?.err ?? '获取海豹新闻失败');
  }
};

const showPasswordDialog = computed(
  () => store.authStatus === 'password-required' && store.passwordRequired === true,
);
const restoreStatus = computed(() => store.runtimeRestoreStatus);
const restoreStatusClosable = computed(() =>
  ['failed', 'rolled_back', 'degraded'].includes(restoreStatus.value.state),
);
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
    degraded: '备份恢复处于降级状态，请检查详情或日志',
  };
  return titles[restoreStatus.value.state];
});
const restoreStatusAlertType = computed<'warning' | 'error' | 'info'>(() => {
  if (['failed', 'degraded'].includes(restoreStatus.value.state)) return 'error';
  if (restoreStatus.value.state === 'rolled_back') return 'warning';
  return 'info';
});
const runtimeMaintenanceTitle = computed(() =>
  store.runtimeMaintenanceCode === 'RUNTIME_UNAVAILABLE'
    ? 'Runtime 当前不可用，正在等待服务恢复'
    : 'Runtime 正在重新加载，请稍候',
);
const sessionStable = computed(
  () => store.authStatus === 'authenticated' && !store.runtimeRestoreInProgress,
);

let checkingSecurity = false;
const securityWarningSessionKey = 'sd-security-warning-shown';
const welcomeSessionKey = 'sd-welcome-shown';
let welcomeShownInMemory = false;
let securityWarningShownInMemory = false;

const doUnlock = async () => {
  if (unlocking.value) return;
  unlocking.value = true;
  try {
    const hash = await passwordHash(store.salt, password.value);
    const signedIn = await store.signIn(hash);
    password.value = '';
    if (!signedIn && store.authStatus === 'password-required') {
      ElMessageBox.alert('错误的密码', '登录失败');
    } else if (!signedIn && store.authStatus === 'maintenance') {
      ElMessage.warning('Runtime 正在重新加载，请稍后重试');
    } else if (!signedIn) {
      ElMessage.error('无法连接主程序，请稍后重试');
    }
  } finally {
    unlocking.value = false;
  }
};

const checkPassword = async () => {
  if (checkingSecurity || securityWarningShownInMemory) return;
  try {
    if (sessionStorage.getItem(securityWarningSessionKey) === '1') {
      securityWarningShownInMemory = true;
      return;
    }
  } catch {
    // 受限环境下仍通过内存标记避免本次挂载重复提示。
  }
  checkingSecurity = true;
  try {
    if (!(await checkSecurity()).isOk) {
      securityWarningShownInMemory = true;
      try {
        sessionStorage.setItem(securityWarningSessionKey, '1');
      } catch {
        // 会话存储不可用时仅保留内存标记。
      }
      await ElMessageBox.alert(
        '欢迎使用海豹核心。<br/>如果您的服务开启在公网，为了保证您的安全性，请前往<b>“综合设置->基本设置”</b>界面，设置<b>UI 界面密码</b>。<br/>或切换为只有本机可访问。<br><b>如果您不了解上面在说什么，请务必设置一个密码</b>',
        '提示',
        { dangerouslyUseHTMLString: true },
      );
    }
  } catch {
    // 连接异常由全局心跳处理，安全检查将在下次浏览器会话重新执行。
  } finally {
    checkingSecurity = false;
  }
};

const showWelcomeOnce = () => {
  if (welcomeShownInMemory) return;
  try {
    if (sessionStorage.getItem(welcomeSessionKey) === '1') {
      welcomeShownInMemory = true;
      return;
    }
    sessionStorage.setItem(welcomeSessionKey, '1');
  } catch {
    // 受限环境下仍通过内存标记保证本次挂载只提示一次。
  }
  welcomeShownInMemory = true;
  ElMessage.success({ message: '欢迎回来，请开始使用。', duration: 3000 });
};

let baseInfoRequest: Promise<void> | undefined;
const refreshBaseInfo = () => {
  if (!baseInfoRequest) {
    baseInfoRequest = store
      .getBaseInfo()
      .then(() => undefined)
      .finally(() => {
        baseInfoRequest = undefined;
      });
  }
  return baseInfoRequest;
};

let stableDataRequest: Promise<void> | undefined;
let stableDataLoaded = false;
const loadStableApplicationData = async () => {
  if (!sessionStable.value || stableDataLoaded) return;
  if (stableDataRequest) return stableDataRequest;

  stableDataRequest = (async () => {
    try {
      await refreshBaseInfo();
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 403) await store.trySignIn();
      else store.setAuthStatusFromError(error);
      return;
    }
    if (!sessionStable.value) return;

    const [customTextResult, newsResult, advancedConfigResult] = await Promise.allSettled([
      store.getCustomText(),
      updateNews(),
      store.diceAdvancedConfigGet(),
    ]);
    if (!sessionStable.value) return;
    if (advancedConfigResult.status === 'fulfilled' && advancedConfigResult.value.show) {
      advancedConfigCounter.value = 8;
    }
    if (customTextResult.status === 'rejected' || newsResult.status === 'rejected') {
      // Heartbeat will retry the complete stable-data load after connectivity returns.
      stableDataLoaded = false;
    } else {
      stableDataLoaded = true;
    }
    showWelcomeOnce();
    void checkPassword();
  })().finally(() => {
    stableDataRequest = undefined;
  });
  return stableDataRequest;
};

const heartbeat = async () => {
  if (store.authStatus === 'checking' || store.authStatus === 'password-required') return;
  if (store.authStatus !== 'authenticated') {
    await store.trySignIn();
    if (sessionStable.value) void loadStableApplicationData();
    return;
  }

  try {
    await refreshBaseInfo();
    if (!stableDataLoaded) void loadStableApplicationData();
  } catch (error: unknown) {
    stableDataLoaded = false;
    if (isAxiosError(error) && error.response?.status === 403) await store.trySignIn();
    else store.setAuthStatusFromError(error);
  }
};

watch(
  sessionStable,
  stable => {
    if (stable) void loadStableApplicationData();
    else stableDataLoaded = false;
  },
  { immediate: true },
);

let notifiedRestoreOperation: string | undefined;
watch(
  () => store.runtimeRestoreStatus,
  status => {
    if (status.state !== 'succeeded') return;
    const operationKey =
      status.operationId || `${status.sourceName || ''}:${status.updatedAt || ''}`;
    if (operationKey === notifiedRestoreOperation) return;
    notifiedRestoreOperation = operationKey;
    ElMessage.success({ message: '备份恢复成功，Runtime 已重新启动', duration: 5000 });
  },
  { deep: true, immediate: true },
);

let heartbeatTimerId: number | undefined;
let heartbeatGeneration = 0;
const scheduleHeartbeat = (generation: number) => {
  heartbeatTimerId = window.setTimeout(async () => {
    heartbeatTimerId = undefined;
    try {
      await heartbeat();
    } catch (error: unknown) {
      stableDataLoaded = false;
      store.setAuthStatusFromError(error);
    } finally {
      if (generation === heartbeatGeneration) scheduleHeartbeat(generation);
    }
  }, 5000);
};

onMounted(() => {
  const generation = ++heartbeatGeneration;
  scheduleHeartbeat(generation);
});

onBeforeUnmount(() => {
  heartbeatGeneration++;
  if (heartbeatTimerId !== undefined) window.clearTimeout(heartbeatTimerId);
  heartbeatTimerId = undefined;
});

const rightbox = ref(null);

const drawerMenu = ref<boolean>(false);

const advancedConfigCounter = ref<number>(0);
const enableAdvancedConfig = async () => {
  advancedConfigCounter.value++;
  const counter = advancedConfigCounter.value;
  if (counter > 8) {
    ElMessage.info('高级设置页已经开启');
    await router.push({ path: '/misc/advanced-setting' });
    return;
  } else if (counter === 8) {
    const conf = await store.diceAdvancedConfigGet();
    conf.show = true;
    conf.enable = true;
    await store.diceAdvancedConfigSet(conf);
    await router.push({ path: '/misc/advanced-setting' });
    ElMessage.success('已开启高级设置页');
  } else if (counter > 2) {
    ElMessage.info('再按 ' + (8 - counter) + ' 次开启高级设置页');
  }
};

const router = useRouter();
const refreshAdvancedSettings = async (show: boolean) => {
  if (!show) {
    advancedConfigCounter.value = 0;
    await router.push({ path: '/log', replace: true });
    ElMessage.success('已关闭高级设置页');
  }
};
</script>

<style>
html,
body {
  height: 100%;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track-piece {
  background: #fafafa;
}

::-webkit-scrollbar-thumb {
  background: #bdbdbd;
}

::-webkit-scrollbar-corner {
  background: #fafafa;
}

::-webkit-scrollbar-thumb:window-inactive {
  background: #e0e0e0;
}

::-webkit-scrollbar-thumb:hover {
  background: #9e9e9e;
}

.main-container {
  padding: 2rem;
  box-sizing: border-box;
  min-height: 100%;
}

.runtime-status-alert {
  flex: none;
  border-radius: 0;
}

.h100 {
  height: 100%;
}

@media screen and (max-width: 639.9px) {
  .nav {
    padding: 0 0.5rem 0 0;
  }

  .menu {
    display: none;
  }

  .menu-button-wrapper {
    display: block;
  }

  .main-container {
    padding: 1rem;
  }
}

@media screen and (min-width: 640px) {
  .nav {
    padding: 0 1rem 0 1.5rem;
  }

  .menu {
    display: block;
  }

  .menu-button-wrapper {
    display: none;
  }
}

.sd-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

#app {
  font-family:
    'PingFang SC', 'Helvetica Neue', 'Hiragino Sans GB', 'Segoe UI', 'Microsoft YaHei', '微软雅黑',
    sans-serif;
  /* font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif; */
  text-align: center;
  color: #2c3e50;
  height: 100%;
  display: flex;
}

.element-plus-logo {
  width: 50%;
}

.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

@media screen and (max-width: 640px) {
  .dialog-feed {
    width: 90% !important;
  }
}

.drawer-menu {
  background-color: #545c64;

  .el-drawer__header {
    margin: 0;
    padding: 1rem;
  }

  .el-drawer__body {
    padding: 0;
  }
}
</style>
