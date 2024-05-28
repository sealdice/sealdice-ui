<script setup lang="ts">
import type {StoreElem} from "~/type";
import {Download} from "@element-plus/icons-vue";

const props = defineProps<StoreElem>();

const getAuthor = (authors: string[]) => {
  if (authors.length <= 2) {
    return authors.join('、')
  }
  return authors.slice(0, 2).join('、') + '等'
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <header class="flex flex-col gap-y-0.5">
      <div class="flex justify-between items-center">
        <span class="text-base font-bold">{{ props.name }}</span>
        <el-tag type="info" disable-transitions>{{ props.version }}</el-tag>
      </div>

      <aside class="flex flex-wrap gap-x-2 gap-y-0.5">
        <el-tag size="small" type="primary" disable-transitions
                v-for="tag in props.tags.slice(0, 3)" :key="tag">{{ tag }}
        </el-tag>
      </aside>

      <aside class="flex justify-end flex-row text-gray-500 text-xs">
        <div class="ml-auto flex gap-x-1 italic before:content-['by']">
          <span>{{ getAuthor(props.authors) || '&lt;佚名>' }}</span>
        </div>
      </aside>
    </header>

    <main class="flex-1 whitespace-pre-line text-sm text-gray-500 line-clamp-3">
      <span>{{ props.desc }}</span>
    </main>

    <footer class="flex justify-between items-center">
        <span class="flex items-center text-xs text-blue-500">
          <el-icon><Download/></el-icon>{{
            props.downloadNum > 1000 ? (props.downloadNum / 1000).toFixed(1) + 'k' : props.downloadNum
          }}
        </span>
      <el-button :disabled="props.installed" :icon="Download" type="success" size="small" plain>下载</el-button>
    </footer>
  </div>
</template>

<style scoped lang="scss">

</style>