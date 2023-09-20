<template>
  <header>
    <el-button type="primary" :icon="DocumentChecked" @click="submit">保存设置</el-button>
    <el-text style="margin-left: 1rem" v-if="modified" type="danger" size="large" tag="strong">
      内容已修改，不要忘记保存！
    </el-text>
  </header>
  <el-form label-width="100px">
    <h4>匹配选项</h4>
    <el-form-item label="大小写敏感">
      <el-checkbox label="开启" v-model="config.caseSensitive"/>
    </el-form-item>
    <el-form-item label="匹配拼音">
      <el-checkbox label="开启" v-model="config.matchPinyin"/>
    </el-form-item>
    <el-form-item label="过滤字符正则">
      <el-input v-model="config.filterRegex" style="width: 12rem;"/>
    </el-form-item>

    <h4>响应设置</h4>
    <el-form-item>
      <template #label>
        <el-tag type="info" style="align-self: center">提醒</el-tag>
      </template>
      <el-space wrap>
        <el-text>用户触发超过</el-text>
        <el-input-number v-model="config.levelConfig.notice.threshold" style="margin: 0 0.5rem;" size="small" :step="1"
                         step-strictly/>
        <el-text>次时：</el-text>
      </el-space>
      <el-space direction="vertical" alignment="normal">
        <div>
          <el-checkbox-group v-model="noticeHandlers">
            <el-checkbox v-for="handle in defaultHandles" :label="handle.key">
              {{ handle.name }}
            </el-checkbox>
          </el-checkbox-group>
          <el-text>怒气值</el-text>
          <el-input-number v-model="config.levelConfig.notice.score" style="margin-left: 1rem;" size="small" :step="1"
                           step-strictly/>
        </div>
      </el-space>
    </el-form-item>
    <el-form-item>
      <template #label>
        <el-tag size="small" style="align-self: center">注意</el-tag>
      </template>
      <el-space wrap>
        <el-text>用户触发超过</el-text>
        <el-input-number v-model="config.levelConfig.caution.threshold" style="margin: 0 0.5rem;" size="small" :step="1"
                         step-strictly/>
        <el-text>次时：</el-text>
      </el-space>
      <el-space direction="vertical" alignment="normal">
        <div>
          <el-checkbox-group v-model="cautionHandlers">
            <el-checkbox v-for="handle in defaultHandles" :label="handle.key">
              {{ handle.name }}
            </el-checkbox>
          </el-checkbox-group>
          <el-text>怒气值</el-text>
          <el-input-number v-model="config.levelConfig.caution.score" style="margin-left: 1rem;" size="small" :step="1"
                           step-strictly/>
        </div>
      </el-space>
    </el-form-item>
    <el-form-item>
      <template #label>
        <el-tag type="warning" size="small" style="align-self: center">警告</el-tag>
      </template>
      <el-space wrap>
        <el-text>用户触发超过</el-text>
        <el-input-number v-model="config.levelConfig.warning.threshold" style="margin: 0 0.5rem;" size="small" :step="1"
                         step-strictly/>
        <el-text>次时：</el-text>
      </el-space>
      <el-space direction="vertical" alignment="normal">
        <div>
          <el-checkbox-group v-model="warningHandlers">
            <el-checkbox v-for="handle in defaultHandles" :label="handle.key">
              {{ handle.name }}
            </el-checkbox>
          </el-checkbox-group>
          <el-text>怒气值</el-text>
          <el-input-number v-model="config.levelConfig.warning.score" style="margin-left: 1rem;" size="small" :step="1"
                           step-strictly/>
        </div>
      </el-space>
    </el-form-item>
    <el-form-item>
      <template #label>
        <el-tag type="danger" size="small" style="align-self: center">危险</el-tag>
      </template>
      <el-space wrap>
        <el-text>用户触发超过</el-text>
        <el-input-number v-model="config.levelConfig.danger.threshold" style="margin: 0 0.5rem;" size="small" :step="1"
                         step-strictly/>
        <el-text>次时：</el-text>
      </el-space>
      <el-space direction="vertical" alignment="normal">
        <div>
          <el-checkbox-group v-model="dangerHandlers">
            <el-checkbox v-for="handle in defaultHandles" :label="handle.key">
              {{ handle.name }}
            </el-checkbox>
          </el-checkbox-group>
          <el-text>怒气值</el-text>
          <el-input-number v-model="config.levelConfig.danger.score" style="margin-left: 1rem;" size="small" :step="1"
                           step-strictly/>
        </div>
      </el-space>
    </el-form-item>

  </el-form>
