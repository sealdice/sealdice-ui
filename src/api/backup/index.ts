import { createRequest } from '..';
import type { AxiosProgressEvent } from 'axios';

const baseUrl = '/backup/';
const request = createRequest(baseUrl);

export function getBackupList() {
  return request<{ items: BackupInfo[] }>('get', 'list');
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

export function restoreBackup(name: string) {
  return request<{
    result: boolean;
    err?: string;
    safetyBackupName?: string;
    operationId?: string;
    statusToken?: string;
    reloading?: boolean;
    switchMode?: 'runtime';
  }>('post', 'restore', { name }, 'json', { timeout: 0 });
}

export function getBackupRestoreStatus(operationId?: string, statusToken?: string) {
  const headers: Record<string, string> = {};
  if (operationId) headers['X-Seal-Restore-Operation'] = operationId;
  if (statusToken) headers['X-Seal-Restore-Token'] = statusToken;
  return request<{ result: true; status: BackupRestoreStatus }>(
    'get',
    'restore/status',
    undefined,
    undefined,
    { headers },
  );
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
