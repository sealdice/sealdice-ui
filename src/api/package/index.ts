import type { AxiosProgressEvent } from 'axios';
import { createRequest } from '..';

const baseUrl = '/package/';
const request = createRequest(baseUrl);

export interface ApiResponse<T = unknown> {
  result: boolean;
  data?: T;
  err?: string;
  message?: string;
  [key: string]: any;
}

export type ContentKind = 'scripts' | 'decks' | 'reply' | 'helpdoc' | 'templates';

export interface PackageManifest {
  formatVersion?: number;
  package: {
    id: string;
    name: string;
    version: string;
    authors?: string[];
    license?: string;
    description?: string;
    homepage?: string;
    repository?: string;
    keywords?: string[];
    seal?: {
      minVersion?: string;
      maxVersion?: string;
    };
  };
  dependencies?: Record<string, string>;
  permissions?: {
    network?: boolean;
    networkHosts?: string[];
    fileRead?: string[];
    fileWrite?: string[];
    dangerous?: boolean;
    httpServer?: boolean;
    ipc?: string[];
  };
  contents?: Partial<Record<ContentKind, string[]>>;
  store?: {
    readme?: string;
    icon?: string;
    banner?: string;
    screenshots?: string[];
    category?: string;
  };
  config?: Record<string, any>;
}

export type PackageState = 'installed' | 'enabled' | 'disabled' | 'error';
export type PackageSourceStatus = 'present' | 'cache_only';

export interface PackageInstance {
  manifest: PackageManifest;
  state: PackageState;
  installTime?: string;
  installPath?: string;
  sourcePath?: string;
  userDataPath?: string;
  config?: Record<string, any>;
  errText?: string;
  sourceStatus?: PackageSourceStatus;
  sourceWarning?: string;
  pendingReload?: string[];
}

export interface PackageRefreshResult {
  packages: PackageInstance[];
  added?: string[];
  updated?: string[];
  cacheOnly?: string[];
  removed?: string[];
}

export interface PackageUploadPreview {
  manifest: PackageManifest;
  files: string[];
  fileCount: number;
  contentCounts?: Partial<Record<ContentKind | 'assets', number>>;
  existingVersion?: string;
  installAction: 'install' | 'upgrade';
}

export interface PackageInstallPathPayload {
  path: string;
}

export interface PackageInstallUrlPayload {
  url: string;
}

export interface PackageUninstallPayload {
  id: string;
  mode: 'full' | 'keep_data';
}

export function getPackageList() {
  return request<ApiResponse<PackageInstance[]>>('get', 'list');
}

export function refreshPackageInstallations() {
  return request<ApiResponse<PackageRefreshResult>>('post', 'refresh');
}

export function getPackageDetail(id: string) {
  // ID 可能包含 /，接口通过固定路径 + query 传参。
  return request<ApiResponse<PackageInstance>>('get', '_', { id });
}

export function installPackageByPath(payload: PackageInstallPathPayload) {
  return request<ApiResponse>('post', 'install', payload);
}

export function installPackageByUrl(payload: PackageInstallUrlPayload) {
  return request<ApiResponse>('post', 'install-url', payload);
}

const packageUploadRequestConfig = (
  file: Blob & { name?: string },
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
) => ({
  headers: {
    'Content-Type': 'application/octet-stream',
    'X-Filename': encodeURIComponent(file.name ?? 'package.sealpkg'),
  },
  timeout: 120000,
  onUploadProgress,
});

export function previewPackageUpload(
  file: Blob & { name?: string },
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
) {
  return request<ApiResponse<PackageUploadPreview>>(
    'post',
    'preview-upload',
    file,
    undefined,
    packageUploadRequestConfig(file, onUploadProgress),
  );
}

export function installPackageByUpload(
  file: Blob & { name?: string },
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
) {
  return request<ApiResponse>(
    'post',
    'install-upload',
    file,
    undefined,
    packageUploadRequestConfig(file, onUploadProgress),
  );
}

export function enablePackage(id: string) {
  return request<ApiResponse>('post', 'enable', { id });
}

export function disablePackage(id: string) {
  return request<ApiResponse>('post', 'disable', { id });
}

export function reloadPackage(id: string) {
  return request<ApiResponse>('post', 'reload', { id });
}

export function reloadPackageByContent(content: ContentKind) {
  return request<ApiResponse>('post', 'reload-content', { content });
}

export function reloadAllPackages() {
  return request<ApiResponse>('post', 'reload-all');
}

export function uninstallPackage(payload: PackageUninstallPayload) {
  return request<ApiResponse>('post', 'uninstall', payload);
}

export function getPackageConfig(id: string) {
  // ID 可能包含 /，接口通过固定路径 + query 传参。
  return request<ApiResponse<Record<string, any>>>('get', '_/config', { id });
}

export function setPackageConfig(id: string, config: Record<string, any>) {
  // ID 可能包含 /，接口通过固定路径 + query 传参。
  return request<ApiResponse>('post', '_/config', config, 'json', { params: { id } });
}

export function getPackageConfigSchema(id: string) {
  // ID 可能包含 /，接口通过固定路径 + query 传参。
  return request<ApiResponse<Record<string, any>>>('get', '_/config-schema', { id });
}
