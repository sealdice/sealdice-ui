<script setup lang="ts">
import type { StoreBackend } from '~/type';
import { SuccessFilled, WarningFilled } from '@element-plus/icons-vue';

const props = defineProps<StoreBackend>();
</script>

<template>
  <div
    class="elem w-full flex flex-col bg-white border rounded-md px-3 pt-2 pb-1.5 hover:shadow-md transition duration-500">
    <header class="flex flex-auto justify-between items-center gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <el-tag type="success" disable-transitions v-if="props.type === 'official'">官方</el-tag>
        <el-tag type="primary" disable-transition v-else-if="props.type === 'trusted'">信任</el-tag>
        <el-tag type="info" disable-transition v-else>社区</el-tag>

        {{ props.name }}

        <el-text class="ml-2">{{ props.url }}</el-text>
      </div>

      <div class="flex flex-none items-center gap-1">
        <el-text v-if="props.health" type="primary" size="small">
          <el-icon><SuccessFilled /></el-icon>
          健康
        </el-text>
        <el-text type="warning" size="small">
          <el-icon><WarningFilled /></el-icon>
          无法连接
        </el-text>
      </div>
    </header>

    <main v-if="props.announcement !== ''">
      {{ props.announcement }}
    </main>
  </div>
</template>

<style scoped lang="css"></style>
