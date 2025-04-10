<script lang="ts" setup>
import { Back, Delete, Select, Upload } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import randomColor from 'randomcolor';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../../tailwind.config';
import { getStoryInfo, getStoryLogPage, getStoryItemPage, deleteStoryLog } from '~/api/story';
import { postStoryLog } from '~/api/story';
const twColors = resolveConfig(tailwindConfig).theme.colors;

interface Log {
  id: number;
  name: string;
  groupId: string;
  createdAt: number;
  updatedAt: number;
  size: number;
  pitch?: boolean;
  current?: number;
}

interface Item {
  id: number;
  logId: number;
  nickname: string;
  IMUserId: string;
  time: number;
  message: string;
  isDice: boolean;
  isEdit?: boolean;
}

async function getInfo() {
  return getStoryInfo();
  //   return backend.get(url("info")) as any
}

// async function getLogs() {
//     return apiFetch(url("logs"), {
//         method: "get", headers: { token: token }
//     })
// }

const queryLogPage = ref({
  pageNum: 1,
  pageSize: 20,
  total: 0,
  name: '',
  groupId: '',
  createdTime: [undefined, undefined] as unknown as [Date, Date],
});

const getLogPage = getStoryLogPage;
// async function getLogPage(params: { pageNum: number, pageSize: number, name?: string, groupId?: string, createdTimeBegin?: number, createdTimeEnd?: number }) {
//     return await backend.get(url("logs/page"), {
//       headers: {token: token}, params: params
//     }) as any
// }

// async function getItems(v: Log) {
//     // ofetch get+params 至少在开发模式有莫名奇妙的 bug ，会丢失 baseURL
//     // 下面的接口就先不更换了
//     return await backend.get(url('items'), { params: v, headers: { token } }) as unknown as Item[]
// }

const logItemPage = ref({
  pageNum: 1,
  pageSize: 100,
  size: 0,
  logName: '',
  groupId: '',
});

// async function getItemPage(params: { pageNum: number, pageSize: number, logName: string, groupId: string }) {
//     return backend.get(url("items/page"), {
//         headers: { token: token }, params: params
//     })
// }
const getItemPage = getStoryItemPage;

async function delLog(v: Log) {
  return deleteStoryLog(v);
  // return backend.delete(url('log'), { headers: { token }, data: v }) as unknown as boolean
}

async function uploadLog(v: Log) {
  await ElMessageBox.confirm('将此跑团日志上传至海豹服务器？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  });
  return postStoryLog(v);
  // return backend.post(url("uploadLog"), v,{ headers: { token }}) as any
}

//

const tab: Ref<'list' | 'backup'> = ref('list');
const mode: Ref<'logs' | 'items'> = ref('logs');
const sum_log = ref(0),
  sum_item = ref(0),
  cur_log = ref(0),
  cur_item = ref(0);
dayjs.extend(relativeTime);

const logs: Ref<Log[]> = ref([]);

async function searchLogs() {
  const params = {
    ...queryLogPage.value,
    createdTimeBegin: queryLogPage.value.createdTime?.[0]
      ? dayjs(queryLogPage.value.createdTime?.[0]).startOf('date').unix()
      : undefined,
    createdTimeEnd: queryLogPage.value.createdTime?.[1]
      ? dayjs(queryLogPage.value.createdTime?.[1]).endOf('date').unix()
      : undefined,
  };
  const result:
    | { result: false; err?: string }
    | {
        result: true;
        total: number;
        data: Log[];
        pageNum: number;
        pageSize: number;
      } = await getLogPage(params);
  if (result.result) {
    logs.value = result.data;
    queryLogPage.value.total = result.total;
  } else {
    ElMessage.error('无法获取跑团日志' + result.err);
  }
}

const refreshLogs = async () => {
  [sum_log.value, sum_item.value, cur_log.value, cur_item.value] = await getInfo();
  await searchLogs();
};

const handleLogPageChange = async (val: number) => {
  queryLogPage.value.pageNum = val;
  await searchLogs();
};

const handlePageSizeChange = async (val: number) => {
  queryLogPage.value.pageNum = 1;
  queryLogPage.value.pageSize = val;
  await searchLogs();
};

async function DelLog(v: Log, flag = true) {
  await ElMessageBox.confirm('是否删除此跑团日志？', '删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    const info = await delLog(v);
    if (info) {
      ElMessage({
        message: '删除成功',
        type: 'success',
      });
      if (flag) await refreshLogs();
    } else {
      ElMessage({
        message: '删除失败',
        type: 'error',
      });
    }
  });
}