</template>

<script lang="ts" setup>

import {onBeforeMount, ref, toRaw, watch} from "vue";
import {backend} from "~/backend";
import {urlPrefix} from "~/store";
import {objDiff} from "~/utils";
import {DocumentChecked} from "@element-plus/icons-vue";
import {isArray, isEqual, isObject, transform} from "lodash-es";
import {ElMessage} from "element-plus";
import * as trace_events from "trace_events";

onBeforeMount(() => {
  refreshCensorConfig()
})

const url = (p: string) => urlPrefix + "/censor/" + p;

interface Config {
  caseSensitive: boolean
  matchPinyin: boolean
  filterRegex: string
  levelConfig: LevelConfigs
}

const config = ref<Config>({
  caseSensitive: false,
  matchPinyin: false,
  filterRegex: "",
  levelConfig: {
    notice: {threshold: 0, handlers: [], score: 0},
    caution: {threshold: 0, handlers: [], score: 0},
    warning: {threshold: 0, handlers: [], score: 0},
    danger: {threshold: 0, handlers: [], score: 0},
  },
})
const noticeHandlers = ref<string[]>([])
const cautionHandlers = ref<string[]>([])
const warningHandlers = ref<string[]>([])
const dangerHandlers = ref<string[]>([])

interface LevelConfigs {
  notice: LevelConfig
  caution: LevelConfig
  warning: LevelConfig
  danger: LevelConfig
}

interface LevelConfig {
  threshold: number
  handlers: string[]
  score: number
}

const defaultHandles: { key: string, name: string }[] = [
  {key: "SendWarning", name: "发送警告"},
  {key: "SendNotice", name: "通知 Master"},
  {key: "BanUser", name: "拉黑用户"},
  {key: "BanGroup", name: "拉黑群"},
  {key: "BanInviter", name: "拉黑邀请人"},
  {key: "AddScore", name: "增加怒气值"},
]

const modified = ref<boolean>(false)

watch(config, () => {
  modified.value = true
}, {deep: true});
watch(noticeHandlers, () => {
  modified.value = true
}, {deep: true});
watch(cautionHandlers, () => {
  modified.value = true
}, {deep: true});
watch(warningHandlers, () => {
  modified.value = true
}, {deep: true});
watch(dangerHandlers, () => {
  modified.value = true
}, {deep: true});

const getCensorConfig = async () => {
  const c: { result: false } | {
    result: true
    caseSensitive: boolean
    matchPinyin: boolean
    filterRegex: string
    levelConfig: LevelConfigs
  } = await backend.get(url("config"));
  if (c.result) {
    return c
  }
}

const refreshCensorConfig = async () => {
  const c = await getCensorConfig()
  if (c) {
    config.value = c
    noticeHandlers.value = c.levelConfig.notice.handlers
    cautionHandlers.value = c.levelConfig.caution.handlers
    warningHandlers.value = c.levelConfig.warning.handlers
    dangerHandlers.value = c.levelConfig.danger.handlers
    modified.value = false
  }
}

const confDiff = (object: any, base: any) => {
  const changes = function (object: any, base: any) {
    return transform(object, (result: any, value, key) => {
      if (isArray(value)) {
        result[key] = value
      } else if (!isEqual(value, base[key])) {
        result[key] = (isObject(value) && isObject(base[key])) ? changes(value, base[key]) : value
      }
    })
  }
  return changes(object, base)
}

const submit = async () => {
  config.value.levelConfig.notice.handlers = noticeHandlers.value
  config.value.levelConfig.caution.handlers = cautionHandlers.value
  config.value.levelConfig.warning.handlers = warningHandlers.value
  config.value.levelConfig.danger.handlers = dangerHandlers.value
  const conf = await getCensorConfig()
  const modify = confDiff(config.value, conf)

  const resp : {result: true} | {result: false, err: string} = await backend.post(url("config"), modify);
  if (resp.result) {
    ElMessage.success("保存设置成功")
  } else {
    ElMessage.error("保存设置失败，" + resp.err)
  }


  await refreshCensorConfig()
  modified.value = false
}
</script>