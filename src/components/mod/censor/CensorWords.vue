<template>
  <header>
    <el-button type="primary" :icon="Refresh" @click="refreshWords" plain>刷新列表</el-button>
  </header>
  <main style="margin-top: 1rem;">
    <el-table table-layout="auto" :data="words" :default-sort="{ prop: 'level', order: 'ascending' }">
      <el-table-column label="级别" width="80px">
        <template #default="scope">
          <el-tag v-if="scope.row.level === 1" type="info" size="small" disable-transitions>提醒</el-tag>
          <el-tag v-else-if="scope.row.level === 2" size="small" disable-transitions>注意</el-tag>
          <el-tag v-else-if="scope.row.level === 3" type="warning" size="small" disable-transitions>警告</el-tag>
          <el-tag v-else-if="scope.row.level === 4" type="danger" size="small" disable-transitions>危险</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="匹配词汇">
        <template #default="scope">
          <el-space v-if="scope.row.related" v-for="word of scope.row.related" :key="word.word" wrap>
            <el-text>{{ word.word }}</el-text>
          </el-space>
          <el-space v-else>
            <el-text>{{ scope.row.main }}</el-text>
          </el-space>
        </template>
      </el-table-column>
    </el-table>
  </main>
</template>
<script setup lang="ts">
import {urlPrefix} from "~/store";
import {backend} from "~/backend";
import {onMounted, ref} from "vue";
import {Refresh} from "@element-plus/icons-vue";

onMounted(() => {
  refreshWords()
})

const url = (p: string) => urlPrefix + "/censor/" + p;

interface SensitiveRelatedWord {
  word: string
  reason: string
}

interface SensitiveWord {
  main: string
  level: number
  related: SensitiveRelatedWord[]
}

const words = ref<SensitiveWord[]>()

const refreshWords = async () => {
  const c: { result: false } | {
    result: true,
    data: SensitiveWord[]
  } = await backend.get(url("words"))
  if (c.result) {
    words.value = c.data
  }
}
</script>