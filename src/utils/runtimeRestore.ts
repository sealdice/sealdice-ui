const RUNTIME_RESTORE_STORAGE_KEY = 'sd-runtime-restore';
const RUNTIME_RESTORE_PENDING_STORAGE_KEY = 'sd-runtime-restore-pending';
const RUNTIME_RESTORE_STORAGE_PROBE_KEY = 'sd-runtime-restore-probe';
const RUNTIME_RESTORE_TRACKING_TTL = 15 * 60 * 1000;

export interface RuntimeRestoreTracking {
  generation: string;
  operationId: string;
  statusToken: string;
  expiresAt: number;
  sourceName?: string;
}

export interface PendingRuntimeRestoreRequest {
  requestId: string;
  sourceName: string;
}

function normalizeExpiresAt(expiresAt?: number) {
  if (!expiresAt || !Number.isFinite(expiresAt)) return Date.now() + RUNTIME_RESTORE_TRACKING_TTL;
  return expiresAt < 10_000_000_000 ? expiresAt * 1000 : expiresAt;
}

export function canTrackRuntimeRestore() {
  try {
    sessionStorage.setItem(RUNTIME_RESTORE_STORAGE_PROBE_KEY, '1');
    sessionStorage.removeItem(RUNTIME_RESTORE_STORAGE_PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function createRuntimeRestoreRequestId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function readRuntimeRestoreTracking(): RuntimeRestoreTracking | undefined {
  try {
    const raw = sessionStorage.getItem(RUNTIME_RESTORE_STORAGE_KEY);
    if (!raw) return undefined;

    const tracking = JSON.parse(raw) as Partial<RuntimeRestoreTracking>;
    if (
      typeof tracking.operationId !== 'string' ||
      typeof tracking.statusToken !== 'string' ||
      typeof tracking.expiresAt !== 'number'
    ) {
      clearRuntimeRestoreTracking();
      return undefined;
    }
    return {
      ...tracking,
      generation:
        typeof tracking.generation === 'string'
          ? tracking.generation
          : `legacy:${tracking.operationId}`,
    } as RuntimeRestoreTracking;
  } catch {
    clearRuntimeRestoreTracking();
    return undefined;
  }
}

export function rememberRuntimeRestore(
  operationId: string,
  statusToken: string,
  expiresAt?: number,
  sourceName?: string,
) {
  const tracking: RuntimeRestoreTracking = {
    generation: createRuntimeRestoreRequestId(),
    operationId,
    statusToken,
    expiresAt: normalizeExpiresAt(expiresAt),
    sourceName,
  };
  sessionStorage.setItem(RUNTIME_RESTORE_STORAGE_KEY, JSON.stringify(tracking));
}

export function getRuntimeRestoreTracking(): RuntimeRestoreTracking | undefined {
  const tracking = readRuntimeRestoreTracking();
  return tracking && tracking.expiresAt > Date.now() ? tracking : undefined;
}

export function isRuntimeRestoreTrackingReplaced(
  generation: string,
  operationId: string,
  statusToken: string,
) {
  const current = readRuntimeRestoreTracking();
  return (
    current !== undefined &&
    (current.generation !== generation ||
      current.operationId !== operationId ||
      current.statusToken !== statusToken)
  );
}

export function rememberPendingRuntimeRestore(requestId: string, sourceName: string) {
  const pending: PendingRuntimeRestoreRequest = { requestId, sourceName };
  sessionStorage.setItem(RUNTIME_RESTORE_PENDING_STORAGE_KEY, JSON.stringify(pending));
}

export function getPendingRuntimeRestore(): PendingRuntimeRestoreRequest | undefined {
  try {
    const raw = sessionStorage.getItem(RUNTIME_RESTORE_PENDING_STORAGE_KEY);
    if (!raw) return undefined;

    const pending = JSON.parse(raw) as Partial<PendingRuntimeRestoreRequest>;
    if (
      typeof pending.requestId !== 'string' ||
      !pending.requestId ||
      typeof pending.sourceName !== 'string' ||
      !pending.sourceName
    ) {
      clearPendingRuntimeRestore();
      return undefined;
    }
    return pending as PendingRuntimeRestoreRequest;
  } catch {
    clearPendingRuntimeRestore();
    return undefined;
  }
}

export function clearPendingRuntimeRestore(requestId?: string) {
  try {
    if (requestId) {
      const raw = sessionStorage.getItem(RUNTIME_RESTORE_PENDING_STORAGE_KEY);
      if (raw) {
        const pending = JSON.parse(raw) as Partial<PendingRuntimeRestoreRequest>;
        if (pending.requestId !== requestId) return;
      }
    }
    sessionStorage.removeItem(RUNTIME_RESTORE_PENDING_STORAGE_KEY);
  } catch {
    // sessionStorage may be unavailable in restricted browser contexts.
  }
}

export function promotePendingRuntimeRestore(
  requestId: string,
  operationId: string,
  statusToken: string,
  expiresAt?: number,
  sourceName?: string,
) {
  const pending = getPendingRuntimeRestore();
  if (pending && pending.requestId !== requestId) {
    throw new Error('未决恢复请求已被替换');
  }
  rememberRuntimeRestore(operationId, statusToken, expiresAt, sourceName);
  clearPendingRuntimeRestore(requestId);
}

export function clearRuntimeRestoreTracking() {
  try {
    sessionStorage.removeItem(RUNTIME_RESTORE_STORAGE_KEY);
  } catch {
    // sessionStorage may be unavailable in restricted browser contexts.
  }
}