async function DelLogs() {
  await ElMessageBox.confirm('是否删除所选跑团日志？', '删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    const ls = [];
    for (const v of logs.value) {
      if (v.pitch == true) {
        ls.push(v);
      }
    }
    for (const v of ls) {
      const info = await delLog(v);
      if (info === true) {
        ElMessage({
          message: '删除成功',
          type: 'success',
        });
      } else {
        ElMessage({
          message: '删除失败',
          type: 'error',
        });
      }
    }
    await refreshLogs();
  });
}

async function UploadLog(v: Log) {
  const info = (await uploadLog(v)) as string;
  ElMessage({
    showClose: true,
    dangerouslyUseHTMLString: true,
    message: info,
    duration: 0,
  });
  return info;
}
//

const item_data: Ref<Item[]> = ref([]);

const users = ref({}) as Ref<Record<string, Array<string>>>;

async function openItem(log: Log) {
  logItemPage.value.logName = log.name;
  logItemPage.value.groupId = log.groupId;
  logItemPage.value.size = log.size;
  logItemPage.value.pageNum = 1;
  item_data.value = (await getItemPage({
    pageNum: logItemPage.value.pageNum,
    pageSize: logItemPage.value.pageSize,
    logName: logItemPage.value.logName,
    groupId: logItemPage.value.groupId,
  })) as unknown as Item[];
  mode.value = 'items';
}

const handleItemPageChange = async (val: number) => {
  logItemPage.value.pageNum = val;
  item_data.value = (await getItemPage(logItemPage.value)) as unknown as Item[];
};

function closeItem() {
  item_data.value = [];
  mode.value = 'logs';
  users.value = {};
}

const randomColorWithIndex = (i: number): string => {
  const presets = [
    twColors.red[600],
    twColors.orange[600],
    twColors.yellow[600],
    twColors.green[600],
    twColors.cyan[600],
    twColors.blue[600],
    twColors.purple[600],
    twColors.pink[600],
    twColors.slate[600],
  ];
  const randomColorSystems = [
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
    'pink',
    'monochrome',
  ];
  if (i < presets.length) {
    return presets[i];
  } else {
    return randomColor({
      hue: randomColorSystems[i % randomColorSystems.length],
      luminosity: 'dark',
    });
  }
};

const items = computed(() => {
  const items: Item[] = [];
  item_data.value.forEach((v, i) => {
    if (!users.value[v.IMUserId]) {
      users.value[v.IMUserId] = [randomColorWithIndex(i), v.nickname];
    }
    items.push(v);
  });
  return items;
});

//

onBeforeMount(async () => {
  await refreshLogs();
});
</script>

