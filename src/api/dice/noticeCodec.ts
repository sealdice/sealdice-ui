// 通知分类与通知 ID 字符串后缀编解码工具。
//
// 后端仍以字符串数组存储配置（保持向后兼容），格式为：
//   - QQ:12345                      启用全部分类
//   - QQ:12345:disable              禁用
//   - QQ:12345:only=group,ban       仅接收群组与黑名单相关通知
//   - QQ:12345:only=send:disable    顺序可换，元数据仅从末尾识别
// 持久化时由后端按统一顺序写回，因此 UI 不直接显示后缀。
export type NoticeCategory = 'group' | 'invite' | 'ban' | 'censor' | 'inactive' | 'send' | 'system';

export const ALL_NOTICE_CATEGORIES: NoticeCategory[] = [
  'group',
  'invite',
  'ban',
  'censor',
  'inactive',
  'send',
  'system',
];

export const NOTICE_CATEGORY_LABELS: Record<NoticeCategory, string> = {
  group: '群组事件',
  invite: '邀请事件',
  ban: '黑名单事件',
  censor: '敏感词事件',
  inactive: '不活跃群清理',
  send: 'send 留言',
  system: '系统事件',
};

export const NOTICE_CATEGORY_DESCRIPTIONS: Record<NoticeCategory, string> = {
  group: '入群、退群、被踢、被禁言、自动激活、手动退群等',
  invite: '群邀请与好友邀请',
  ban: '黑名单等级提升、黑名单用户/群处理',
  censor: '敏感词处理器配置为“通知骰主”时的提示',
  inactive: '自动清理不活跃群组的逐条或摘要通知',
  send: '用户通过 .send 指令的留言',
  system: '存活确认、连接中断、账号风控等系统通知',
};

export interface NoticeItem {
  id: string;
  enabled: boolean;
  categories: NoticeCategory[];
  // 内部状态：是否启用了自定义分类；无变化时不上报后端。
  categoriesDirty: boolean;
}

const META_SUFFIX_DISABLE = 'disable';
const META_PREFIX_ONLY = 'only=';

function splitOnly(value: string): NoticeCategory[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map(part => part.trim())
    .filter((part): part is NoticeCategory => (ALL_NOTICE_CATEGORIES as string[]).includes(part));
}

// decodeNoticeId 解析一条持久化通知目标字符串。
export function decodeNoticeId(raw: string): NoticeItem {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) {
    return { id: '', enabled: true, categories: [], categoriesDirty: false };
  }

  // Mail: 邮箱类型不支持元数据，沿用旧行为。
  if (trimmed.startsWith('Mail:')) {
    return {
      id: trimmed,
      enabled: true,
      categories: [],
      categoriesDirty: false,
    };
  }

  const parts = trimmed.split(':');
  let end = parts.length;
  let enabled = true;
  let categories: NoticeCategory[] = [];
  let categoriesDirty = false;

  while (end > 1) {
    const suffix = parts[end - 1].trim();
    if (suffix === META_SUFFIX_DISABLE) {
      enabled = false;
      end -= 1;
      continue;
    }
    if (suffix.startsWith(META_PREFIX_ONLY)) {
      // 取最右侧的 only= 作为最终生效值。
      if (!categoriesDirty) {
        categories = splitOnly(suffix.slice(META_PREFIX_ONLY.length));
        categoriesDirty = true;
      }
      end -= 1;
      continue;
    }
    break;
  }

  return {
    id: parts.slice(0, end).join(':'),
    enabled,
    categories,
    categoriesDirty,
  };
}

// encodeNoticeId 将 UI 状态编码为持久化字符串。
export function encodeNoticeId(item: NoticeItem): string {
  const id = (item.id ?? '').trim();
  if (!id) {
    return '';
  }
  if (id.startsWith('Mail:')) {
    return id;
  }
  const segments: string[] = [id];
  if (!item.enabled) {
    segments.push(META_SUFFIX_DISABLE);
  }
  if (item.categoriesDirty) {
    if (item.categories.length === 0) {
      segments.push(`${META_PREFIX_ONLY}`);
    } else {
      segments.push(`${META_PREFIX_ONLY}${item.categories.join(',')}`);
    }
  }
  return segments.join(':');
}

// fromNoticeItems 将 UI 状态数组转回字符串数组，过滤空项。
export function fromNoticeItems(items: NoticeItem[]): string[] {
  return items.map(encodeNoticeId).filter(value => value !== '');
}

// toNoticeItems 将字符串数组展开为 UI 状态。
export function toNoticeItems(list: string[] | undefined | null): NoticeItem[] {
  return (list ?? []).map(decodeNoticeId);
}

export function noticeItemPlatform(id: string): string | null {
  if (!id) {
    return null;
  }
  const colon = id.indexOf(':');
  if (colon === -1) {
    return null;
  }
  const prefix = id.slice(0, colon);
  const dash = prefix.indexOf('-');
  return (dash === -1 ? prefix : prefix.slice(0, dash)) || null;
}

export function isMailNoticeItem(id: string): boolean {
  return id.startsWith('Mail:');
}
