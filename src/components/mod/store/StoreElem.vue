<script setup lang="ts">
import type {StoreElem} from "~/type"
import {Download} from "@element-plus/icons-vue";
import * as dayjs from "dayjs";
import {useStore} from "~/store";

interface StoreElemProps extends StoreElem {
  index: number
}

const props = defineProps<StoreElemProps>();
const emits = defineEmits(['downloaded']);

const store = useStore()

const getAuthor = (authors: string[]) => {
  if (authors.length <= 2) {
    return authors.join('、')
  }
  return authors.slice(0, 2).join('、') + '等'
}

const downloading = ref(false)
const download = async () => {
  downloading.value = true
  const response = await store.storeDownload(props)
  if (response.result) {
    emits('downloaded', props.id)
    ElMessage.success("下载成功，已自动重载！")
  } else {
    ElMessage.error(`下载失败！${response.err ?? ''}`)
  }
  downloading.value = false
}

const rate = ref<number>(props.rate ?? 0)
const rating = async () => {
  const response = await store.storeRating({id: props.id, rate: rate.value})
  if (response.result) {
    ElMessage.success("评分成功！")
  } else {
    ElMessage.error(`评分失败！${response.err ?? ''}`)
  }
}
</script>

<template>
  <div
      class="elem w-full flex flex-col bg-white border rounded-md px-3 pt-2 pb-1.5 hover:shadow-md transition duration-500">
    <header class="elem-header flex flex-row justify-between">
      <div class="flex items-center gap-x-2 flex-wrap">
        <div class="flex items-center gap-x-1">
          <span class="text-wrap text-sm text-gray-500">#{{ props.index + 1 }}</span>
          <span class="text-wrap text-base font-bold">{{ props.name }}</span>
          <template v-if="props.type === 'deck'">
            <el-tag size="small" :type="props.ext === '.toml' ? 'success' : 'primary'" disable-transitions>
              {{ props.ext.substring(1) }}
            </el-tag>
          </template>
        </div>
        <el-tag size="small" type="info" disable-transitions>{{ props.version }}</el-tag>
      </div>

      <aside class="flex flex-wrap items-center justify-center gap-x-2">
        <span v-if="props.downloadNum" class="flex items-center text-xs text-blue-500">
          <el-icon><Download/></el-icon>{{
            props.downloadNum > 1000 ? (props.downloadNum / 1000).toFixed(1) + 'k' : props.downloadNum
          }}
        </span>
        <span v-else/>
        <el-button v-if="!props.installed" :icon="Download" type="success" size="small" plain
                   @click="download" :loading="downloading">下载
        </el-button>
        <el-button v-else disabled :icon="Download" type="info" size="small" plain>
          已下载
        </el-button>
      </aside>
    </header>

    <aside class="mt-1 elem-extra flex flex-row justify-between items-center">
      <div class="text-xs text-gray-500">
        <div class="flex flex-wrap gap-x-2 gap-y-0.5">
          <el-tag size="small" type="primary" disable-transitions
                  v-for="tag in props.tags" :key="tag">{{ tag }}
          </el-tag>
        </div>
      </div>
      <el-rate class="ml-2" v-if="props.rate" v-model="rate" :disabled="!props.installed" @change="rating"/>
    </aside>

    <main class="mt-2 my-4 whitespace-pre-line text-sm text-gray-500 line-clamp-3">
      <span>{{ props.desc }}</span>
    </main>

    <footer class="py-1 border-t flex justify-between flex-row-reverse flex-wrap text-gray-500 text-xs italic">
      <div class="ml-auto flex gap-x-1 before:content-['>']">
        <span>{{ getAuthor(props.authors) || '&lt;佚名>' }}</span>
        <span>以 {{ props.license }} 协议发布</span>
      </div>
      <div class="flex">
        <span>发布于 {{ dayjs.unix(props.releaseTime).format('YYYY-MM-DD HH:MM') }}</span>
        <span class="ml-2" v-if="props.updateTime && props.updateTime !== 0">最近更新于 {{
            dayjs.unix(props.updateTime).format('YYYY-MM-DD HH:MM')
          }}</span>
      </div>
    </footer>
  </div>
</template>

<style lang="scss">
</style>
