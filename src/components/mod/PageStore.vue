<template>
  <el-tabs v-model="tab" stretch>
    <el-tab-pane
        v-for="{name, label} in tabs"
        :label="label" :name="name"
        v-infinite-scroll="loadElems" :infinite-scroll-delay="500" :infinite-scroll-disabled="!query.next">

      <template v-if="recommendations.length > 0">
        <h4>推荐{{ label }}</h4>

        <el-skeleton class="w-full" :loading="recommendLoading" animated :count="5">
          <template #template>
            <el-skeleton-item variant="text" class="w-full"/>
          </template>

          <el-scrollbar noresize>
            <div class="flex flex-row overflow-x-auto gap-x-4">
              <store-recommendation class="flex-shrink-0 my-4 w-48 border-l pl-4 first:border-0 first:pl-0"
                                    v-for="r in recommendations" v-bind="r" :key="r.id"
                                    @downloaded="(id: string) => installed(id)"/>
            </div>
          </el-scrollbar>
        </el-skeleton>

        <el-divider/>
      </template>

      <h4>全部{{ label }}</h4>
      <header class="flex justify-between items-center">
        <el-form class="items-center" :inline="true">
          <el-form-item :label="label + '名'">
            <el-input v-model="query.name" clearable @change="resetElemData"/>
          </el-form-item>
          <el-form-item label="排序">
            <el-radio-group size="small" v-model="query.sortBy" @change="resetElemData">
              <el-radio-button value="downloadNum">按下载数</el-radio-button>
              <el-radio-button value="updateTime">按更新时间</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-radio-group size="small" v-model="query.order" @change="resetElemData">
              <el-radio-button value="asc">
                <el-icon>
                  <ArrowUp/>
                </el-icon>
              </el-radio-button>
              <el-radio-button value="desc">
                <el-icon>
                  <ArrowDown/>
                </el-icon>
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </header>
      <main class="list-main">
        <store-elem v-for="(d, i) in data" v-bind="{...d, index: i}"
                    @downloaded="(id: string) => installed(id)"/>
        <el-skeleton :loading="dataLoading" animated :rows="3" :count="5">
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
            <el-divider class="bottom-line">
              <el-text>没有了捏~</el-text>
            </el-divider>
          </template>
        </el-skeleton>
      </main>
    </el-tab-pane>
  </el-tabs>
</template>

<script lang="ts" setup>
import {useStore} from "~/store";
import type {StoreElem, StoreElemType} from "~/type";
import {ArrowDown, ArrowUp} from "@element-plus/icons-vue";
import {ElMessage} from "element-plus";
import {debounce} from "lodash-es";

const tabs = [
  {name: 'deck', label: '牌堆'},
  {name: 'plugin', label: '插件'},
  // {name: 'reply', label: '自定义回复'},
]

const store = useStore()

const recommendations = ref<StoreElem[]>([])
const data = ref<StoreElem[]>([])

const query = ref<{
  pageNum: number;
  pageSize: number;
  author: string;
  name: string;
  sortBy: 'downloadNum' | 'updateTime';
  order: 'asc' | 'desc';
  next: boolean
}>({
  pageNum: 1,
  pageSize: 5,
  author: '',
  name: '',
  sortBy: 'downloadNum',
  order: 'desc',
  next: true
})

const tab = ref<StoreElemType>("deck")
const recommendLoading = ref(true)
const dataLoading = ref(true)

const refreshRecommend = async () => {
  recommendations.value = []
  const resp = await store.storeRecommend({type: tab.value})
  if (resp?.result) {
    recommendLoading.value = true
    recommendations.value = resp.data
    setTimeout(() => {
      recommendLoading.value = false
    }, 500)
  }
}

const resetElemData = async () => {
  console.log('resetElemData')
  query.value.pageNum = 1
  query.value.pageSize = 5
  query.value.next = true
  data.value = []
  await loadElems()
}

const loadElems = debounce(async () => {
  if (!query.value.next) return
  dataLoading.value = true
  const resp = await store.storePage({
    type: tab.value,
    ...query.value,
    pageNum: query.value.pageNum
  })
  if (resp?.result) {
    data.value = data.value.concat(resp.data)
    query.value.pageNum++
    query.value.next = resp.next
  } else {
    ElMessage.error('无法获取插件商店列表')
  }
  setTimeout(() => {
    dataLoading.value = false
  }, 500)
}, 300)

const installed = async (id: string) => {
  for (let elem of data.value) {
    if (elem.id === id) {
      elem.installed = true
    }
  }
  for (let recommendation of recommendations.value) {
    if (recommendation.id === id) {
      recommendation.installed = true
    }
  }
}

watch(tab, async () => {
  query.value = {
    pageNum: 1,
    pageSize: 5,
    author: '',
    name: '',
    sortBy: 'downloadNum',
    order: 'desc',
    next: true
  }
  data.value = []
  await resetElemData()
  await refreshRecommend()
})

onBeforeMount(async () => {
  query.value.pageNum = 1
  query.value.pageSize = 5
  data.value = []
  await resetElemData()
  await refreshRecommend()
})

</script>

<style lang="scss">
.list-main {
  margin: 1rem 0 2rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.bottom-line {
  .el-divider__text {
    background-color: #f3f5f7;
  }
}
</style>