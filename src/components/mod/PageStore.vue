<template>
  <el-tabs v-model="tab" stretch>
    <el-tab-pane
        v-for="{name, label} in [{name: 'deck', label: '牌堆'},{name: 'plugin', label: '插件'},  {name: 'reply', label: '自定义回复'}]"
        :label="label" :name="name">
      <el-divider/>
      <h4>全部{{ label }}</h4>
      <header>
        <el-form :inline="true">
          <el-form-item label="作者">
            <el-input clearable/>
          </el-form-item>
          <el-form-item :label="label + '名'">
            <el-input clearable/>
          </el-form-item>
          <el-form-item>
            <el-button type="primary">查询</el-button>
          </el-form-item>
        </el-form>
      </header>
      <main class="list-main">
        <el-skeleton :loading="loading" animated :rows="3" :count="5">
          <template #template>
            <div class="flex flex-col bg-white border rounded-md mb-8 px-3 pt-3 pb-1.5 gap-y-1">
              <div class="flex flex-row justify-between">
                <el-skeleton-item variant="p" class="w-1/3"/>
                <el-skeleton-item variant="p" class="w-1/5"/>
              </div>
              <div class="mt-2">
                <el-skeleton-item variant="text"/>
                <el-skeleton-item variant="text"/>
              </div>
              <div class="mt-1.5 pt-1 border-t">
                <el-skeleton-item variant="text"/>
              </div>
            </div>
          </template>
          <template #default>
            <store-elem v-if="name === 'deck'" v-for="deck in decks" v-bind="deck"/>
            <store-elem v-else-if="name === 'plugin'" v-for="plugin in plugins" v-bind="plugin"/>
            <store-elem v-else-if="name === 'reply'" v-for="reply in replies" v-bind="reply"/>
          </template>
        </el-skeleton>
      </main>
    </el-tab-pane>

    <el-tab-pane label="商店设置" name="setting">
    </el-tab-pane>
  </el-tabs>
</template>

<script lang="ts" setup>
import {useStore} from "~/store";
import type {StoreElem, StoreElemType} from "~/type";

const store = useStore()

const decks = ref<StoreElem[]>([])
const plugins = ref<StoreElem[]>([])
const replies = ref<StoreElem[]>([])

const query = ref<{
  pageNum: number;
  pageSize: number;
  total: number;
  author: string;
  name: string;
}>({
  pageNum: 1,
  pageSize: 10,
  total: 0,
  author: '',
  name: ''
})

const tab = ref<StoreElemType>("deck")
const loading = ref(true)

const refreshElems = async () => {
  loading.value = true
  const resp = await store.storePage({type: tab.value})
  if (resp?.result) {
    query.value.pageNum = resp.pageNum
    query.value.pageSize = resp.pageSize
    query.value.total = resp.total
    switch (tab.value) {
      case "deck":
        decks.value = resp.data
        break
      case "plugin":
        plugins.value = resp.data
        break
      case "reply":
        replies.value = resp.data
        break
    }
  } else {
    ElMessage.error('无法获取插件商店列表')
  }
  setTimeout(() => {
    loading.value = false
  }, 500)
}

watch(tab, async () => {
  await refreshElems()
})

onBeforeMount(async () => {
  await refreshElems()
})

</script>

<style>
.list-header {
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.list-main {
  margin: 1rem 0 2rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem
}

</style>