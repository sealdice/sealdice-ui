<script setup lang="ts">
import type { Resource } from '~/store';
import { Microphone, Picture, VideoCamera } from '@element-plus/icons-vue';
import { getResourceData } from '~/api/resource';

const url = ref<string>('');

const getImageUrl = async (path: string) => {
  const blob = await getResourceData(path, props.mini);
  return window.URL.createObjectURL(blob);
};

onMounted(async () => {
  url.value = await getImageUrl(props.data.path);
});

const props = withDefaults(
  defineProps<{
    data: Resource;
    mini?: boolean;
  }>(),
  {
    mini: false,
  },
);
</script>

<template>
  <template v-if="data.type === 'image'">
    <el-image :key="url" :alt="data.name" :src="url" fit="contain" loading="lazy">
      <template #placeholder>
        <div>
          <el-icon>
            <Picture />
          </el-icon>
        </div>
      </template>
      <template #error>
        <div>
          <el-icon>
            <Picture />
          </el-icon>
        </div>
      </template>
    </el-image>
  </template>
  <template v-else-if="data.type === 'audio'">
    <el-icon>
      <Microphone />
    </el-icon>
  </template>
  <template v-else-if="data.type === 'video'">
    <el-icon>
      <VideoCamera />
    </el-icon>
  </template>
  <template v-else>
    {{ '未知格式' }}
  </template>
</template>

<style scoped lang="css"></style>
