import { createRequest } from '..';
import type { ContentKind } from '~/api/package';

const baseUrl = '/store/';
const request = createRequest(baseUrl);

export interface ApiResponse<T = unknown> {
  result: boolean;
  data?: T;
  err?: string;
  message?: string;
  [key: string]: any;
}

export interface StorePackage {
  backendID?: string;
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

export function getStoreBackendList() {
  return request<ApiResponse<StoreBackendRecord[]>>('get', 'backend/list');
}

export function addStoreBackend(url: string) {
  return request<ApiResponse>('post', 'backend/add', { url });
}

export function removeStoreBackend(payload: Partial<StoreBackendRecord>) {
  return request<ApiResponse>('delete', 'backend/remove', payload);
}

export function getStoreRecommend(params?: StoreRecommendQuery) {
  return request<ApiResponse<StorePackage[]>>('get', 'recommend', params);
}

export function getStorePage(params: StorePageQuery) {
  return request<ApiResponse<StorePackage[]>>('get', 'page', params);
}

export function downloadStorePackage(payload: DownloadStorePackagePayload) {
  return request<ApiResponse>('post', 'download', payload);
}
