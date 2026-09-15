import { createRequest } from '..';
import type { AxiosProgressEvent } from 'axios';

const baseUrl = '/backup/';
const request = createRequest(baseUrl);

export function getBackupList() {
  return request<{ items: BackupInfo[] }>('get', 'list');
}

export function downloadBackup(name: string) {
  return request<Blob>('get', 'download', { name }, undefined, {
    responseType: 'blob',
  });
}

export function getBackupConfig() {
  return request<BackupConfig>('get', 'config_get');
}

export function setBackupConfig(data: BackupConfig) {
  return request('post', 'config_set', data);
}

export function postDoBackup(selection: number) {
  return request('post', 'do_backup', { selection });
}

export function uploadBackup(file: Blob, onProgress?: (event: AxiosProgressEvent) => void) {
  return request<{ result: boolean; item?: BackupInfo; err?: string }>(
    'post',
    'upload',
    { file },
    'formdata',
    { timeout: 0, onUploadProgress: onProgress },
  );
}

export function restoreBackup(name: string, requestId: string) {
  return request<{
    result: boolean;
    err?: string;
    safetyBackupName?: string;
    operationId?: string;
    statusToken?: string;
    expiresAt?: number;
    queued?: boolean;
    reloading?: boolean;
    switchMode?: 'runtime';
  }>('post', 'restore', { name, requestId }, 'json', { timeout: 15000 });
}

export type RuntimeMaintenanceCode = 'RUNTIME_RELOADING' | 'RUNTIME_UNAVAILABLE';

export class BackupRestoreStatusRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: RuntimeMaintenanceCode,
  ) {
    super(message);
    this.name = 'BackupRestoreStatusRequestError';
  }
}

function getBackupApiUrl(path: string) {
  const locationPath = window.location.pathname;
  const dir = locationPath.substring(0, locationPath.lastIndexOf('/') + 1);
  return `${dir}sd-api${baseUrl}${path}`;
}

export async function getBackupRestoreStatus(operationId: string, statusToken: string) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(getBackupApiUrl('restore/status'), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'X-Seal-Restore-Operation': operationId,
        'X-Seal-Restore-Token': statusToken,
      },
      signal: controller.signal,
    });
    const payload = (await response.json().catch(() => undefined)) as
      | {
          result?: boolean;
          status?: BackupRestoreStatus;
          code?: RuntimeMaintenanceCode;
          err?: string;
        }
      | undefined;

    if (!response.ok) {
      throw new BackupRestoreStatusRequestError(
        payload?.err || `查询恢复状态失败（HTTP ${response.status}）`,
        response.status,
        payload?.code,
      );
    }
    if (!payload?.status || !isBackupRestoreState(payload.status.state)) {
      throw new BackupRestoreStatusRequestError('恢复服务返回了无效的状态');
    }
    return { result: true as const, status: payload.status };
  } finally {
    window.clearTimeout(timeout);
  }
}

export function postBackupDel(name: string) {
  return request<{ success: boolean }>('post', 'delete?name=' + name, { name });
}

export function postBackupBatchDel(names: string[]) {
  return request<
    | { result: true }
    | {
        result: false;
        fails: string[];
      }
  >('post', 'batch_delete', { names });
}

type BackupConfig = {
  autoBackupEnable: boolean;
  autoBackupTime: string;
  autoBackupSelection: number;
  backupCleanStrategy: number;
  backupCleanKeepCount: number;
  backupCleanKeepDur: string;
  backupCleanTrigger: number;
  backupCleanCron: string;
  autoBackupSelectionList: string[];
};
export type BackupInfo = {
  name: string;
  fileSize: number;
  selection: number;
  version: string;
  versionCode: number;
  valid: boolean;
  restorable: boolean;
  restoreError?: string;
  error?: string;
  reused?: boolean;
};

export type BackupRestoreStatus = {
  state:
    | 'idle'
    | 'pending'
    | 'quiescing'
    | 'applying'
    | 'starting'
    | 'rolling_back'
    | 'succeeded'
    | 'failed'
    | 'rolled_back'
    | 'degraded';
  operationId?: string;
  sourceName?: string;
  safetyBackupName?: string;
  message?: string;
  updatedAt?: number;
};

export const activeBackupRestoreStates: BackupRestoreStatus['state'][] = [
  'pending',
  'quiescing',
  'applying',
  'starting',
  'rolling_back',
];

export const terminalBackupRestoreStates: BackupRestoreStatus['state'][] = [
  'succeeded',
  'failed',
  'rolled_back',
  'degraded',
];

export function isBackupRestoreState(value: unknown): value is BackupRestoreStatus['state'] {
  return (
    value === 'idle' ||
    activeBackupRestoreStates.includes(value as BackupRestoreStatus['state']) ||
    terminalBackupRestoreStates.includes(value as BackupRestoreStatus['state'])
  );
}
