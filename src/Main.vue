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
          :v-show="store.canAccess"
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

      <div class="bg-gray-100 h-auto text-left flex-1 overflow-y-auto">
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
        <el-space :v-show="store.canAccess" direction="vertical" alignment="flex-start" :size="0">
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
    v-model="showDialog"
    title=""
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    class="the-dialog">
    <h3>输入密码解锁</h3>
    <el-input v-model="password" type="password"></el-input>
    <el-button type="primary" style="padding: 0px 50px; margin-top: 1rem" @click="doUnlock"
      >确认</el-button
    >
  </el-dialog>

  <el-dialog
    v-model="dialogLostConnectionVisible"
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

import { passwordHash } from './utils';
import { getNewUtils, postUtilsCheckNews } from './api/utils';
import { checkSecurity } from './api/others';
import {
  clearRuntimeRestoreTracking,
  getRuntimeRestoreTracking,
  markRuntimeRestoreConnectionInterrupted,
} from './utils/runtimeRestore';

dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

const loading = useStorage('router-view-loading', true);

const store = useStore();
const password = ref('');

const dialogFeed = ref(false);

const newsData = ref(`<div>暂无内容</div>`);
const newsChecked = ref(true);
const newsMark = ref('');
const checkNews = async (close: any) => {
  console.log('newsMark', newsMark.value);
  const ret = await postUtilsCheckNews(newsMark.value);
  if (ret?.result) {
    ElMessage.success('已阅读最新的海豹新闻');
  } else {
    ElMessage.error('阅读海豹新闻失败');
  }
  await updateNews();
  close();
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

const showDialog = computed(() => {
  return !store.canAccess;
});

const dialogLostConnectionVisible = ref(false);
let reauthenticating = false;
let checkingSecurity = false;
const securityWarningSessionKey = 'sd-security-warning-shown';

const doUnlock = async () => {
  const hash = await passwordHash(store.salt, password.value);
  await store.signIn(hash);
  if (store.canAccess) {
    ElMessageBox.alert('欢迎回来，请开始使用。', '登录成功');
    password.value = '';
    checkPassword();
    window.location.reload();
  } else {
    ElMessageBox.alert('错误的密码', '登录失败');
    password.value = '';
  }
};

const checkPassword = async () => {
  if (checkingSecurity || sessionStorage.getItem(securityWarningSessionKey) === '1') return;
  checkingSecurity = true;
  try {
    if (!(await checkSecurity()).isOk) {
      sessionStorage.setItem(securityWarningSessionKey, '1');
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

onBeforeMount(async () => {
  store.getBaseInfo();
  store.getCustomText();

  if (store.canAccess) {
    checkPassword();
  }

  timerId = setInterval(async () => {
    // 没输入密码，先不心跳
    if (!store.canAccess) {
      return;
    }
    try {
      await store.getBaseInfo();
      if (dialogLostConnectionVisible.value) {
        dialogLostConnectionVisible.value = false;
      }
      if (getRuntimeRestoreTracking()?.connectionInterrupted) {
        clearRuntimeRestoreTracking();
      }
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 403) {
        // 服务已恢复但旧令牌不再有效；无密码实例应自动获取新令牌。
        dialogLostConnectionVisible.value = false;
        clearRuntimeRestoreTracking();
        if (reauthenticating) return;
        reauthenticating = true;
        try {
          await store.trySignIn();
        } catch {
          store.canAccess = false;
        } finally {
          reauthenticating = false;
        }
        return;
      }
      if (getRuntimeRestoreTracking()) {
        // Runtime 计划内切换期间的短暂连接失败不属于主程序离线。
        markRuntimeRestoreConnectionInterrupted();
        dialogLostConnectionVisible.value = false;
        return;
      }
      dialogLostConnectionVisible.value = true;
    }
  }, 5000) as any;

  await updateNews();

  const conf = await store.diceAdvancedConfigGet();
  if (conf.show) {
    advancedConfigCounter.value = 8;
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let timerId: number;

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
