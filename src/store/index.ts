import { getCustomText, saveCustomText } from '~/api/configs';
import {
  getAdvancedConfig,
  getDiceConfig,
  setAdvancedConfig,
  setDiceConfig,
  type DiceConfig,
} from '~/api/dice';
import {
  getConnectionList,
  postAddDingtalk,
  postAddDiscord,
  postAddDodo,
  postAddGocq,
  postAddGocqSeparate,
  postAddKook,
  postAddLagrange,
  postAddMilky,
  postAddMilkyInternal,
  postAddMinecraft,
  postAddOfficialQQ,
  postAddOnebot11ReverseWs,
  postAddRed,
  postAddSatori,
  postaddSealChat,
  postAddSlack,
  postAddTelegram,
  type AddOfficialQQResult,
  type DiceConnection,
} from '~/api/im_connections';
import { getBaseInfo, getHello, getLogFetchAndClear, getPreInfo } from '~/api/others';
import { getSalt, signin } from '~/api/signin';
import {
  activeBackupRestoreStates,
  BackupRestoreStatusRequestError,
  getBackupRestoreStatus,
  restoreBackup,
  terminalBackupRestoreStates,
  type BackupRestoreStatus,
  type RuntimeMaintenanceCode,
} from '~/api/backup';
import type { addImConnectionForm } from '~/components/PageConnectInfoItems.vue';
import type { AdvancedConfig } from '~/type.d.ts';
import {
  canTrackRuntimeRestore,
  clearPendingRuntimeRestore,
  clearRuntimeRestoreTracking,
  createRuntimeRestoreRequestId,
  getPendingRuntimeRestore,
  getRuntimeRestoreTracking,
  isRuntimeRestoreTrackingReplaced,
  promotePendingRuntimeRestore,
  rememberPendingRuntimeRestore,
} from '~/utils/runtimeRestore';
import { isAxiosError } from 'axios';
import { toNumber } from 'lodash-es';

export { OfficialQQLoginState, goCqHttpStateCode } from '~/api/im_connections';
export type { AdapterQQ, DiceConnection } from '~/api/im_connections';

export const ImConnectionTypeGocqLegacy = 0;
export const ImConnectionTypeDiscord = 1;
export const ImConnectionTypeKook = 2;
export const ImConnectionTypeTelegram = 3;
export const ImConnectionTypeMinecraft = 4;
export const ImConnectionTypeDodo = 5;
export const ImConnectionTypeOnebotSeparate = 6;
export const ImConnectionTypeRed = 7;
export const ImConnectionTypeDingTalk = 8;
export const ImConnectionTypeSlack = 9;
export const ImConnectionTypeOfficialQQ = 10;
export const ImConnectionTypeOnebotReverse = 11;
// no 12 type here
export const ImConnectionTypeSealChat = 13;
export const ImConnectionTypeSatori = 14;
export const ImConnectionTypeLagrangeOnebot = 15;
// 16 is langrange gocq, deprecated
export const ImConnectionTypeMilkySeparate = 17;
export const ImConnectionTypeMilkyInternal = 18;
export const ImConnectionTypeMilkyInternalLagrange = 19;
export const ImConnectionTypeMilkyInternalYogurt = 20;

interface TalkLogItem {
  name?: string;
  content: string;
  isSeal?: boolean;
  mode: 'private' | 'group';
}

export const urlPrefix = 'sd-api';

interface DiceServer {
  config: any;
  customTextsHelpInfo: {
    [k: string]: {
      [k: string]: {
        filename: string[];
        origin: string[][];
        vars: string[];
        modified: boolean;
        notBuiltin: boolean;
        topOrder: number;
        subType: string;
        extraText: string;
      };
    };
  };
  customTexts: { [k: string]: { [k: string]: string[][] } };
  previewInfo: {
    [key: string]: {
      version: string;
      textV2: string;
      textV1: string;
      presetExists: boolean;
      errV1: string;
      errV2: string;
    };
  };
  logs: { level: string; ts: number; caller: string; msg: string }[];
  conns: DiceConnection[];
  baseInfo: DiceBaseInfo;
  qrcodes: { [key: string]: string };
}