<template>
  <!--    <header style="margin-bottom: 1rem;">-->
  <!--        &lt;!&ndash; <ElButton type="primary" :icon="Refresh" @click="getLogs(); getInfo()">刷新日志列表</ElButton> &ndash;&gt;-->
  <!--    </header>-->
  <el-tabs v-model="tab" stretch>
    <el-tab-pane label="跑团日志" name="list">
      <template v-if="mode == 'logs'">
        <header>
          <ElCard>
            <template #header>
              <strong style="display: block; margin: 10px 0">跑团日志 / Story</strong>
            </template>
            <el-space direction="vertical" alignment="flex-start">
              <el-text size="large" style="margin-right: 1rem"
                >记录过 {{ sum_log }} 份日志，共计 {{ sum_item }} 条消息</el-text
              >
              <el-text size="large" style="margin-right: 1rem"
                >现有 {{ cur_log }} 份日志，共计 {{ cur_item }} 条消息</el-text
              >
            </el-space>
          </ElCard>
        </header>
        <ElDivider></ElDivider>
        <main>
          <el-form :inline="true" :model="queryLogPage">
            <el-form-item label="日志名">
              <el-input v-model="queryLogPage.name" clearable />
            </el-form-item>
            <el-form-item label="群号">
              <el-input v-model="queryLogPage.groupId" clearable />
            </el-form-item>
            <el-form-item label="创建时间">
              <el-date-picker
                v-model="queryLogPage.createdTime"
                type="daterange"
                range-separator="-" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="searchLogs">查询</el-button>
            </el-form-item>
          </el-form>
          <ElButtonGroup style="margin-top: 5px; display: block">
            <ElButton
              type="primary"
              size="small"
              :icon="Select"
              @click="logs.forEach(v => (v.pitch = !v.pitch))"
              >全选
            </ElButton>
            <ElButton
              v-show="logs.filter(v => v.pitch).length > 0"
              type="danger"
              size="small"
              :icon="Delete"
              @click="DelLogs()"
              >删除所选</ElButton
            >
          </ElButtonGroup>
          <template v-for="i in logs" :key="i.id">
            <foldable-card style="margin-top: 10px">
              <template #title>
                <el-space>
                  <ElCheckbox v-model="i.pitch" style="float: right" />
                  <el-space wrap>
                    <el-text size="large" tag="strong">{{ i.name }}</el-text>
                    <el-text>({{ i.groupId }})</el-text>
                  </el-space>
                </el-space>
              </template>
              <template #action>
                <ElButton size="small" plain @click="openItem(i)">查看</ElButton>
                <!--<ElButton>下载到本地</ElButton>-->
                <ElButton size="small" type="primary" :icon="Upload" plain @click="UploadLog(i)"
                  >提取日志
                </ElButton>
                <ElButton size="small" type="danger" :icon="Delete" plain @click="DelLog(i)"
                  >删除
                </ElButton>
              </template>

              <el-space direction="vertical" alignment="flex-start">
                <el-space>
                  <el-text>包含 {{ i.size }} 条消息</el-text>
                </el-space>
                <el-space>
                  <el-text>创建于：{{ dayjs.unix(i.createdAt).format('YYYY-MM-DD') }}</el-text>
                  <ElTag size="small" disable-transitions>{{
                    dayjs.unix(i.createdAt).fromNow()
                  }}</ElTag
                  ><br />
                </el-space>
                <el-space>
                  <el-text>更新于：{{ dayjs.unix(i.updatedAt).format('YYYY-MM-DD') }}</el-text>
                  <ElTag size="small" disable-transitions>{{
                    dayjs.unix(i.updatedAt).fromNow()
                  }}</ElTag
                  ><br />
                </el-space>
              </el-space>
            </foldable-card>
          </template>
        </main>
        <div style="display: flex; justify-content: center">
          <el-pagination
            class="pagination"
            :page-size="queryLogPage.pageSize"
            :current-page="queryLogPage.pageNum"
            :pager-count="3"
            :total="queryLogPage.total"
            layout="sizes, prev, pager, next"
            background
            @current-change="handleLogPageChange"
            @size-change="handlePageSizeChange" />
        </div>
      </template>
      <template v-if="mode == 'items'">
        <ElCard shadow="never">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <strong style="margin: 10px 0">跑团日志 / Story</strong>
              <ElButton type="primary" :icon="Back" @click="closeItem()">返回列表</ElButton>
            </div>
          </template>
          <ElCollapse>
            <ElCollapseItem title="颜色设置">
              <template v-for="(_, id) in users" :key="id">
                <div style="padding: 0.5rem">
                  <el-color-picker
                    v-model="users[id][0]"
                    color-format="hex"
                    :predefine="randomColor({ count: 10 })" />
                  <span style="padding-left: 1rem">{{ users[id][1] }}</span>
                </div>
              </template>
            </ElCollapseItem>
          </ElCollapse>
        </ElCard>
        <div class="my-4 px-4">
          <template v-for="(v, i1) in items" :key="i1">
            <p :style="{ color: users[v.IMUserId][0] }">
              <span>{{ v.nickname }}：</span>
              <template v-for="(p1, i2) in v.message.split('\n')" :key="i2">
                <span>{{ p1 }}</span
                ><br />
              </template>
            </p>
          </template>
        </div>
        <div style="display: flex; justify-content: center">
          <el-pagination
            class="pagination"
            :page-size="logItemPage.pageSize"
            :current-page="logItemPage.pageNum"
            :pager-count="5"
            :total="logItemPage.size"
            layout="prev, pager, next"
            background
            hide-on-single-page
            @current-change="handleItemPageChange" />
        </div>
      </template>
    </el-tab-pane>
    <el-tab-pane label="日志备份" name="backup">
      <story-backup />
    </el-tab-pane>
  </el-tabs>
</template>

<style scoped lang="css">
.pagination {
  margin-top: 10px;
  background-color: #f3f5f7;
}
</style>
