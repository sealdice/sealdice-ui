import { parse } from 'smol-toml';

export const MAX_PACKAGE_INSTALL_LIST_ITEMS = 200;

export interface PackageInstallListItem {
  id: string;
  version: string;
}

const tomlString = (value: string) => JSON.stringify(value);

export function serializePackageInstallList(items: readonly PackageInstallListItem[]): string {
  const dependencies = [...items]
    .sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0))
    .map(item => `${tomlString(item.id)} = ${tomlString(`=${item.version}`)}`);

  return ['[dependencies]', ...dependencies, ''].join('\n');
}

export function parsePackageInstallList(content: string): PackageInstallListItem[] {
  const document = parse(content);
  const dependencies = document.dependencies;

  if (typeof dependencies !== 'object' || dependencies === null || Array.isArray(dependencies)) {
    throw new Error('清单缺少 [dependencies] 配置段。');
  }

  const entries = Object.entries(dependencies);
  if (entries.length === 0) {
    throw new Error('[dependencies] 中没有可安装的扩展包。');
  }
  if (entries.length > MAX_PACKAGE_INSTALL_LIST_ITEMS) {
    throw new Error(`清单中的扩展包不能超过 ${MAX_PACKAGE_INSTALL_LIST_ITEMS} 个。`);
  }

  return entries.map(([rawId, rawConstraint]) => {
    const id = rawId.trim();
    const idSegments = id.split('/');
    if (idSegments.length !== 2 || idSegments.some(segment => segment.trim().length === 0)) {
      throw new Error(`扩展包 ID “${rawId}” 格式不正确。`);
    }
    if (typeof rawConstraint !== 'string') {
      throw new Error(`扩展包 “${id}” 的版本必须是字符串。`);
    }

    const constraint = rawConstraint.trim();
    const version = constraint.startsWith('=') ? constraint.slice(1).trim() : constraint;
    if (!version || /^[<>~^*]/u.test(version)) {
      throw new Error(`扩展包 “${id}” 必须指定一个确切版本。`);
    }

    return { id, version };
  });
}
