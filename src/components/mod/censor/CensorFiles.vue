<template>
  <header>
    <el-button type="primary" :icon="Upload">导入</el-button>
<!--    <el-button type="primary" :icon="Refresh" @click="refreshFiles" plain>刷新文件</el-button>-->
  </header>
  <main style="margin-top: 1rem;">
    <el-table table-layout="auto" :data="files">
      <el-table-column fixed label="文件名" prop="name"></el-table-column>
      <el-table-column prop="count[1]">
        <template #header>
          <el-tag type="info" disable-transitions>提醒</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="count[2]">
        <template #header>
          <el-tag disable-transitions>注意</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="count[3]">
        <template #header>
          <el-tag type="warning" disable-transitions>警告</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="count[4]">
        <template #header>
          <el-tag type="danger" disable-transitions>危险</el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right">
        <template #default="scope">
          <el-button size="small" type="danger" :icon="Delete" plain>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </main>
</template>

<script setup lang="ts">
import {Delete, Refresh, Upload} from "@element-plus/icons-vue";
import {urlPrefix} from "~/store";
import {backend} from "~/backend";
import {onBeforeMount, ref} from "vue";

onBeforeMount(() => {
  refreshFiles()
})

const url = (p: string) => urlPrefix + "/censor/" + p;

interface SensitiveWordFile {
  path: string,
  counter: number[]
}
const files = ref<SensitiveWordFile[]>()

const refreshFiles = async () => {
  const c: { result: false } | {
    result: true,
    data: SensitiveWordFile[]
  } = await backend.get(url("files"))
  if (c.result) {
    files.value = c.data
  }
}

</script>