<script setup lang="ts">
import type {StoreElem} from "~/type"
import {Download} from "@element-plus/icons-vue";
import * as dayjs from "dayjs";

const props = defineProps<StoreElem>();

const getAuthor = (authors: string[]) => {
  if (authors.length <= 2) {
    return authors.join('、')
  }
  return authors.slice(0, 2).join('、') + '等'
}

</script>

<template>
  <div class="elem w-full flex flex-col bg-white border rounded-md px-3 pt-2 pb-1.5 hover:shadow-md transition duration-500">
    <div class="elem-header flex flex-row justify-between">
      <div class="flex items-center gap-x-2 flex-wrap">
        <div>
          <span class="text-wrap text-base font-bold">{{ props.name }}</span>
          <template v-if="props.type === 'deck'">
            <el-tag size="small" :type="props.ext === '.toml' ? 'success' : 'primary'" disable-transitions>
              {{ props.ext.substring(1) }}
            </el-tag>
          </template>
        </div>
        <el-tag size="small" type="info" disable-transitions>{{ props.version }}</el-tag>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-x-2">
        <span class="flex items-center text-xs text-blue-500">
          <el-icon><Download/></el-icon>{{ props.downloadNum > 1000 ? (props.downloadNum / 1000).toFixed(1) + 'k' : props.downloadNum }}
        </span>
        <el-button :icon="Download" type="success" size="small" plain>下载</el-button>
      </div>
    </div>

    <div class="my-2 whitespace-pre-line text-sm text-gray-500 line-clamp-3">
      <span>{{ props.desc }}</span>
    </div>

    <div class="mt-1.5 py-1 border-t flex justify-between flex-row flex-wrap text-gray-500 text-xs">
      <div class="flex">
        <span>发布于 {{ dayjs.unix(props.releaseTime).format('YYYY-MM-DD HH:MM') }}</span>
        <span class="ml-2" v-if="props.updateTime !== 0">最近更新于 {{
            dayjs.unix(props.updateTime).format('YYYY-MM-DD HH:MM')
          }}</span>
      </div>
      <div class="ml-auto flex gap-x-1 italic before:content-['>']">
        <span>{{ getAuthor(props.authors) || '&lt;佚名>' }}</span>
        <span>以 {{ props.license }} 协议发布</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
</style>
