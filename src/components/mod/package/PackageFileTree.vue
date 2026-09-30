<template>
  <div class="package-file-tree">
    <template v-if="tree.length > 0">
      <ul class="tree-list tree-list-root">
        <PackageFileTreeNode v-for="node in tree" :key="node.path" :node="node" />
      </ul>
    </template>
    <el-empty v-else description="暂无文件清单" :image-size="72" />
  </div>
</template>

<script setup lang="ts">
import type { PackageFileTreeItem } from './file-tree';
import PackageFileTreeNode from './PackageFileTreeNode.vue';

const props = defineProps<{
  files?: string[];
}>();

const normalizePackageFilePath = (value: string) =>
  value.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+/g, '/');

const createDirectoryNode = (name: string, path: string): PackageFileTreeItem => ({
  name,
  path,
  type: 'directory',
  children: [],
});

const createFileNode = (name: string, path: string): PackageFileTreeItem => ({
  name,
  path,
  type: 'file',
});

const sortTreeNodes = (nodes: PackageFileTreeItem[]) => {
  nodes.sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === 'directory' ? -1 : 1;
    }
    return left.name.localeCompare(right.name, 'zh-Hans-CN');
  });
  nodes.forEach(node => {
    if (node.children) {
      sortTreeNodes(node.children);
    }
  });
};

const tree = computed(() => {
  const roots: PackageFileTreeItem[] = [];
  const directoryMap = new Map<string, PackageFileTreeItem>();

  for (const rawFile of props.files ?? []) {
    const normalized = normalizePackageFilePath(rawFile);
    if (!normalized) {
      continue;
    }
    const parts = normalized.split('/').filter(Boolean);
    let siblings = roots;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;
      if (isFile) {
        if (!siblings.some(node => node.path === currentPath)) {
          siblings.push(createFileNode(part, currentPath));
        }
        return;
      }

      let directory = directoryMap.get(currentPath);
      if (!directory) {
        directory = createDirectoryNode(part, currentPath);
        directoryMap.set(currentPath, directory);
        siblings.push(directory);
      }
      siblings = directory.children ?? [];
    });
  }

  sortTreeNodes(roots);
  return roots;
});
</script>

<style scoped lang="css">
.package-file-tree {
  max-height: 420px;
  overflow: auto;
  padding: 0.75rem 1rem;
  border: 1px solid #dce5ef;
  border-radius: 0.45rem;
  background: #f8fafc;
}

.tree-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.tree-list-root {
  min-width: max-content;
}
</style>
