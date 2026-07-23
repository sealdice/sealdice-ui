import { createRequest } from '..';
import type { ContentKind } from '~/api/package';
import type { ApiResponse } from '../types';

const baseUrl = '/store/';
const request = createRequest(baseUrl);

export interface StorePackage {
  backendID?: string;
  formatVersion?: string;
  id: string;
  version: string;
  name: string;
  authors: string[];
  description: string;
  license: string;
  homepage?: string;
  repository?: string;
  keywords: string[];
  contents: ContentKind[];
  seal: {
    minVersion?: string;
    maxVersion?: string;
  };
  dependencies: Record<string, string>;
  storeAssets: {
    readme?: string;
    icon?: string;
    banner?: string;
    screenshots?: string[];
    category?: string;
  };
  download: {
    url: string;
    hash?: Record<string, string>;
    releaseTime?: number;
    updateTime?: number;
    downloadCount?: number;
    size?: number;
  };
  installed?: boolean;
}

export interface StoreBackendRecord {
  backendID?: string;
  id?: string;
  name?: string;
  url?: string;
  type?: string;
  builtin?: boolean;
  official?: boolean;
  health?: boolean;
  enabled?: boolean;
  disabled?: boolean;
  [key: string]: any;
}

export interface StorePageQuery {
  backend?: string;
  content?: ContentKind | 'all';
  author?: string;
  name?: string;
  category?: string;
  sortBy?: string;
  order?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface StoreRecommendQuery {
  backend?: string;
}

export interface DownloadStorePackagePayload {
  id: string;
  version: string;
}

export interface StorePackageFile {
  path: string;
  size: number;
}

const getStorePackageParts = (id: string) => {
  const separator = id.indexOf('/');
  if (separator <= 0 || separator === id.length - 1) {
    return null;
  }
  return {
    namespace: id.slice(0, separator),
    packageName: id.slice(separator + 1),
  };
};

const getStoreApiUrl = (pkg: StorePackage, backendUrl = '') => {
  try {
    if (backendUrl.trim()) {
      return new URL(backendUrl);
    }
    const url = new URL(pkg.download.url);
    const packagesPathIndex = url.pathname.indexOf('/packages/');
    if (packagesPathIndex < 0) {
      return null;
    }
    url.pathname = url.pathname.slice(0, packagesPathIndex);
    url.search = '';
    url.hash = '';
    return url;
  } catch {
    return null;
  }
};

export function getStorePackageAssetUrl(pkg: StorePackage, path: string, backendUrl = '') {
  const asset = path.trim();
  if (!asset) {
    return '';
  }
  if (/^https?:\/\//i.test(asset) || /^(data|blob):/i.test(asset)) {
    return asset;
  }

  const baseUrl = getStoreApiUrl(pkg, backendUrl);
  if (!baseUrl) {
    return '';
  }
  if (asset.startsWith('/') || asset.startsWith('//')) {
    return new URL(asset, baseUrl).toString();
  }

  const packageParts = getStorePackageParts(pkg.id);
  if (!packageParts) {
    return '';
  }
  baseUrl.pathname = `${baseUrl.pathname.replace(/\/$/, '')}/file/${encodeURIComponent(
    packageParts.namespace,
  )}/${encodeURIComponent(packageParts.packageName)}/${encodeURIComponent(pkg.version)}`;
  baseUrl.searchParams.set('path', asset);
  return baseUrl.toString();
}

export function getStorePackageDetailUrl(pkg: StorePackage, backendUrl = '') {
  const baseUrl = getStoreApiUrl(pkg, backendUrl);
  if (!baseUrl) {
    return '';
  }
  return getStorePackageDetailUrlById(pkg.id, baseUrl.toString());
}

export function getStorePackageDetailUrlById(id: string, backendUrl: string) {
  const packageParts = getStorePackageParts(id);
  if (!packageParts || !backendUrl.trim()) {
    return '';
  }
  let baseUrl: URL;
  try {
    baseUrl = new URL(backendUrl);
  } catch {
    return '';
  }
  baseUrl.pathname = '/packages';
  baseUrl.search = new URLSearchParams({
    namespace: packageParts.namespace,
    package: packageParts.packageName,
  }).toString();
  baseUrl.hash = '';
  return baseUrl.toString();
}

export function getStoreBackendList() {
  return request<ApiResponse<StoreBackendRecord[]>>('get', 'backend/list');
}

export function addStoreBackend(url: string) {
  return request<ApiResponse>('post', 'backend/add', { url });
}

export function removeStoreBackend(payload: Partial<StoreBackendRecord>) {
  return request<ApiResponse>('delete', 'backend/remove', payload);
}

export function setStoreBackendEnabled(payload: Partial<StoreBackendRecord>, enabled: boolean) {
  return request<ApiResponse>('post', enabled ? 'backend/enable' : 'backend/disable', payload);
}

export function getStoreRecommend(params?: StoreRecommendQuery) {
  return request<ApiResponse<StorePackage[]>>('get', 'recommend', params);
}

export function getStorePage(params: StorePageQuery) {
  return request<ApiResponse<StorePackage[]>>('get', 'page', params);
}

export function getStorePackageFiles(pkg: StorePackage) {
  const packageParts = getStorePackageParts(pkg.id);
  if (!packageParts) {
    return Promise.reject(new Error('商店扩展包 ID 格式无效'));
  }
  return request<ApiResponse<StorePackageFile[]>>(
    'get',
    `files/${encodeURIComponent(packageParts.namespace)}/${encodeURIComponent(
      packageParts.packageName,
    )}/${encodeURIComponent(pkg.version)}`,
  );
}

export function downloadStorePackage(payload: DownloadStorePackagePayload) {
  return request<ApiResponse>('post', 'download', payload);
}
