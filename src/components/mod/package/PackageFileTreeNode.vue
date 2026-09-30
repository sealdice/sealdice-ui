<template>
  <li class="tree-item">
    <div class="tree-row" :class="`is-${node.type}`">
      <el-icon class="tree-icon" aria-hidden="true">
        <FolderOpened v-if="node.type === 'directory'" />
        <Document v-else />
      </el-icon>
      <span class="tree-name">{{ node.name }}</span>
    </div>
    <ul v-if="node.children?.length" class="tree-list tree-list-child">
      <PackageFileTreeNode v-for="child in node.children" :key="child.path" :node="child" />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { Document, FolderOpened } from '@element-plus/icons-vue';
import type { PackageFileTreeItem } from './file-tree';

defineProps<{
  node: PackageFileTreeItem;
}>();
</script>

<style scoped lang="css">
.tree-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.tree-list-child {
  margin-left: 1.25rem;
}

.tree-row {
  min-height: 26px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #24364f;
  font-size: 13px;
  line-height: 1.4;
  white-space: nowrap;
}

.tree-icon {
  flex: 0 0 auto;
  color: #91a4bd;
  font-size: 15px;
}

.tree-row.is-directory .tree-icon {
  color: #f59e0b;
}

.tree-name {
  overflow-wrap: anywhere;
}
</style>
