const RUNTIME_RESTORE_STORAGE_KEY = 'sd-runtime-restore';
const RUNTIME_RESTORE_TRACKING_TTL = 10 * 60 * 1000;

export interface RuntimeRestoreTracking {
  operationId: string;
  statusToken: string;
  expiresAt: number;
  connectionInterrupted?: boolean;
}

export function rememberRuntimeRestore(operationId: string, statusToken: string) {
  const tracking: RuntimeRestoreTracking = {
    operationId,
    statusToken,
    expiresAt: Date.now() + RUNTIME_RESTORE_TRACKING_TTL,
  };
  sessionStorage.setItem(RUNTIME_RESTORE_STORAGE_KEY, JSON.stringify(tracking));
}

export function getRuntimeRestoreTracking(): RuntimeRestoreTracking | undefined {
  try {
    const raw = sessionStorage.getItem(RUNTIME_RESTORE_STORAGE_KEY);
    if (!raw) return undefined;

    const tracking = JSON.parse(raw) as Partial<RuntimeRestoreTracking>;
    if (
      typeof tracking.operationId !== 'string' ||
      typeof tracking.statusToken !== 'string' ||
      typeof tracking.expiresAt !== 'number' ||
      tracking.expiresAt <= Date.now()
    ) {
      clearRuntimeRestoreTracking();
      return undefined;
    }
    return tracking as RuntimeRestoreTracking;
  } catch {
    clearRuntimeRestoreTracking();
    return undefined;
  }
}

export function markRuntimeRestoreConnectionInterrupted() {
  const tracking = getRuntimeRestoreTracking();
  if (!tracking || tracking.connectionInterrupted) return;
  tracking.connectionInterrupted = true;
  sessionStorage.setItem(RUNTIME_RESTORE_STORAGE_KEY, JSON.stringify(tracking));
}

export function clearRuntimeRestoreTracking() {
  sessionStorage.removeItem(RUNTIME_RESTORE_STORAGE_KEY);
}
