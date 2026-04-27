<template>
  <el-drawer v-model="visible" title="商店包详情" direction="rtl" :size="size">
    <div class="drawer-body">
      <template v-if="data">
        <section class="drawer-section">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="名称">{{ data.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="包 ID">{{ data.id || '-' }}</el-descriptions-item>
            <el-descriptions-item label="版本">{{ data.version || '-' }}</el-descriptions-item>
            <el-descriptions-item label="作者">{{ joinList(data.authors) }}</el-descriptions-item>
            <el-descriptions-item label="许可证">{{ data.license || '-' }}</el-descriptions-item>
            <el-descriptions-item label="主页">{{ data.homepage || '-' }}</el-descriptions-item>
            <el-descriptions-item label="仓库">{{ data.repository || '-' }}</el-descriptions-item>
            <el-descriptions-item label="描述">
              <span class="break-text">{{ data.description || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="兼容版本">
              {{ data.seal?.minVersion || '-' }} ~ {{ data.seal?.maxVersion || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="drawer-section">
          <header class="section-title">依赖</header>
          <el-descriptions v-if="dependencyEntries.length > 0" :column="1" border>
            <el-descriptions-item
              v-for="item in dependencyEntries"
              :key="item.key"
              :label="item.key">
              {{ item.value }}
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂无依赖" :image-size="88" />
        </section>

        <section class="drawer-section">
          <header class="section-title">商店资源</header>
          <el-descriptions v-if="storeAssetEntries.length > 0" :column="1" border>
            <el-descriptions-item
              v-for="item in storeAssetEntries"
              :key="item.key"
              :label="item.key">
              <span class="break-text">{{ item.value }}</span>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂无商店资源" :image-size="88" />
        </section>

        <section class="drawer-section">
          <header class="section-title">下载信息</header>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="下载地址">
              <span class="break-text">{{ data.download?.url || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="发布时间">{{
              formatTime(data.download?.releaseTime)
            }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{
              formatTime(data.download?.updateTime)
            }}</el-descriptions-item>
            <el-descriptions-item label="下载量">{{
              data.download?.downloadCount ?? '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="Hash">
              <pre class="json-block">{{ prettyJson(data.download?.hash ?? {}) }}</pre>
            </el-descriptions-item>
          </el-descriptions>
        </section>
      </template>
      <el-empty v-else description="请选择商店包" :image-size="96" />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import type { StorePackage } from '~/api/store';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    size?: string;
    data: StorePackage | null;
  }>(),
  {
    size: '52%',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
});

const dependencyEntries = computed(() =>
  Object.entries(props.data?.dependencies ?? {}).map(([key, value]) => ({ key, value })),
);

const storeAssetEntries = computed(() => {
  const assets = props.data?.storeAssets ?? {};
  return Object.entries(assets).flatMap(([key, value]) => {
    if (value === undefined || value === null) {
      return [];
    }
    if (Array.isArray(value)) {
      return [{ key, value: value.length > 0 ? value.join('、') : '-' }];
    }
    return [{ key, value: String(value) }];
  });
});

const joinList = (value?: string[]) => {
  if (!value || value.length === 0) {
    return '-';
  }
  return value.join('、');
};

const normalizeTimestamp = (value?: number) => {
  if (!value) {
    return null;
  }
  return value > 9999999999 ? value : value * 1000;
};

const formatTime = (value?: number) => {
  const normalized = normalizeTimestamp(value);
  if (!normalized) {
    return '-';
  }
  return dayjs(normalized).format('YYYY-MM-DD HH:mm:ss');
};

const prettyJson = (value: unknown) => {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return String(value);
  }
};
</script>

<style scoped lang="css">
.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.drawer-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.break-text {
  white-space: pre-wrap;
  word-break: break-all;
}

.json-block {
  margin: 0;
  padding: 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
  background: var(--el-fill-color-light);
  border-radius: 0.5rem;
  font-size: 0.85rem;
  line-height: 1.5;
}
</style>
