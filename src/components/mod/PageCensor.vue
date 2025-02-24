<template>
  <header class="page-header">
    <el-switch
      v-model="censorEnable"
      active-text="启用"
      inactive-text="关闭"
      @change="enableChange" />
    <el-button v-show="censorEnable" type="primary" :icon="Refresh" @click="restartCensor"
      >重载拦截
    </el-button>
  </header>

  <el-affix v-if="censorStore.needReload" :offset="60">
    <div class="tip-danger">
      <el-text type="danger" size="large" tag="strong">存在修改，需要重载后生效！</el-text>
    </div>
  </el-affix>

  <template v-if="censorEnable">
    <el-tabs v-model="tab" stretch>
      <el-tab-pane label="拦截设置" name="setting">
        <censor-config></censor-config>
      </el-tab-pane>

      <el-tab-pane label="敏感词管理" name="word">
        <censor-word-tip></censor-word-tip>
        <censor-files></censor-files>
        <censor-words></censor-words>
      </el-tab-pane>

      <el-tab-pane label="拦截日志" name="log">
        <censor-log></censor-log>
      </el-tab-pane>
    </el-tabs>
  </template>
  <template v-else>
    <el-text type="danger" size="large" style="font-size: 1.5rem; display: block; margin-top: 1rem"
      >请先启用拦截！
    </el-text>
  </template>
</template>

<script lang="ts" setup>
import { Refresh } from '@element-plus/icons-vue';
import { getCensorStatus } from '~/api/censor';
onBeforeMount(() => {
  refreshCensorStatus();
});

import { useCensorStore } from '~/components/mod/censor/censor';

const censorEnable = ref<boolean>(false);

const censorStore = useCensorStore();

const refreshCensorStatus = async () => {
  const status:
    | { result: false }
    | {
        result: true;
        enable: boolean;
        isLoading: boolean;
      } = await getCensorStatus();
  if (status.result) {
    censorEnable.value = status.enable;
  }
};

const restartCensor = async () => {
  const restart = await censorStore.restartCensor();
  if (restart.result) {
    censorEnable.value = restart.enable;
    censorStore.reload();
  }
};

const stopCensor = async () => {
  const stop = await censorStore.stopCensor();
  if (stop.result) {
    censorEnable.value = false;
  }
};

const enableChange = async (value: boolean | number | string) => {
  if (value === true) {
    await restartCensor();
  } else {
    await stopCensor();
  }
};

const tab = ref('setting');
</script>
