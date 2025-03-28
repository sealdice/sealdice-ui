<template>
  <header class="page-header">
    <el-button type="primary" :icon="Refresh" @click="doBackup">重载牌堆</el-button>
  </header>

  <el-tabs v-model="mode" :stretch="true">
    <el-tab-pane label="牌堆列表" name="list">
      <header class="deck-list-header">
        <el-space>
          <el-upload
            class="upload"
            action=""
            multiple
            :before-upload="beforeUpload"
            :file-list="fileList">
            <el-button type="primary" :icon="Upload">上传牌堆</el-button>
          </el-upload>
          <el-input v-model="filter" :prefix-icon="Search" size="small" clearable />
          <el-button
            class="link-button"
            type="info"
            :icon="Link"
            size="small"
            link
            tag="a"
            target="_blank"
            href="https://github.com/sealdice/draw"
            >获取牌堆</el-button
          >
        </el-space>
        <el-space>
          <el-text type="info" size="small">目前支持 json/yaml/deck/toml 格式的牌堆</el-text>
          <el-tooltip raw-content>
            <template #content>
              deck 牌堆：一种单文件带图的牌堆格式<br />
              在牌堆文件中使用./images/xxx.png 的相对路径引用图片。并连同图片目录一起打包成
              zip，修改扩展名为 deck 即可制作<br />
              <br />
              toml 牌堆：海豹支持的新牌堆格式。格式更加友好，还提供了包括云牌组在内的更多功能支持。
            </template>
            <el-icon size="small"><question-filled /></el-icon>
          </el-tooltip>
        </el-space>
      </header>
      <aside v-if="filterCount > 0" class="mb-4">
        <el-text size="small" type="info">已过滤 {{ filterCount }} 条</el-text>
      </aside>
      <main class="deck-list-main">
        <foldable-card
          v-for="(i, index) in filtered"
          :key="index"
          class="deck-item"
          :err-title="i.filename"
          :err-text="i.errText">
          <template #title>
            <el-space size="small" alignment="center">
              <el-text size="large" tag="b">{{ i.name }}</el-text>
              <el-text>{{ i.version }}</el-text>
              <el-tag
                size="small"
                :type="i.fileFormat === 'toml' ? 'success' : 'primary'"
                disable-transitions
                >{{ i.fileFormat }}</el-tag
              >
            </el-space>
          </template>

          <template #title-extra>
            <el-popconfirm
              v-if="i.updateUrls && i.updateUrls.length > 0"
              confirm-button-text="确认"
              cancel-button-text="取消"
              title="更新地址由牌堆作者提供，是否确认要检查该牌堆更新？"
              @confirm="doCheckUpdate(i)">
              <template #reference>
                <el-button :icon="Download" type="success" size="small" plain :loading="diffLoading"
                  >更新</el-button
                >
              </template>
            </el-popconfirm>
            <el-button :icon="Delete" type="danger" size="small" plain @click="doDelete(i)">
              删除
            </el-button>
          </template>

          <template #title-extra-error>
            <el-button :icon="Delete" type="danger" size="small" plain @click="doDelete(i)">
              删除
            </el-button>
          </template>

          <template #description>
            <el-space size="small" direction="vertical" alignment="normal">
              <el-text v-if="i.cloud" type="primary" size="small">
                <el-icon><MostlyCloudy /></el-icon>
                作者提供云端内容，请自行鉴别安全性
              </el-text>
              <el-text v-if="i.fileFormat === 'jsonc'" type="warning" size="small">
                <el-icon><Warning /></el-icon>
                注意：该牌堆的格式并非标准 JSON，而是允许尾逗号与注释语法的扩展 JSON
              </el-text>
            </el-space>
          </template>

          <el-descriptions style="white-space: pre-line">
            <el-descriptions-item :span="3" label="作者">{{
              i.author || '&lt;佚名>'
            }}</el-descriptions-item>
            <el-descriptions-item v-if="i.desc" :span="3" label="简介">{{
              i.desc
            }}</el-descriptions-item>
            <el-descriptions-item :span="3" label="牌组列表">
              <el-tag
                v-for="(visible, c) of i.command"
                :key="c"
                size="small"
                :type="visible ? 'primary' : 'info'"
                style="margin-right: 0.5rem"
                disable-transitions>
                {{ c }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="i.license" label="许可协议">{{
              i.license
            }}</el-descriptions-item>
            <el-descriptions-item v-if="i.date" label="发布时间">{{ i.date }}</el-descriptions-item>
            <el-descriptions-item v-if="i.updateDate" label="更新时间">{{
              i.updateDate
            }}</el-descriptions-item>
          </el-descriptions>

          <template #unfolded-extra>
            <el-descriptions>
              <el-descriptions-item :span="3" label="可见牌组列表">
                <el-tag
                  v-for="(visible, c) of i.command"
                  :key="c"
                  size="small"
                  :type="visible ? 'primary' : 'info'"
                  :style="{
                    marginRight: '0.5rem',
                    display: visible ? '' : 'none',
                  }"
                  disable-transitions>
                  {{ c }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </template>
        </foldable-card>
      </main>
    </el-tab-pane>

    <el-dialog v-model="showDiff" title="牌堆内容对比" class="diff-dialog">
      <diff-viewer :lang="deckCheck.format" :old="deckCheck.old" :new="deckCheck.new" />
      <template #footer>
        <el-space wrap>
          <el-button @click="showDiff = false">取消</el-button>
          <el-button
            v-if="!(deckCheck.old === deckCheck.new)"
            type="success"
            :icon="DocumentChecked"
            @click="deckUpdate">
            确认更新
          </el-button>
        </el-space>
      </template>
    </el-dialog>
  </el-tabs>
</template>

<script lang="ts" setup>
import {
  QuestionFilled,
  Upload,
  Download,
  Refresh,
  Search,
  Link,
  Delete,
  MostlyCloudy,
  DocumentChecked,
  Warning,
} from '@element-plus/icons-vue';
import { getBackupConfig } from '~/api/backup';
import {
  checkDeckUpdate,
  deleteDeck,
  getDeckList,
  reloadDeck,
  updateDeck,
  uploadDeck,
} from '~/api/deck';
import type { UploadRawFile } from 'element-plus/es/components/upload/src/upload.mjs';

const mode = ref<string>('list');

const filter = ref<string>('');
const filterCount = computed(() => data.value.length - filtered.value.length);
const data = ref<any[]>([]);
const filtered = computed(() =>
  data.value.filter(deck => {
    if (filter.value === '') {
      return true;
    }
    const val = filter.value.toLowerCase();
    return (
      deck.name?.toLowerCase()?.includes(val) ||
      deck.desc?.toLowerCase()?.includes(val) ||
      deck.author?.toLowerCase()?.includes(val) ||
      Object.keys(deck.command)
        .map(tag => tag?.toLowerCase()?.includes(val))
        .includes(true)
    );
  }),
);

const cfg = ref<any>({});

const refreshList = async () => {
  const lst = await getDeckList();
  data.value = lst;
};

const configGet = async () => {
  const data = await getBackupConfig();
  cfg.value = data;
};

const fileList = ref<any[]>([]);

const doBackup = async () => {
  const ret = await reloadDeck();
  if (ret.testMode) {
    ElMessage.success('展示模式无法重载牌堆');
  } else {
    ElMessage.success('已重载');
    await refreshList();
  }
};

const doDelete = async (data: any) => {
  ElMessageBox.confirm(`删除牌堆《${data.name}》，确定吗？`, '删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  }).then(async _data => {
    await deleteDeck(data.filename);
    await reloadDeck();
    await refreshList();
    ElMessage.success('牌堆已删除');
  });
};