interface DiceBaseInfo {
  appChannel: string;
  version: string;
  versionSimple: string;
  versionNew: string;
  versionNewNote: string;
  versionCode: number;
  versionNewCode: number;
  memoryAlloc: number;
  memoryUsedSys: number;
  uptime: number;
  OS: string;
  arch: string;
  justForTest: boolean;
  containerMode: boolean;
}

export type ResourceType = 'image' | 'audio' | 'video';

export interface Resource {
  type: ResourceType | 'unknown';
  name: string;
  ext: string;
  path: string;
  size: number;
}

export type AuthStatus =
  | 'checking'
  | 'authenticated'
  | 'password-required'
  | 'maintenance'
  | 'offline';

let runtimeRestorePollTimer: number | undefined;
let runtimeRestoreStatusRequest: Promise<BackupRestoreStatus> | undefined;
let runtimeRestoreResumeRequest: Promise<BackupRestoreStatus> | undefined;
let sessionInitializationRequest: Promise<AuthStatus> | undefined;
let signInCheckRequest: Promise<boolean> | undefined;
let runtimeRestoreSuccessTimer: number | undefined;

function getResponseStatus(error: unknown) {
  return isAxiosError(error) ? error.response?.status : undefined;
}

function getRuntimeMaintenanceCode(error: unknown): RuntimeMaintenanceCode | undefined {
  if (!isAxiosError(error) || error.response?.status !== 503) return undefined;
  const code = (error.response.data as { code?: unknown } | undefined)?.code;
  return code === 'RUNTIME_RELOADING' || code === 'RUNTIME_UNAVAILABLE' ? code : undefined;
}

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (error instanceof BackupRestoreStatusRequestError) return error.message;
  if (isAxiosError(error)) {
    const message = (error.response?.data as { err?: unknown } | undefined)?.err;
    if (typeof message === 'string' && message) return message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

function getRestoreQueuedState(error: unknown) {
  if (!isAxiosError(error)) return undefined;
  const queued = (error.response?.data as { queued?: unknown } | undefined)?.queued;
  return typeof queued === 'boolean' ? queued : undefined;
}

export const useStore = defineStore('main', {
  state: () => {
    return {
      salt: '',
      token: '',
      index: 0,
      authStatus: 'checking' as AuthStatus,
      passwordRequired: false,
      runtimeMaintenanceCode: undefined as RuntimeMaintenanceCode | undefined,
      sessionInitialized: false,
      runtimeRestoreRecovered: false,
      runtimeRestorePollingUnavailable: false,
      runtimeRestoreSubmitting: false,
      runtimeRestoreRequestId: undefined as string | undefined,
      runtimeRestoreRequestSource: undefined as string | undefined,
      runtimeRestoreStatus: { state: 'idle' } as BackupRestoreStatus,
      diceServers: [] as DiceServer[],

      talkLogs: [
        {
          content:
            '海豹已就绪。此界面可视为私聊窗口。\n设置中添加 Master 名为 UI:1001\n即可在此界面使用 master 命令！',
          isSeal: true,
          mode: 'private',
        },
        {
          content:
            '海豹已就绪。此界面可视为群聊窗口。\n设置中添加 Master 名为 UI:1002\n即可在此界面使用 master 命令！',
          isSeal: true,
          mode: 'group',
        },
        {
          content: '（请注意，当前会话记录在刷新页面后会消失）',
          isSeal: true,
          mode: 'private',
        },
        {
          content: '（请注意，当前会话记录在刷新页面后会消失）',
          isSeal: true,
          mode: 'group',
        },
      ] as TalkLogItem[],
    };
  },
  getters: {
    canAccess(): boolean {
      return this.authStatus === 'authenticated';
    },
    runtimeRestoreInProgress(): boolean {
      return activeBackupRestoreStates.includes(this.runtimeRestoreStatus.state);
    },
    runtimeRestoreRequestPending(): boolean {
      if (!this.runtimeRestoreRequestId) return false;
      return getPendingRuntimeRestore()?.requestId === this.runtimeRestoreRequestId;
    },
    runtimeMaintenance(): boolean {
      return (
        this.authStatus === 'maintenance' ||
        this.runtimeRestoreSubmitting ||
        this.runtimeRestoreInProgress
      );
    },
    curDice(): DiceServer {
      if (this.diceServers.length === 0) {
        this.diceServers.push({
          baseInfo: {
            appChannel: 'stable',
            version: '0.0',
            versionSimple: '0.0',
            versionNew: '0.0',
            memoryUsedSys: 0,
            memoryAlloc: 0,
            uptime: 0,
            versionNewNote: '',
            versionCode: 0,
            versionNewCode: 0,
            OS: '',
            arch: '',
            justForTest: false,
            containerMode: false,
          },
          customTexts: {},
          customTextsHelpInfo: {},
          previewInfo: {},
          logs: [],
          conns: [],
          qrcodes: {},
          config: {},
        });
      }

      return this.diceServers[this.index];
    },
  },
  actions: {
    async customTextSave(category: string) {
      await saveCustomText(category, this.curDice.customTexts[category]);
    },

    async getPreInfo() {
      await this.resumeRuntimeRestore();
      if (this.runtimeMaintenance) return { testMode: false };

      const info: {
        testMode: boolean;
      } = await getPreInfo().catch(error => {
        this.setAuthStatusFromError(error);
        return { testMode: false };
      });
      return info;
    },

    async getBaseInfo() {
      const info = await getBaseInfo();
      if (!document.title.includes('-')) {
        if (info.extraTitle && info.extraTitle !== '') {
          document.title = `${info.extraTitle} - ${document.title}`;
        }
      }
      this.curDice.baseInfo = info;
      return info;
    },

    async getCustomText() {
      const data = await getCustomText();
      this.curDice.customTexts = data.texts;
      this.curDice.customTextsHelpInfo = data.helpInfo;
      this.curDice.previewInfo = data.previewInfo;
      return data;
    },

    async getImConnections() {
      const info = await getConnectionList();
      const connections = info ?? [];
      this.diceServers[this.index].conns = connections;
      return connections;
    },

    async addImConnection(
      form: addImConnectionForm,
      officialQQTestOnly = false,
    ): Promise<DiceConnection | AddOfficialQQResult> {
      const {
        accountType,
        nickname,
        account,
        password,
        protocol,
        appVersion,
        token,
        botToken,
        appToken,
        proxyURL,
        reverseProxyUrl,
        reverseProxyCDNUrl,
        url,
        host,
        port,
        appID,
        appSecret,
        clientID,
        robotCode,
        implementation,
        relWorkDir,
        connectUrl,
        accessToken,
        useSignServer,
        signServerConfig,
        signServerName,
        signServerVersion,
        reverseAddr,
        platform,
        wsGateway,
        restGateway,
        builtInMode,
        useWebhook,
        webhookPath,
        webhookPort,
      } = form;

      let info: DiceConnection | AddOfficialQQResult | null = null;
      switch (accountType) {
        //QQ
        case ImConnectionTypeGocqLegacy:
          if (implementation === 'gocq') {
            info = await postAddGocq(
              account,
              password,
              protocol,
              appVersion,
              useSignServer,
              signServerConfig,
            );
          }
          // deprecated
          // else if (implementation === 'walle-q') {
          //   info = await postAddWalleQ(account, password, protocol);
          // }
          break;
        case ImConnectionTypeDiscord:
          info = await postAddDiscord(token.trim(), proxyURL, reverseProxyUrl, reverseProxyCDNUrl);
          break;
        case ImConnectionTypeKook:
          info = await postAddKook(token.trim());
          break;
        case ImConnectionTypeTelegram:
          info = await postAddTelegram(token.trim(), proxyURL);
          break;
        case ImConnectionTypeMinecraft:
          info = await postAddMinecraft(url);
          break;
        case ImConnectionTypeDodo:
          info = await postAddDodo(clientID.trim(), token.trim());
          break;
        case ImConnectionTypeOnebotSeparate: {
          // onebot11 正向
          let realUrl: string = connectUrl.trim();
          if (!realUrl.startsWith('ws://') && !realUrl.startsWith('wss://')) {
            realUrl = `ws://${realUrl}`;
          }
          info = await postAddGocqSeparate(relWorkDir, realUrl, accessToken, account);
          break;
        }
        case ImConnectionTypeRed:
          info = await postAddRed(host, port, token);
          break;
        case ImConnectionTypeDingTalk:
          info = await postAddDingtalk(clientID, token, nickname, robotCode);
          break;
        case ImConnectionTypeSlack:
          info = await postAddSlack(botToken, appToken);
          break;
        case ImConnectionTypeOfficialQQ:
          info = await postAddOfficialQQ(
            appID,
            appSecret,
            officialQQTestOnly,
            useWebhook,
            webhookPath,
            webhookPort,
          );
          break;
        case ImConnectionTypeOnebotReverse:
          info = await postAddOnebot11ReverseWs(account, reverseAddr?.trim());
          break;
        case ImConnectionTypeSealChat:
          info = await postaddSealChat(url.trim(), token.trim());
          break;
        case ImConnectionTypeSatori:
          info = await postAddSatori(platform, host, port, token);
          break;
        case ImConnectionTypeLagrangeOnebot:
          {
            info = await postAddLagrange(account, signServerName, signServerVersion);
          }
          break;
        // lagrange gocq deprecated
        // case 16:
        //   {
        //     info = await postAddLagrange(account, signServerName, signServerVersion, true);
        //   }
        //   break;
        case ImConnectionTypeMilkySeparate:
          {
            info = await postAddMilky(token, wsGateway, restGateway);
          }
          break;
        case ImConnectionTypeMilkyInternal:
          {
            info = await postAddMilkyInternal(toNumber(account), builtInMode || 'yogurt');
          }
          break;
        case ImConnectionTypeMilkyInternalLagrange:
          {
            info = await postAddMilkyInternal(toNumber(account), 'lagrangeV2');
          }
          break;
        case ImConnectionTypeMilkyInternalYogurt:
          {
            info = await postAddMilkyInternal(toNumber(account), 'yogurt');
          }
          break;
      }
      if (info === null) {
        throw new Error('添加账号接口未返回结果');
      }
      return info;
    },
    async logFetchAndClear() {
      const info = await getLogFetchAndClear();
      this.curDice.logs = info;
    },

    async diceConfigGet() {
      const info = await getDiceConfig();
      this.curDice.config = info;
    },

    async diceConfigSet(data: DiceConfig) {
      await setDiceConfig(data);
      if (data.uiPassword) {
        window.location.reload();
      }
      await this.diceConfigGet();
    },

    async diceAdvancedConfigGet() {
      const info: AdvancedConfig = await getAdvancedConfig();
      return info;
    },

    async diceAdvancedConfigSet(data: AdvancedConfig) {
      await setAdvancedConfig(data);
      await this.diceAdvancedConfigGet();
    },

    // async toolOnebot() {
    //   return await backend.post(
    //     urlPrefix + '/tool/onebot',
    //     undefined,
    //     { headers: { token: this.token } }
    //   ) as {
    //     ok: boolean,
    //     ip: string,
    //     errText: string
    //   }
    // },

    setAuthStatusFromError(error: unknown) {
      const status = getResponseStatus(error);
      if (status === 503) {
        this.authStatus = 'maintenance';
        this.runtimeMaintenanceCode = getRuntimeMaintenanceCode(error);
      } else if (!status) {
        const restoreOutcomePending =
          this.runtimeRestoreInProgress ||
          this.runtimeRestoreSubmitting ||
          getPendingRuntimeRestore() !== undefined;
        this.authStatus = restoreOutcomePending ? 'maintenance' : 'offline';
        this.runtimeMaintenanceCode = restoreOutcomePending ? 'RUNTIME_RELOADING' : undefined;
      } else if (status === 403 && this.passwordRequired) {
        this.authStatus = 'password-required';
        this.runtimeMaintenanceCode = undefined;
      } else {
        this.authStatus = 'offline';
        this.runtimeMaintenanceCode = undefined;
      }
      return this.authStatus;
    },

    scheduleRuntimeRestorePoll(delay = 2000) {
      if (runtimeRestorePollTimer !== undefined) window.clearTimeout(runtimeRestorePollTimer);
      runtimeRestorePollTimer = window.setTimeout(() => {
        runtimeRestorePollTimer = undefined;
        void this.pollRuntimeRestoreStatus();
      }, delay);
    },

    stopRuntimeRestorePoll() {
      if (runtimeRestorePollTimer !== undefined) window.clearTimeout(runtimeRestorePollTimer);
      runtimeRestorePollTimer = undefined;
    },

    settleRuntimeRestoreTrackingLoss() {
      this.stopRuntimeRestorePoll();
      clearRuntimeRestoreTracking();
      if (!this.runtimeRestoreInProgress) return;

      const currentStatus = this.runtimeRestoreStatus;
      this.runtimeRestoreStatus = {
        state: 'failed',
        operationId: currentStatus.operationId,
        sourceName: currentStatus.sourceName,
        safetyBackupName: currentStatus.safetyBackupName,
        message: '恢复状态凭证已过期或丢失，无法继续查询任务结果',
      };
      this.runtimeRestorePollingUnavailable = false;
      this.runtimeRestoreRequestId = undefined;
      this.runtimeRestoreRequestSource = undefined;
      void this.trySignIn();
    },

    async pollRuntimeRestoreStatus() {
      await this.refreshRuntimeRestoreStatus();
      if (getRuntimeRestoreTracking()) {
        this.scheduleRuntimeRestorePoll();
      } else {
        this.settleRuntimeRestoreTrackingLoss();
      }
    },

    async refreshRuntimeRestoreStatus(): Promise<BackupRestoreStatus> {
      if (runtimeRestoreStatusRequest) return runtimeRestoreStatusRequest;

      const tracking = getRuntimeRestoreTracking();
      if (!tracking) {
        this.settleRuntimeRestoreTrackingLoss();
        return this.runtimeRestoreStatus;
      }
      const trackingGeneration = tracking.generation;

      runtimeRestoreStatusRequest = (async () => {
        try {
          const result = await getBackupRestoreStatus(tracking.operationId, tracking.statusToken);
          if (
            isRuntimeRestoreTrackingReplaced(
              trackingGeneration,
              tracking.operationId,
              tracking.statusToken,
            )
          ) {
            return this.runtimeRestoreStatus;
          }

          const status: BackupRestoreStatus = {
            ...result.status,
            operationId: result.status.operationId || tracking.operationId,
            sourceName: result.status.sourceName || tracking.sourceName,
            safetyBackupName:
              result.status.safetyBackupName || this.runtimeRestoreStatus.safetyBackupName,
          };
          if (status.operationId && status.operationId !== tracking.operationId) {
            clearRuntimeRestoreTracking();
            this.stopRuntimeRestorePoll();
            this.runtimeRestoreStatus = {
              state: 'failed',
              sourceName: tracking.sourceName,
              message: '恢复服务返回了不匹配的任务状态',
            };
            this.runtimeRestoreRequestId = undefined;
            this.runtimeRestoreRequestSource = undefined;
            void this.trySignIn();
            return this.runtimeRestoreStatus;
          }

          this.runtimeRestorePollingUnavailable = false;
          this.runtimeRestoreStatus = status;
          if (activeBackupRestoreStates.includes(status.state)) {
            this.authStatus = 'maintenance';
            this.runtimeMaintenanceCode = 'RUNTIME_RELOADING';
          }

          if (terminalBackupRestoreStates.includes(status.state)) {
            clearRuntimeRestoreTracking();
            this.stopRuntimeRestorePoll();
            this.runtimeRestoreRequestId = undefined;
            this.runtimeRestoreRequestSource = undefined;
            if (status.state === 'succeeded') {
              if (runtimeRestoreSuccessTimer !== undefined) {
                window.clearTimeout(runtimeRestoreSuccessTimer);
              }
              const operationId = status.operationId;
              runtimeRestoreSuccessTimer = window.setTimeout(() => {
                runtimeRestoreSuccessTimer = undefined;
                if (
                  this.runtimeRestoreStatus.state === 'succeeded' &&
                  this.runtimeRestoreStatus.operationId === operationId
                ) {
                  this.runtimeRestoreStatus = { state: 'idle' };
                }
              }, 5000);
            }
            void this.trySignIn();
          } else if (status.state === 'idle') {
            clearRuntimeRestoreTracking();
            this.stopRuntimeRestorePoll();
            this.runtimeRestoreRequestId = undefined;
            this.runtimeRestoreRequestSource = undefined;
            this.runtimeRestoreStatus = {
              state: 'failed',
              sourceName: tracking.sourceName,
              message: '恢复服务未找到本次任务状态，无法确认恢复结果',
            };
            void this.trySignIn();
          }
          return this.runtimeRestoreStatus;
        } catch (error: unknown) {
          if (
            isRuntimeRestoreTrackingReplaced(
              trackingGeneration,
              tracking.operationId,
              tracking.statusToken,
            )
          ) {
            return this.runtimeRestoreStatus;
          }
          if (!getRuntimeRestoreTracking()) {
            this.settleRuntimeRestoreTrackingLoss();
            return this.runtimeRestoreStatus;
          }

          this.runtimeRestorePollingUnavailable = true;
          if (error instanceof BackupRestoreStatusRequestError && error.status === 403) {
            clearRuntimeRestoreTracking();
            this.stopRuntimeRestorePoll();
            this.runtimeRestoreStatus = {
              state: 'failed',
              sourceName: tracking.sourceName,
              message: '恢复状态凭证无效或已过期，无法继续查询任务结果',
            };
            this.runtimeRestoreRequestId = undefined;
            this.runtimeRestoreRequestSource = undefined;
            void this.trySignIn();
          } else {
            if (this.runtimeRestoreStatus.state === 'idle') {
              this.runtimeRestoreStatus = {
                state: 'pending',
                sourceName: tracking.sourceName,
                message: '服务切换中，正在等待恢复状态',
              };
            }
            if (error instanceof BackupRestoreStatusRequestError && error.status === 503) {
              this.authStatus = 'maintenance';
              this.runtimeMaintenanceCode = error.code;
            }
          }
          return this.runtimeRestoreStatus;
        } finally {
          runtimeRestoreStatusRequest = undefined;
        }
      })();
      return runtimeRestoreStatusRequest;
    },

    async resumeRuntimeRestore(): Promise<BackupRestoreStatus> {
      const pendingRequest = getPendingRuntimeRestore();
      if (pendingRequest) {
        this.runtimeRestoreRequestId = pendingRequest.requestId;
        this.runtimeRestoreRequestSource = pendingRequest.sourceName;
      }

      if (this.runtimeRestoreRecovered) {
        if (getRuntimeRestoreTracking()) {
          this.scheduleRuntimeRestorePoll();
        } else {
          this.settleRuntimeRestoreTrackingLoss();
        }
        return this.runtimeRestoreStatus;
      }
      if (runtimeRestoreResumeRequest) return runtimeRestoreResumeRequest;

      runtimeRestoreResumeRequest = (async () => {
        const tracking = getRuntimeRestoreTracking();
        if (tracking && this.runtimeRestoreStatus.state === 'idle') {
          this.runtimeRestoreStatus = {
            state: 'pending',
            operationId: tracking.operationId,
            sourceName: tracking.sourceName,
          };
        }
        if (tracking) await this.refreshRuntimeRestoreStatus();
        this.runtimeRestoreRecovered = true;
        if (getRuntimeRestoreTracking()) {
          this.scheduleRuntimeRestorePoll();
        } else {
          this.settleRuntimeRestoreTrackingLoss();
        }
        return this.runtimeRestoreStatus;
      })().finally(() => {
        runtimeRestoreResumeRequest = undefined;
      });
      return runtimeRestoreResumeRequest;
    },

    async startRuntimeRestore(name: string) {
      if (this.runtimeMaintenance) throw new Error('Runtime 维护期间不能发起新的恢复任务');
      if (!canTrackRuntimeRestore()) {
        throw new Error('当前浏览器无法保存恢复状态凭证，请允许当前标签页使用会话存储');
      }

      const pendingRequest = getPendingRuntimeRestore();
      const hadPendingRequest = pendingRequest !== undefined;
      if (pendingRequest && pendingRequest.sourceName !== name) {
        throw new Error(
          `备份 ${pendingRequest.sourceName} 的恢复请求结果仍待确认，请先用原备份重试`,
        );
      }
      if (pendingRequest) {
        this.runtimeRestoreRequestId = pendingRequest.requestId;
        this.runtimeRestoreRequestSource = pendingRequest.sourceName;
      } else if (!this.runtimeRestoreRequestId || this.runtimeRestoreRequestSource !== name) {
        this.runtimeRestoreRequestId = createRuntimeRestoreRequestId();
        this.runtimeRestoreRequestSource = name;
      }
      const requestId = this.runtimeRestoreRequestId;
      try {
        rememberPendingRuntimeRestore(requestId, name);
      } catch {
        this.runtimeRestoreRequestId = undefined;
        this.runtimeRestoreRequestSource = undefined;
        throw new Error('当前浏览器无法保存未决恢复请求，未发送恢复操作');
      }

      this.runtimeRestoreSubmitting = true;
      let explicitlyNotQueued = false;
      try {
        const result = await restoreBackup(name, requestId);
        if (!result.result) {
          explicitlyNotQueued = !hadPendingRequest && result.queued !== true;
          throw new Error(result.err || '创建恢复任务失败');
        }
        if (!result.operationId || !result.statusToken) {
          throw new Error('恢复服务未返回状态凭证');
        }
        try {
          promotePendingRuntimeRestore(
            requestId,
            result.operationId,
            result.statusToken,
            result.expiresAt,
            name,
          );
        } catch {
          throw new Error('恢复任务可能已入队，但浏览器无法保存完整状态凭证');
        }
        this.runtimeRestoreRequestId = undefined;
        this.runtimeRestoreRequestSource = undefined;
        this.runtimeRestoreStatus = {
          state: 'pending',
          operationId: result.operationId,
          sourceName: name,
          safetyBackupName: result.safetyBackupName,
        };
        this.runtimeRestorePollingUnavailable = false;
        this.authStatus = 'maintenance';
        this.runtimeMaintenanceCode = 'RUNTIME_RELOADING';
        this.scheduleRuntimeRestorePoll(500);
      } catch (error: unknown) {
        const responseStatus = getResponseStatus(error);
        if (
          !hadPendingRequest &&
          (getRestoreQueuedState(error) === false ||
            responseStatus === 403 ||
            responseStatus === 503)
        ) {
          explicitlyNotQueued = true;
        }
        if (explicitlyNotQueued) {
          clearPendingRuntimeRestore(requestId);
          if (this.runtimeRestoreRequestId === requestId) {
            this.runtimeRestoreRequestId = undefined;
            this.runtimeRestoreRequestSource = undefined;
          }
          const status = getResponseStatus(error);
          if (status === 403 || status === 503) this.setAuthStatusFromError(error);
        } else {
          this.authStatus = 'maintenance';
          this.runtimeMaintenanceCode = getRuntimeMaintenanceCode(error) || 'RUNTIME_RELOADING';
        }

        const message = getRequestErrorMessage(error, '创建恢复任务失败');
        throw new Error(
          explicitlyNotQueued ? message : `恢复请求结果待确认，可使用同一请求 ID 重试。${message}`,
        );
      } finally {
        this.runtimeRestoreSubmitting = false;
      }
    },

    abandonPendingRuntimeRestoreRequest(): boolean {
      if (this.runtimeRestoreSubmitting) return false;

      const pendingRequest = getPendingRuntimeRestore();
      if (!pendingRequest) return false;

      clearPendingRuntimeRestore(pendingRequest.requestId);
      if (getPendingRuntimeRestore()) return false;

      this.runtimeRestoreRequestId = undefined;
      this.runtimeRestoreRequestSource = undefined;
      this.runtimeRestorePollingUnavailable = false;
      if (!getRuntimeRestoreTracking()) void this.trySignIn();
      return true;
    },

    dismissRuntimeRestoreStatus() {
      if (!['failed', 'rolled_back', 'degraded'].includes(this.runtimeRestoreStatus.state)) return;
      this.runtimeRestoreStatus = { state: 'idle' };
      this.runtimeRestorePollingUnavailable = false;
      this.runtimeRestoreRequestId = undefined;
      this.runtimeRestoreRequestSource = undefined;
    },

    async initializeSession(): Promise<AuthStatus> {
      if (this.sessionInitialized) return this.authStatus;
      if (sessionInitializationRequest) return sessionInitializationRequest;

      sessionInitializationRequest = (async () => {
        await this.resumeRuntimeRestore();
        await this.trySignIn();
        this.sessionInitialized = true;
        return this.authStatus;
      })().finally(() => {
        sessionInitializationRequest = undefined;
      });
      return sessionInitializationRequest;
    },

    async signIn(password: string): Promise<boolean> {
      try {
        const ret = await signin(password);
        const token = ret.token;
        this.token = token;
        localStorage.setItem('t', token);
        this.authStatus = 'authenticated';
        this.runtimeMaintenanceCode = undefined;
        return true;
      } catch (error: unknown) {
        const status = getResponseStatus(error);
        if ((status === 400 || status === 403) && this.passwordRequired) {
          this.authStatus = 'password-required';
        } else {
          this.setAuthStatusFromError(error);
        }
        return false;
      }
    },
    async trySignIn(): Promise<boolean> {
      if (signInCheckRequest) return signInCheckRequest;

      signInCheckRequest = (async () => {
        if (this.authStatus === 'checking' || this.authStatus === 'authenticated') {
          this.authStatus = 'checking';
        }
        let saltInfo: { salt: string; passwordRequired?: boolean };
        try {
          saltInfo = (await getSalt()) as { salt: string; passwordRequired?: boolean };
        } catch (error: unknown) {
          this.setAuthStatusFromError(error);
          return false;
        }

        this.salt = saltInfo.salt;
        this.passwordRequired = saltInfo.passwordRequired === true;
        const token = localStorage.getItem('t');
        try {
          await getHello();
          if (token) {
            this.token = token;
            this.authStatus = 'authenticated';
            this.runtimeMaintenanceCode = undefined;
            return true;
          }
        } catch (error: unknown) {
          const status = getResponseStatus(error);
          if (status === 503 || !status) {
            this.setAuthStatusFromError(error);
            return false;
          }
          if (status !== 403) {
            this.setAuthStatusFromError(error);
            return false;
          }
        }

        if (this.passwordRequired) {
          this.authStatus = 'password-required';
          this.runtimeMaintenanceCode = undefined;
          return false;
        }
        return this.signIn('defaultSignin');
      })().finally(() => {
        signInCheckRequest = undefined;
      });
      return signInCheckRequest;
    },
  },
});
