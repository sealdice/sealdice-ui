<template>
  <div class="tip">
    <el-collapse class="filetips">
      <el-collapse-item name="txt-template">
        <template #title>
          <el-text tag="strong">敏感词库模板</el-text>
        </template>
        <el-text tag="p">
          <strong>敏感词库为 .txt 文件，内容示例如下：</strong><br/>
          <br/>
          #notice<br/>
          提醒级词汇1<br/>
          提醒级词汇2<br/>
          #caution<br/>
          注意级词汇1<br/>
          注意级词汇2<br/>
          #warning<br/>
          警告级词汇<br/>
          #danger<br/>
          危险级词汇<br/>
          <br/>
          <em>其中每一行代表一个词汇。</em>
        </el-text>
      </el-collapse-item>
    </el-collapse>
  </div>
  <header>
    <el-upload action="" multiple accept="application/text,.text,application/toml,.toml"
               :before-upload="beforeUpload">
      <el-button type="primary" :icon="Upload">导入</el-button>
    </el-upload>
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
          <el-button size="small" type="danger" :icon="Delete" plain @click="deleteFile(scope.row.key)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </main>
</template>

<script setup lang="ts">
import {Delete, Upload} from "@element-plus/icons-vue";
import {urlPrefix, useStore} from "~/store";
import {backend} from "~/backend";
import {onBeforeMount, ref} from "vue";
import {useCensorStore} from "~/components/mod/censor/censor";
import {ElMessage, ElMessageBox, UploadUserFile} from "element-plus";

onBeforeMount(() => {
  refreshFiles()
})

const store = useStore()
const url = (p: string) => urlPrefix + "/censor/" + p;
const token = store.token
const censorStore = useCensorStore()

interface SensitiveWordFile {
  key: string
  path: string,
  counter: number[]
}

const files = ref<SensitiveWordFile[]>()

censorStore.$subscribe(async (_, state) => {
  if (state.filesNeedRefresh === true) {
    await refreshFiles()
    state.filesNeedRefresh = false
  }
})

const refreshFiles = async () => {
  const c: { result: false } | {
    result: true,
    data: SensitiveWordFile[]
  } = await backend.get(url("files"), {headers: {token}})
  if (c.result) {
    files.value = c.data
  }
}

const beforeUpload = async (file: UploadUserFile) => {
  let fd = new FormData()
  fd.append('file', file as Blob)

  const c = await censorStore.fileUpload({form: fd})
  if (c.result) {
    await refreshFiles()
    ElMessage.success('上传完成，请在全部操作完成后，手动重载拦截')
    censorStore.markReload()
  } else {
    ElMessage.error('上传失败！' + c.err)
  }
}

const deleteFile = async (key: string) => {
  await ElMessageBox.confirm(
      '是否删除此词库？',
      '删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
  ).then(async () => {
    const c: { result: true } | { result: false, err: string }
        = await backend.delete(url("files"), {
      headers: {token},
      data: {keys: [key]}
    })
    if (c.result) {
      ElMessage.success('删除词库完成，请在全部操作完成后，手动重载拦截')
      censorStore.markReload()
    } else {
      ElMessage.error('删除词库失败！' + c.err)
    }
  })
}

</script>

<style scoped>
.filetips {
  background-color: #f3f5f7;
}

.filetips :deep().el-collapse-item__header {
  background-color: #f3f5f7;
}

.filetips :deep().el-collapse-item__wrap {
  background-color: #f3f5f7;
}
</style>