<script setup lang="ts">
import type { StoreBackend } from '~/type';
import { useStore } from '~/store';
import { Link, Plus } from '@element-plus/icons-vue';
import { breakpointsTailwind } from '@vueuse/core';
import { storeAddBackend, storeBackendList, storeRemoveBackend } from '~/api/store';

const store = useStore();

const model = defineModel<boolean>();
const newBackendUrl = ref('');

const breakpoints = useBreakpoints(breakpointsTailwind);
const lgAndLarger = breakpoints.greaterOrEqual('lg');

const backends = ref<StoreBackend[]>([]);
const backendLoading = ref(true);

const refreshBackends = async () => {
  backendLoading.value = true;
  const resp = await storeBackendList();
  if (resp?.result) {
    backends.value = resp.data;
  }
  setTimeout(() => {
    backendLoading.value = false;
  }, 500);
};

const addBackend = async () => {
  const resp = await storeAddBackend(store.token, newBackendUrl.value);
  if (resp?.result) {
    await refreshBackends();
    newBackendUrl.value = '';
  }
};

const removeBackend = async (id: string) => {
  const resp = await storeRemoveBackend(store.token, id);
  if (resp?.result) {
    await refreshBackends();
  }
};

onBeforeMount(async () => {
  await refreshBackends();
});

watch(model, val => {
  if (val) {
    refreshBackends();
  }
});
</script>

<template>
  <el-drawer
    v-model="model"
    :with-header="false"
    :show-close="false"
    :direction="lgAndLarger ? 'rtl' : 'btt'"
    :size="lgAndLarger ? '40%' : '50%'">
    <h4 class="title-sub">扩展仓库</h4>

    <main class="flex flex-col gap-2">
      <el-skeleton
        :loading="backendLoading"
        animated
        :rows="3"
        :count="3"
        class="flex flex-col gap-2">
        <template #template>
          <div class="flex flex-col bg-white border rounded-md px-3 pt-2 pb-1.5 gap-y-1">
            <el-skeleton-item variant="text" />
            <el-skeleton-item variant="text" />
          </div>
        </template>
        <template #default>
          <div :key="b.id" v-for="b in backends">
            <store-backend v-bind="b" :simple="false" @remove="removeBackend"></store-backend>
          </div>
        </template>
      </el-skeleton>

      <div class="w-full flex justify-between bg-white px-3 pt-4 pb-1.5 gap-2">
        <el-input v-model="newBackendUrl" clearable>
          <template #prepend>
            <el-icon>
              <Link />
            </el-icon>
          </template>
        </el-input>
        <el-button type="primary" :icon="Plus" @click="addBackend">新增</el-button>
      </div>
    </main>
  </el-drawer>
</template>

<style scoped lang="css"></style>
