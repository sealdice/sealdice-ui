<template>
  <el-drawer v-model="visible" title="扩展包详情" direction="rtl" :size="size">
    <div v-loading="loading" class="drawer-body">
      <template v-if="data">
        <section class="drawer-section">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="名称">{{ packageMeta.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="包 ID">{{ packageMeta.id || '-' }}</el-descriptions-item>
            <el-descriptions-item label="版本">{{
              packageMeta.version || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="stateTagType">{{ stateLabel }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="作者">{{
              joinList(packageMeta.authors)
            }}</el-descriptions-item>
            <el-descriptions-item label="许可证">{{
              packageMeta.license || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="主页">{{
              packageMeta.homepage || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="仓库">{{
              packageMeta.repository || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="兼容版本">
              {{ packageMeta.seal?.minVersion || '-' }} ~ {{ packageMeta.seal?.maxVersion || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="描述">
              <span class="break-text">{{ packageMeta.description || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="安装时间">{{
              data.installTime || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="安装路径">
              <span class="break-text">{{ data.installPath || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="来源路径">
              <span class="break-text">{{ data.sourcePath || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="来源状态">
              <el-space wrap>
                <el-tag :type="sourceStatusTagType">{{ sourceStatusLabel }}</el-tag>
                <span v-if="sourceWarning" class="source-warning">{{ sourceWarning }}</span>
              </el-space>
            </el-descriptions-item>
            <el-descriptions-item label="用户数据目录">
              <span class="break-text">{{ data.userDataPath || '-' }}</span>
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
          <header class="section-title">权限</header>
          <el-descriptions v-if="permissionEntries.length > 0" :column="1" border>
            <el-descriptions-item
              v-for="item in permissionEntries"
              :key="item.key"
              :label="item.key">
              <span class="break-text">{{ item.value }}</span>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂无权限声明" :image-size="88" />
        </section>

        <section class="drawer-section">
          <header class="section-title">商店资源</header>
          <el-descriptions v-if="storeEntries.length > 0" :column="1" border>
            <el-descriptions-item v-for="item in storeEntries" :key="item.key" :label="item.key">
              <span class="break-text">{{ item.value }}</span>
            </el-descriptions-item>
          </el-descriptions>
          <el-empty v-else description="暂无商店资源" :image-size="88" />
        </section>

        <section class="drawer-section">
          <header class="section-title">当前配置</header>
          <pre class="json-block">{{ prettyJson(configData) }}</pre>
        </section>

        <section class="drawer-section">
          <header class="section-title">配置 Schema</header>
          <pre class="json-block">{{ prettyJson(configSchema) }}</pre>
        </section>

        <section v-if="canEditConfig" class="drawer-section">
          <header class="section-title">编辑配置</header>
          <el-input
            v-model="editableConfig"
            type="textarea"
            :rows="14"
            resize="vertical"
            placeholder="请输入 JSON 配置" />
          <div class="drawer-actions">
            <el-button type="primary" :loading="saving" @click="handleSaveConfig"
              >保存配置</el-button
            >
          </div>
        </section>
      </template>
      <el-empty v-else description="请选择扩展包" :image-size="96" />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import type { PackageInstance } from '~/api/package';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    size?: string;
    loading?: boolean;
    saving?: boolean;
    data: PackageInstance | null;
    configData?: Record<string, any> | null;
    configSchema?: Record<string, any> | null;
  }>(),
  {
    size: '52%',
    loading: false,
    saving: false,
    configData: null,
    configSchema: null,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'save-config': [value: Record<string, any>];
}>();

const prettyJson = (value: unknown) => {
  if (value === undefined || value === null) {
    return '{}';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const joinList = (value?: string[]) => {
  if (!value || value.length === 0) {
    return '-';
  }
  return value.join('、');
};

const isEmptyValue = (value: unknown) => {
  if (value === undefined || value === null) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length === 0;
  }
  return false;
};

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
});

const editableConfig = ref('{}');

const packageMeta = computed(
  () => props.data?.manifest.package ?? { id: '', name: '', version: '' },
);

const stateLabel = computed(() => {
  switch (props.data?.state) {
    case 'enabled':
      return '已启用';
    case 'disabled':
      return '已禁用';
    case 'installed':
      return '已安装';
    case 'error':
      return '异常';
    default:
      return '-';
  }
});

const stateTagType = computed(() => {
  switch (props.data?.state) {
    case 'enabled':
      return 'success';
    case 'disabled':
      return 'info';
    case 'installed':
      return 'warning';
    case 'error':
      return 'danger';
    default:
      return 'info';
  }
});

const sourceStatusLabel = computed(() => {
  switch (props.data?.sourceStatus) {
    case 'cache_only':
      return '仅缓存安装';
    case 'present':
    case undefined:
      return '源文件存在';
    default:
      return props.data?.sourceStatus;
  }
});

const sourceStatusTagType = computed(() =>
  props.data?.sourceStatus === 'cache_only' ? 'warning' : 'success',
);

const sourceWarning = computed(() =>
  props.data?.sourceStatus === 'cache_only'
    ? props.data.sourceWarning ||
      '源 .sealpack 文件缺失，当前仅保留缓存安装。请将 sealpack 放回 data/packages 后刷新。'
    : '',
);

const dependencyEntries = computed(() =>
  Object.entries(props.data?.manifest.dependencies ?? {}).map(([key, value]) => ({ key, value })),
);

const permissionEntries = computed(() => {
  const permissions = props.data?.manifest.permissions ?? {};
  return Object.entries(permissions).flatMap(([key, value]) => {
    if (value === undefined || value === null) {
      return [];
    }
    if (Array.isArray(value)) {
      return [{ key, value: value.length > 0 ? value.join('、') : '-' }];
    }
    if (typeof value === 'boolean') {
      return [{ key, value: value ? '是' : '否' }];
    }
    if (typeof value === 'object') {
      return [{ key, value: JSON.stringify(value, null, 2) }];
    }
    return [{ key, value: String(value) }];
  });
});

const storeEntries = computed(() => {
  const store = props.data?.manifest.store ?? {};
  return Object.entries(store).flatMap(([key, value]) => {
    if (value === undefined || value === null) {
      return [];
    }
    if (Array.isArray(value)) {
      return [{ key, value: value.length > 0 ? value.join('、') : '-' }];
    }
    return [{ key, value: String(value) }];
  });
});

const canEditConfig = computed(() => !isEmptyValue(props.configSchema));

watch(
  () => props.configData,
  value => {
    editableConfig.value = prettyJson(value);
  },
  { immediate: true, deep: true },
);

const handleSaveConfig = () => {
  try {
    const parsed = JSON.parse(editableConfig.value || '{}') as Record<string, any>;
    emit('save-config', parsed);
  } catch {
    ElMessage.error('配置 JSON 格式有误，请先修正后再保存');
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

.source-warning {
  color: #c2410c;
  font-size: 0.85rem;
  line-height: 1.5;
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

.drawer-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