// let lastSetEnable = 0;
// const setEnable = async (index: number, enable: boolean) => {
//   const now = new Date().getTime();
//   if (now - lastSetEnable < 100) return;
//   lastSetEnable = now;
//   const ret = await enableDeck(index, enable);
//   ElMessage.success('完成');
// };

// const doSave = async () => {
//   await setBackupConfig(cfg.value);
//   ElMessage.success('已保存');
// };

const beforeUpload = async (file: UploadRawFile) => {
  // UploadRawFile
  await uploadDeck(file);
  ElMessage.success('上传完成，即将自动重载牌堆');
  await reloadDeck();
  await refreshList();
};

onBeforeMount(async () => {
  await configGet();
  await refreshList();
});

const showDiff = ref<boolean>(false);
const diffLoading = ref<boolean>(false);

interface DeckCheckResult {
  old: string;
  new: string;
  format: 'json' | 'yaml' | 'toml';
  filename: string;
  tempFileName: string;
}

const deckCheck = ref<DeckCheckResult>({
  old: '',
  new: '',
  format: 'json',
  filename: '',
  tempFileName: '',
});

const doCheckUpdate = async (data: any) => {
  diffLoading.value = true;
  const checkResult = await checkDeckUpdate(data.filename);
  diffLoading.value = false;
  if (checkResult.result) {
    deckCheck.value = { ...checkResult, filename: data.filename };
    showDiff.value = true;
  } else {
    ElMessage.error('检查更新失败！' + checkResult.err);
  }
};

const deckUpdate = async () => {
  const res = await updateDeck(deckCheck.value.filename, deckCheck.value.tempFileName);
  if (res.result) {
    showDiff.value = false;
    ElMessage.success('更新成功，即将自动重载牌堆');
    await reloadDeck();
    await refreshList();
  } else {
    showDiff.value = false;
    ElMessage.error('更新失败！' + res.err);
  }
};
</script>

<style lang="css">
@media screen and (max-width: 700px) {
  .bak-item {
    flex-direction: column;

    & > span {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}

@media screen and (max-width: 700px) {
  .diff-dialog {
    width: 90% !important;
  }
}

@media screen and (min-width: 700px) and (max-width: 900px) {
  .diff-dialog {
    width: 80% !important;
  }
}

@media screen and (min-width: 900px) and (max-width: 1100px) {
  .diff-dialog {
    width: 65% !important;
  }
}

@media screen and (min-width: 1100px) {
  .diff-dialog {
    width: 50% !important;
  }
}

.deck-keys {
  display: flex;
  flex-flow: wrap;

  & > span {
    margin-right: 1rem;
    /* width: fit-content; */
  }
}

.deck-control {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
}

.deck-list-header {
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
}

.deck-list-main {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.deck-item-header {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
}

.deck-item {
  width: 100%;
}

.edit-operation {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
}

.upload {
  > ul {
    display: none;
  }
}

.link-button {
  text-decoration: none;
}
</style>
