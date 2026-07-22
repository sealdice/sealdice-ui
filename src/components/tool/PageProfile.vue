<script setup lang="ts">
import { urlBase } from '~/backend';
import { useStore } from '~/store';
import { Download, View } from '@element-plus/icons-vue';

const store = useStore();

// 各端点的基地址
const PPROF_BASE = `${urlBase}/sd-api/debug/pprof`;

// 通用：带 token 的下载链接
const authQuery = () => `token=${encodeURIComponent(store.token)}`;

// profile / trace 时长
const profileSeconds = ref(30);
const traceSeconds = ref(5);

// 文本预览（drawer）
const previewVisible = ref(false);
const previewTitle = ref('');
const previewContent = ref('');
const previewLoading = ref(false);

// 防止重复触发：记录正在进行中的请求 key
// 下载与查看文本共用同一 key，避免同一 profile 并发请求堆积
const pendingKeys = reactive(new Set<string>());
const isPending = (key: string) => pendingKeys.has(key);
const markPending = (key: string) => {
  pendingKeys.add(key);
};
const clearPending = (key: string) => {
  pendingKeys.delete(key);
};

// 触发下载：通过临时 a 标签，避免在某些浏览器中直接打开二进制
const triggerDownload = (path: string, filename: string) => {
  const a = document.createElement('a');
  a.href = `${PPROF_BASE}${path}&${authQuery()}`;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// 获取文本格式的 profile 内容并展示
const showTextProfile = async (key: string, path: string, title: string) => {
  previewTitle.value = title;
  previewContent.value = '';
  previewLoading.value = true;
  previewVisible.value = true;
  markPending(key);
  try {
    const resp = await fetch(`${PPROF_BASE}${path}&debug=1&${authQuery()}`);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    previewContent.value = await resp.text();
  } catch (e: any) {
    previewContent.value = `加载失败：${e?.toString?.() ?? e}`;
  } finally {
    previewLoading.value = false;
    clearPending(key);
  }
};

// 列表：每条 profile 的描述与下载文件名
interface ProfileEntry {
  key: string;
  title: string;
  desc: string;
  binaryPath: string; // 下载二进制时附加的 query 片段
  textPath: string; // 查看文本时附加的 query 片段
  filename: string; // 下载文件名
  supportsSeconds?: boolean;
  secondsModel?: 'profile' | 'trace';
}

const profiles: ProfileEntry[] = [
  {
    key: 'profile',
    title: 'CPU Profile',
    desc: '在指定时长内采集 CPU 使用情况，生成 .pb.gz 文件，可使用 go tool pprof 分析。',
    binaryPath: '',
    textPath: '',
    filename: 'cpu.pprof',
    supportsSeconds: true,
    secondsModel: 'profile',
  },
  {
    key: 'trace',
    title: '执行轨迹 (Trace)',
    desc: '在指定时长内采集程序执行轨迹，生成 .trace 文件，可使用 go tool trace 分析。',
    binaryPath: '',
    textPath: '',
    filename: 'trace.out',
    supportsSeconds: true,
    secondsModel: 'trace',
  },
  {
    key: 'heap',
    title: '堆内存 (Heap)',
    desc: '当前堆内存分配采样，可用于分析内存占用与泄漏。',
    binaryPath: 'heap',
    textPath: 'heap',
    filename: 'heap.pprof',
  },
  {
    key: 'allocs',
    title: '内存分配 (Allocs)',
    desc: '所有已分配的内存采样（历史累计），可用于分析分配热点。',
    binaryPath: 'allocs',
    textPath: 'allocs',
    filename: 'allocs.pprof',
  },
  {
    key: 'goroutine',
    title: '协程 (Goroutine)',
    desc: '当前所有 goroutine 的栈信息，常用于排查死锁、协程泄漏。',
    binaryPath: 'goroutine',
    textPath: 'goroutine',
    filename: 'goroutine.pprof',
  },
  {
    key: 'block',
    title: '阻塞 (Block)',
    desc: '同步原语上的阻塞事件采样，需运行时启用。需要较高开销，请谨慎使用。',
    binaryPath: 'block',
    textPath: 'block',
    filename: 'block.pprof',
  },
  {
    key: 'mutex',
    title: '互斥锁 (Mutex)',
    desc: '互斥锁争用事件采样，需运行时启用。',
    binaryPath: 'mutex',
    textPath: 'mutex',
    filename: 'mutex.pprof',
  },
  {
    key: 'threadcreate',
    title: '线程创建 (ThreadCreate)',
    desc: '系统线程创建事件的采样。',
    binaryPath: 'threadcreate',
    textPath: 'threadcreate',
    filename: 'threadcreate.pprof',
  },
  {
    key: 'cmdline',
    title: '命令行参数',
    desc: '显示进程启动的命令行参数。',
    binaryPath: 'cmdline',
    textPath: 'cmdline',
    filename: 'cmdline.txt',
  },
];

// 构造下载 URL：profile/trace 拼接 seconds，其他使用各自的 path
const buildDownloadPath = (entry: ProfileEntry) => {
  if (entry.key === 'profile') return `profile?seconds=${profileSeconds.value}`;
  if (entry.key === 'trace') return `trace?seconds=${traceSeconds.value}`;
  return entry.binaryPath;
};

const buildTextPath = (entry: ProfileEntry) => {
  if (entry.textPath) return `${entry.textPath}?debug=1`;
  return '';
};

const handleDownload = (entry: ProfileEntry) => {
  // profile/trace 等耗时请求防重入；瞬时下载也加锁避免重复触发
  if (isPending(entry.key)) return;
  markPending(entry.key);
  try {
    triggerDownload(buildDownloadPath(entry), entry.filename);
  } finally {
    // 瞬时下载立即释放；profile/trace 由于浏览器已开始下载，保持 pending
    // 直到用户切换/刷新页面即可（Set 会在组件卸载时随 reactive 一同回收）
    if (entry.key !== 'profile' && entry.key !== 'trace') {
      clearPending(entry.key);
    }
  }
};

const handleView = async (entry: ProfileEntry) => {
  if (isPending(entry.key)) return;
  await showTextProfile(entry.key, buildTextPath(entry), entry.title);
};
</script>

<template>
  <h2>性能分析</h2>
  <div class="tip">
    <el-collapse class="helptips">
      <el-collapse-item name="1">
        <template #title>
          <el-text tag="strong">查看帮助</el-text>
        </template>
        <el-text tag="p">
          <div>
            本页调用 <code>net/http/pprof</code>
            提供的端点对海豹核心进行性能分析。
          </div>
          <div>
            采集得到的 .pprof / .trace 文件可以使用 Go 自带的 <code>go tool pprof</code> /
            <code>go tool trace</code> 命令离线分析。
          </div>
          <div>长时间采样（如 CPU profile、trace）会持续占用资源，建议仅在排查问题时使用。</div>
        </el-text>
      </el-collapse-item>
    </el-collapse>
  </div>

  <main>
    <el-row :gutter="16">
      <el-col v-for="item in profiles" :key="item.key" :xs="24" :sm="12" :md="8" class="mb-3">
        <el-card shadow="hover" class="profile-card">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-semibold">{{ item.title }}</span>
              <el-tag v-if="item.supportsSeconds" type="warning" size="small">需时长</el-tag>
            </div>
          </template>

          <div class="profile-desc">{{ item.desc }}</div>

          <div v-if="item.secondsModel === 'profile'" class="profile-control">
            <el-text>采样时长（秒）：</el-text>
            <el-input-number
              v-model="profileSeconds"
              :min="1"
              :max="600"
              :step="5"
              size="small"
              controls-position="right"
              class="ml-2" />
          </div>
          <div v-if="item.secondsModel === 'trace'" class="profile-control">
            <el-text>采样时长（秒）：</el-text>
            <el-input-number
              v-model="traceSeconds"
              :min="1"
              :max="60"
              :step="1"
              size="small"
              controls-position="right"
              class="ml-2" />
          </div>

          <div class="profile-actions">
            <el-button
              type="primary"
              size="small"
              :icon="Download"
              :loading="isPending(item.key)"
              :disabled="isPending(item.key)"
              @click="handleDownload(item)">
              下载
            </el-button>
            <el-button
              v-if="item.textPath"
              size="small"
              :icon="View"
              :loading="isPending(item.key)"
              :disabled="isPending(item.key)"
              @click="handleView(item)">
              查看文本
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </main>

  <el-drawer v-model="previewVisible" :title="previewTitle" direction="rtl" size="60%">
    <div v-loading="previewLoading" class="profile-preview">
      <pre v-if="!previewLoading">{{ previewContent }}</pre>
    </div>
  </el-drawer>
</template>

<style scoped lang="css">
.helptips {
  background-color: #f3f5f7;

  :deep(.el-collapse-item__header) {
    background-color: #f3f5f7;
  }

  :deep(.el-collapse-item__wrap) {
    background-color: #f3f5f7;
  }
}

.profile-card {
  height: 100%;
}

.profile-desc {
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
  min-height: 60px;
  margin-bottom: 12px;
}

.profile-control {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.profile-actions {
  display: flex;
  gap: 8px;
}

.profile-preview {
  padding: 0 16px;

  pre {
    white-space: pre-wrap;
    word-break: break-all;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
  }
}

@media screen and (max-width: 700px) {
  .profile-preview {
    padding: 0 8px;
  }
}
</style>
