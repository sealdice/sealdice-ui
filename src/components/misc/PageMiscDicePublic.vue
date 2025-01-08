<template>
  <div class="flex flex-wrap gap-4">
    <el-card shadow="always" style="width: 100%"
      ><template #header>
        <div style="height: 2rem; display: flex; justify-content: space-between">
          <span style="font-size: 1.5rem; font-weight: bold">公骰设置</span>
          <div>
            <el-switch
              v-model="config.publicDiceEnable"
              active-text="启用"
              inactive-text="关闭"
              @change="enableChange" />
            <el-button
              :icon="DocumentChecked"
              :disabled="!config.publicDiceEnable"
              type="primary"
              style="margin-left: 2rem"
              @click="doSave"
              >保存</el-button
            >
          </div>
        </div>
      </template>
      <el-container>
        <el-aside width="20%" style="align-content: center; border: 2px solid">
          <el-avatar
            shape="square"
            style="width: auto; height: auto; vertical-align: top"
            fit="contain"
            :src="imgSeal"></el-avatar>
        </el-aside>
        <el-main>
          <el-form
            style="
              justify-items: center;
              height: 100%;
              align-content: center;
              display: flex;
              flex-direction: column;
            ">
            <el-row :gutter="20" justify="center" style="width: 100%; height: auto">
              <el-col :span="12" :lg="12" :md="12" :sm="24" :xs="24"
                ><el-form-item label="公骰UID" style="width: 100%"
                  ><template #label
                    ><div>
                      <span>公骰 UID</span>
                      <el-tooltip content="公骰UID" placement="left">
                        <el-icon><question-filled /></el-icon>
                      </el-tooltip></div
                  ></template>
                  <el-input
                    show-password
                    v-model="config.publicDiceId"
                    :disabled="!config.publicDiceEnable"
                    placeholder="留空则会自动注册" /> </el-form-item
              ></el-col>
              <el-col :span="12" :lg="12" :md="12" :sm="24" :xs="24"
                ><el-form-item label="公骰昵称" style="width: 100%"
                  ><template #label
                    ><div>
                      <span>公骰昵称</span>
                      <el-tooltip content="公骰昵称" placement="left">
                        <el-icon><question-filled /></el-icon>
                      </el-tooltip></div
                  ></template>
                  <el-input
                    v-model="config.publicDiceName"
                    :disabled="!config.publicDiceEnable"
                    placeholder="请输入公骰昵称" /> </el-form-item
              ></el-col>
            </el-row>
            <el-row :gutter="20" justify="center" style="width: 100%; height: auto">
              <el-col :span="12" :lg="12" :md="12" :sm="24" :xs="24"
                ><el-form-item label="公骰头像" style="width: 100%"
                  ><template #label
                    ><div>
                      <span>公骰头像</span>
                      <el-tooltip content="公骰头像" placement="left">
                        <el-icon><question-filled /></el-icon>
                      </el-tooltip></div
                  ></template>
                  <el-input
                    v-model="config.publicDiceAvatar"
                    :disabled="!config.publicDiceEnable"
                    placeholder="请输入公骰头像Url" /> </el-form-item
              ></el-col>
              <el-col :span="12" :lg="12" :md="12" :sm="24" :xs="24"
                ><el-form-item label="骰主留言" style="width: 100%"
                  ><template #label
                    ><div>
                      <span>骰主留言</span>
                      <el-tooltip content="骰主留言" placement="left">
                        <el-icon><question-filled /></el-icon>
                      </el-tooltip></div
                  ></template>
                  <el-input
                    v-model="config.publicDiceNote"
                    :disabled="!config.publicDiceEnable"
                    placeholder="请输入你的留言" /> </el-form-item
              ></el-col>
            </el-row>
            <el-row :gutter="20" justify="center" style="width: 100%; flex: 1">
              <el-col :span="24" :lg="24" :md="24" :sm="24" :xs="24">
                <el-form-item label="公骰简介" style="width: 100%; height: 100%"
                  ><template #label
                    ><div>
                      <span>公骰简介</span>
                      <el-tooltip content="公骰简介" placement="left">
                        <el-icon><question-filled /></el-icon>
                      </el-tooltip></div
                  ></template>
                  <el-input
                    v-model="config.publicDiceBrief"
                    :disabled="!config.publicDiceEnable"
                    class="elinput"
                    placeholder="请输入简介"
                    type="textarea"
                    clearable /> </el-form-item
              ></el-col>
            </el-row>
          </el-form>
        </el-main>
      </el-container>
      <template #footer
        ><span style="font-size: 1.2rem; font-weight: bold">选择要上报的终端</span>
        <el-table
          ref="multipleTableRef"
          :data="tableData"
          row-key="id"
          :style="{
            width: '100%',
            marginTop: '1rem',
            pointerEvents: config.publicDiceEnable ? 'auto' : 'none',
          }"
          @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="100%" />
          <el-table-column property="userId" label="UserId" />
          <el-table-column property="platform" label="Platform" />
          <el-table-column property="adapter" label="Adapter" />
          <el-table-column property="state" label="State" />
        </el-table>
      </template>
    </el-card>
  </div>
</template>
<script lang="ts" setup>
import imgSeal from '~/assets/seal.png';
import { DocumentChecked, QuestionFilled } from '@element-plus/icons-vue';
import type { TableInstance } from 'element-plus';
import { getDicePublicInfo, setDicePublicInfo } from '~/api/public_dice';
const config = ref<any>({});
const multipleTableRef = ref<TableInstance>();
// let selectedRows: any[] = [];
const handleSelectionChange = (selection: any[]) => {
  console.log(selection);
  selected = selection;
};
const tableData = ref<any>([]);
let selected: any[] = [];
const enableChange = async (value: string | number | boolean) => {
  config.value.publicDiceEnable = value;
  await setDicePublicInfo(config.value, selected);
  refreshInfo();
};
const doSave = async () => {
  await setDicePublicInfo(config.value, selected);
  refreshInfo();
  ElMessage.success('已保存');
};

const refreshInfo = async () => {
  tableData.value = [];
  const infos = await getDicePublicInfo();
  config.value = infos.config;
  infos.endpoints.forEach(dc => {
    tableData.value.push({
      userId: dc.userId,
      platform: dc.platform,
      adapter: '-',
      state: dc.state,
      isPublic: dc.isPublic,
      id: dc.id,
    });
  });
  tableData.value.forEach((row: any) => {
    console.log('row  ', row.isPublic);
    multipleTableRef.value!.toggleRowSelection(row, row.isPublic);
  });
};

onBeforeMount(async () => {
  await refreshInfo();
});
</script>
<style scoped lang="css">
.el-col {
  justify-items: center;
}
.edit-tag {
  width: 100%;
  text-align: center;
  display: flex;
  padding-inline: 1.5rem;
  padding-block: 0.5rem;
}
.edit-text {
  width: 5.5rem;
  text-align: left;
  margin-right: 0.5rem;
}
.elinput {
  height: 100%;
}
.elinput ::v-deep .el-textarea__inner {
  height: 100%;
}
</style>
