<template>
  <div class="same-network-login-help">
    <button type="button" class="help-link" @click="openSocks">
      <el-icon><QuestionFilled /></el-icon>
      <span>登录时提示请在同一网络环境里扫码？</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { h } from 'vue';
import { ElMessageBox } from 'element-plus';
import { QuestionFilled } from '@element-plus/icons-vue';
import { postToolOnebot } from '~/api/others';

const openSocks = async () => {
  const ret = await postToolOnebot();
  if (ret.ok) {
    const msg = h('p', null, [
      h('div', null, '将在服务器上开启临时 socks5 服务，端口 13325'),
      h('div', null, '默认持续时长为 20 分钟'),
      h('div', null, [
        h('span', null, `可能的公网 IP: `),
        h('span', { style: 'color: teal' }, `${ret.ip}`),
      ]),
      h('div', null, '注：ip 不一定对仅供参考'),
      h('div', { style: 'min-height: 1rem' }, ''),
      h('div', null, '请于服务器管理面板放行 13325 端口，协议 TCP'),
      h('div', null, '如果为 Windows Server 系统，请再额外关闭系统防火墙或设置放行规则。'),
    ]);
    ElMessageBox.alert(msg, '开启辅助工具');
  } else {
    const msg = h('p', null, [
      h('div', null, '启动服务失败，或已经启动'),
      h('div', null, [
        h('span', null, `报错信息：`),
        h('span', { style: 'color: #9b0d0d' }, `${ret.errText}`),
      ]),
      h('div', null, [
        h('span', null, `可能的公网 IP: `),
        h('span', { style: 'color: teal' }, `${ret.ip}`),
      ]),
      h('div', null, '注：ip 不一定对仅供参考'),
      h('div', { style: 'min-height: 1rem' }, ''),
      h('div', null, '请于服务器管理面板放行 13325 端口，协议 TCP'),
      h('div', null, '如果为 Windows Server 系统，请再额外关闭系统防火墙或设置放行规则。'),
    ]);
    ElMessageBox.alert(msg, '开启辅助工具');
  }
};
</script>

<style scoped>
.same-network-login-help {
  text-align: left;
}

.help-link {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--el-text-color-secondary);
  font: inherit;
  font-size: 12px;
  line-height: 1.5;
  text-decoration: none;
  text-align: left;
  cursor: pointer;
}

.help-link .el-icon {
  flex-shrink: 0;
  margin-top: 3px;
}

.help-link:hover {
  color: var(--el-color-primary);
}
</style>
