<template>
  <header class="page-header">
    <el-switch v-model="censorEnable" @change="enableChange" active-text="启用"
               inactive-text="关闭"/>
    <el-button type="primary" :icon="Refresh"
               v-show="censorEnable" @click="restartCensor">重载拦截
    </el-button>
  </header>

  <el-affix :offset="60" v-if="modified">
    <div class="tip-danger">
      <el-text type="danger" size="large" tag="strong">内容已修改，不要忘记保存！</el-text>
    </div>
  </el-affix>

  <template v-if="censorEnable">
    <el-tabs v-model="tab" stretch>
      <el-tab-pane label="拦截设置" name="setting">
        <censor-config></censor-config>
      </el-tab-pane>

      <el-tab-pane label="敏感词管理" name="word">
        <h4>词库列表</h4>
        <censor-files></censor-files>
        <h4>敏感词列表</h4>
        <censor-words></censor-words>
      </el-tab-pane>

      <el-tab-pane label="拦截日志" name="log">
        <censor-log></censor-log>
      </el-tab-pane>
    </el-tabs>
  </template>
  <template v-else>
    <el-text type="danger" size="large" style="font-size: 1.5rem; display: block; margin-top: 1rem;">请先启用拦截！
    </el-text>
  </template>
</template>

<script lang='ts' setup>
import {Refresh} from '@element-plus/icons-vue';
import {onBeforeMount, ref} from 'vue';
import {urlPrefix, useStore} from '~/store';
import {backend} from '~/backend'
import {b} from "ofetch/dist/shared/ofetch.0b644faf";

onBeforeMount(() => {
  refreshCensorStatus()
})

import CensorFiles from "~/components/mod/censor/CensorFiles.vue";

const store = useStore()
const token = store.token

const url = (p: string) => urlPrefix + "/censor/" + p;
const censorEnable = ref<boolean>(false)

const refreshCensorStatus = async () => {
  const status: { result: false } | {
    result: true,
    enable: boolean,
    isLoading: boolean
  } = await backend.get(url("status"), {});
  if (status.result) {
    censorEnable.value = status.enable
  }
}

const restartCensor = async () => {
  const restart: { result: false } | {
    result: true,
    enable: boolean,
    isLoading: boolean
  } = await backend.post(url("restart"), {});
  if (restart.result) {
    censorEnable.value = restart.enable
  }
}
const enableChange = async (value: boolean) => {
  if (value) {
    await restartCensor()
  }
}

const modified = ref<boolean>(false)

const tab = ref("setting")

</script>