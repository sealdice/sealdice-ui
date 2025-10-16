<script setup lang="ts">
import type { StoreBackendType } from '~/type';

const props = defineProps<{
  type: StoreBackendType;
}>();
</script>

<template>
  <el-tag type="success" disable-transitions v-if="props.type === 'official'">官方</el-tag>
  <el-tag type="primary" disable-transitions v-else-if="props.type === 'trusted'"> 信任 </el-tag>
  <el-tag type="info" disable-transitions v-else>社区</el-tag>
</template>

<style scoped lang="css"></style>
