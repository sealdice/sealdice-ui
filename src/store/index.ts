import { id } from 'element-plus/es/locale/index.mjs';
import { getCustomText, saveCustomText } from '~/api/configs';
import { getAdvancedConfig, getDiceConfig, postExec, postMailTest, setAdvancedConfig, setDiceConfig, type DiceConfig } from '~/api/dice';
import { getConnectionList, postAddDingtalk, postAddDiscord, postAddDodo, postAddGocq, postAddGocqSeparate, postAddKook, postAddLagrange, postAddMinecraft, postAddOfficialQQ, postAddOnebot11ReverseWs, postAddRed, postAddSatori, postaddSealChat, postAddSlack, postAddTelegram, postAddWalleQ, } from '~/api/im_connections';
import { getBaseInfo, getLogFetchAndClear, getPreInfo } from '~/api/others';
import { backend } from '~/backend'

import type { addImConnectionForm } from '~/components/PageConnectInfoItems.vue'
import type {
  AdvancedConfig,
  BanConfig,
  HelpDoc,
  HelpTextItem,
  HelpTextItemQuery,
  JsScriptInfo,
} from "~/type.d.ts";
export enum goCqHttpStateCode {
  Init = 0,
  InLogin = 1,
  InLoginQrCode = 2,
  InLoginBar = 3,
  InLoginVerifyCode = 6,
  InLoginDeviceLock = 7,
  LoginSuccessed = 10,
  LoginFailed = 11,
  Closed = 20
}

export interface AdapterQQ {
  DiceServing: boolean
  connectUrl: string;
  curLoginFailedReason: string
  curLoginIndex: number
  loginState: goCqHttpStateCode
  inPackGoCqHttpLastRestricted: number
  inPackGoCqHttpProtocol: number
  inPackGoCqHttpAppVersion: string,
  implementation: string
  useInPackGoCqhttp: boolean;
  goCqHttpLoginVerifyCode: string;
  goCqHttpLoginDeviceLockUrl: string;
  ignoreFriendRequest: boolean;
  goCqHttpSmsNumberTip: string;
  useSignServer: boolean;
  signServerConfig: any;
  redVersion: string;
  host: string;
  port: number;
  appID: number;
  isReverse: boolean;
  reverseAddr: string;
  builtinMode: 'gocq' | 'lagrange'
}

interface TalkLogItem {
  name?: string
  content: string
  isSeal?: boolean
  mode: 'private' | 'group'
}

export interface DiceConnection {
  id: string;
  state: number;
  platform: string;
  workDir: string;
  enable: boolean;
  protocolType: string;
  nickname: string;
  userId: number;
  groupNum: number;
  cmdExecutedNum: number;
  cmdExecutedLastTime: number;
  onlineTotalTime: number;

  adapter: AdapterQQ;
}

export const urlPrefix = 'sd-api'

interface DiceServer {
  config: any
  customTextsHelpInfo: {
    [k: string]: {
      [k: string]: {
        filename: string[],
        origin: (string[])[],
        vars: string[],
        modified: boolean,
        notBuiltin: boolean,
        topOrder: number,
        subType: string,
        extraText: string,
      }
    }
  }
  customTexts: { [k: string]: { [k: string]: (string[])[] } }
  previewInfo: { [key:string]: { version: string, textV2: string, textV1: string, presetExists: boolean, errV1: string, errV2: string } }
  logs: { level: string, ts: number, caller: string, msg: string }[]
  conns: DiceConnection[]
  baseInfo: DiceBaseInfo
  qrcodes: { [key: string]: string }
}

interface DiceBaseInfo {
  appChannel: string
  version: string
  versionSimple: string
  versionNew: string
  versionNewNote: string
  versionCode: number
  versionNewCode: number
  memoryAlloc: number
  memoryUsedSys: number
  uptime: number
  OS: string
  arch: string
  justForTest: boolean
  containerMode: boolean
}

export type ResourceType = 'image' | 'audio' | 'video'

export interface Resource {
  type: ResourceType | 'unknown',
  name: string
  ext: string,
  path: string,
  size: number,
}


export const useStore = defineStore('main', {
  state: () => {
    return {
      salt: '',
      token: '',
      index: 0,
      canAccess: false,
      diceServers: [] as DiceServer[],

      talkLogs: [
        {
          content: '海豹已就绪。此界面可视为私聊窗口。\n设置中添加 Master 名为 UI:1001\n即可在此界面使用 master 命令!',
          isSeal: true,
          mode: 'private',
        },
        {
          content: '海豹已就绪。此界面可视为群聊窗口。\n设置中添加 Master 名为 UI:1002\n即可在此界面使用 master 命令!',
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
      ] as TalkLogItem[]
    }
  },
  getters: {
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
          config: {}
        })
      }

      return this.diceServers[this.index]
    }

  },
  actions: {
    async customTextSave(category: string) {
      await saveCustomText(category,this.curDice.customTexts[category])
    },

    async getPreInfo() {
      const info: {
        testMode: boolean
      } = await getPreInfo()
      return info
    },

    async getBaseInfo() {
      const info = await getBaseInfo()
      if (!document.title.includes('-')) {
        if ((info).extraTitle && (info).extraTitle !== '') {
          document.title = `${(info).extraTitle} - ${document.title}`;
        }
      }
      this.curDice.baseInfo = info;
      return info
    },

    async getCustomText() {
      const data = await getCustomText()
      this.curDice.customTexts = data.texts;
      this.curDice.customTextsHelpInfo = data.helpInfo;
      this.curDice.previewInfo = data.previewInfo;
      return data
    },

    async getImConnections() {
      const info = await getConnectionList()
      this.diceServers[this.index].conns = info;
      return info
    },

    async addImConnection(form: addImConnectionForm ) {
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
        signServerUrl,
        signServerVersion,
        reverseAddr,
        onlyQQGuild,
        platform } = form

      let info = null
      switch (accountType) {
        //QQ
        case 0:
          if (implementation === 'gocq') {
            info = await postAddGocq(account,password,protocol,appVersion,useSignServer,signServerConfig)
          } else if (implementation === 'walle-q') {
            info = await postAddWalleQ( account, password, protocol )
          }
          break
        case 1:
          info = await postAddDiscord( token.trim(), proxyURL, reverseProxyUrl, reverseProxyCDNUrl )
          break
        case 2:
          info = await postAddKook( token.trim() )
          break
        case 3:
          info = await postAddTelegram(token.trim(),proxyURL)
          break
        case 4:
          info = await postAddMinecraft(url)
          break
        case 5:
          info = await postAddDodo(clientID.trim(),token.trim())
          break
        case 6: {
          // onebot11 正向
          let realUrl:string = connectUrl.trim()
          if (!realUrl.startsWith('ws://') && !realUrl.startsWith('wss://')) {
            realUrl = `ws://${realUrl}`
          }
          info = await postAddGocqSeparate(relWorkDir, realUrl, accessToken, account)
          break
        }
        case 7:
          info = await postAddRed( host, port, token)
          break
        case 8:
          info = await postAddDingtalk( clientID, token, nickname, robotCode)
          break
        case 9:
          info = await postAddSlack(botToken, appToken)
          break;
        case 10:
          info = await postAddOfficialQQ( Number(appID), appSecret, token,onlyQQGuild)
          break
        case 11:
          info = await postAddOnebot11ReverseWs(account, reverseAddr?.trim())
          break
        case 13:
          info = await postaddSealChat(url.trim(), token.trim())
          break
        case 14:
          info = await postAddSatori(platform, host, port, token)
          break
        case 15:{
          let version = ""
          if (signServerUrl === "sealdice" || signServerUrl === "lagrange") {
            version = signServerVersion
          }
          info = await postAddLagrange( account, signServerUrl, version )
        }
        break
      }
      return info as DiceConnection
    },
    async logFetchAndClear() {
      const info = await getLogFetchAndClear()
      this.curDice.logs = info;
    },

    async diceConfigGet() {
      const info = await getDiceConfig()
      this.curDice.config = info;
    },

    async diceConfigSet(data: DiceConfig) {
      await setDiceConfig(data)
      await this.diceConfigGet()
    },

    async diceAdvancedConfigGet() {
      const info: AdvancedConfig = await getAdvancedConfig()
      return info
    },

    async diceAdvancedConfigSet(data: AdvancedConfig) {
      await setAdvancedConfig(data)
      await this.diceAdvancedConfigGet()
    },

    // ban list相关
    async banConfigGet() {
      const info: BanConfig = await backend.get(urlPrefix + '/banconfig/get')
      return info
    },

    async banConfigSet(data: any) {
      const info = await backend.post(urlPrefix + '/banconfig/set', data)
      return info as any
    },

    async banConfigMapGet() {
      const info = await backend.get(urlPrefix + '/banconfig/list')
      return info as any
    },

    async banConfigMapDeleteOne(data: any) {
      const info = await backend.post(urlPrefix + '/banconfig/map_delete_one', data)
      return info as any
    },

    async banConfigMapAddOne(id: string, rank: number, name: string, reason: string) {
      const info = await backend.post(urlPrefix + '/banconfig/map_add_one', {
        ID: id,
        rank,
        name,
        reasons: reason ? [reason] : []
      })
      return info as any
    },

    async banUpload({ form }: { form: FormData }): Promise<{ result: true } | {
      result: false,
      err: string
    }> {
      return await backend.post(urlPrefix + '/banconfig/import', form, { headers: { token: this.token, "Content-Type": "multipart/form-data" } })
    },

    // 群组列表
    async groupList() {
      const info = await backend.get(urlPrefix + '/group/list')
      return info as any
    },

    async groupSetOne(data: any) {
      const info = await backend.post(urlPrefix + '/group/set_one', data)
      return info as any
    },

    async setGroupQuit(data: any) {
      const info = await backend.post(urlPrefix + '/group/quit_one', data)
      return info
    },

    // 牌堆
    async deckList() {
      const info = await backend.get(urlPrefix + '/deck/list')
      return info as any
    },

    async deckReload() {
      const info = await backend.post(urlPrefix + '/deck/reload')
      return info as any
    },

    async deckSetEnable({ index, enable }: any) {
      const info = await backend.post(urlPrefix + '/deck/enable', { index, enable })
      return info as any
    },

    async deckDelete({ index }: any) {
      const info = await backend.post(urlPrefix + '/deck/delete', { index })
      return info as any
    },

    async deckUpload({ form }: any) {
      const info = await backend.post(urlPrefix + '/deck/upload', form, { headers: { "Content-Type": "multipart/form-data" } })
      return info as any
    },

    async deckCheckUpdate({ index }: any) {
      const info: { result: false, err: string } | {
        result: true,
        old: string,
        new: string,
        format: 'json' | 'yaml' | 'toml',
        tempFileName: string,
      } = await backend.post(urlPrefix + '/deck/check_update', { index })
      return info
    },

    async deckUpdate({ index, tempFileName }: any) {
      const res: { result: false, err: string } | {
        result: true,
      } = await backend.post(urlPrefix + '/deck/update', { index, tempFileName })
      return res
    },

    async jsStatus(): Promise<boolean> {
      const resp: { result: true, status: boolean } | {
        result: false, err: string
      } = await backend.get(urlPrefix + '/js/status' )
      if (resp.result) {
        return resp.status
      }
      return false
    },
    async jsList(): Promise<JsScriptInfo[]> {
      return await backend.get(urlPrefix + '/js/list', { headers: { token: this.token } }) as any
    },
    async jsGetConfig() {
      return await backend.get(urlPrefix + '/js/get_configs', { headers: { token: this.token } }) as any
    },
    async jsSetConfig(configs: any) {
      return await backend.post(urlPrefix + '/js/set_configs', configs) as any
    },
    async jsResetConfig(pluginName: any, key: any) {
      return await backend.post(urlPrefix + '/js/reset_config', { pluginName, key }) as any
    },
    async jsDeleteUnusedConfig(pluginName: any, key: any) {
      return await backend.post(urlPrefix + '/js/delete_unused_config', { pluginName, key }) as any
    },
    async jsGetRecord() {
      return await backend.get(urlPrefix + '/js/get_record',
        { headers: { token: this.token } }
      ) as {
        outputs: string[]
      }
    },
    async jsUpload({ form }: any) {
      const info = await backend.post(urlPrefix + '/js/upload', form,  { headers: { "Content-Type": "multipart/form-data" } })
      return info as any
    },
    async jsDelete({ index }: any) {
      const info = await backend.post(urlPrefix + '/js/delete', { index })
      return info as any
    },
    async jsReload() {
      return await backend.post(
        urlPrefix + '/js/reload',
        undefined,
        { headers: { token: this.token } }
      ) as any
    },
    async jsShutdown() {
      return await backend.post(
        urlPrefix + '/js/shutdown',
        undefined,
        { headers: { token: this.token } }
      ) as any
    },
    async jsExec(code: string) {
      return await backend.post(
        urlPrefix + '/js/execute',
        { value: code } ,
      ) as {
        ret: any,
        outputs: string[],
        err: string,
      }
    },
    async jsEnable(body: any) {
      return await backend.post(
        urlPrefix + '/js/enable',
        body,
        { headers: { token: this.token } }
      ) as any
    },
    async jsDisable(body: any) {
      return await backend.post(
        urlPrefix + '/js/disable',
        body,
        { headers: { token: this.token } }
      ) as any
    },

    async jsCheckUpdate({ index }: any) {
      const info: { result: false, err: string } | {
        result: true,
        old: string,
        new: string,
        tempFileName: string,
      } = await backend.post(urlPrefix + '/js/check_update', { index })
      return info
    },

    async jsUpdate({ index, tempFileName }: any) {
      const res: { result: false, err: string } | {
        result: true,
      } = await backend.post(urlPrefix + '/js/update', { index, tempFileName })
      return res
    },

    async toolOnebot() {
      return await backend.post(
        urlPrefix + '/tool/onebot',
        undefined,
        { headers: { token: this.token } }
      ) as {
        ok: boolean,
        ip: string,
        errText: string
      }
    },

    async signIn(password: string) {
      try {
        const ret = await backend.post(urlPrefix + '/signin', { password })
        const token = (ret as any).token
        this.token = token
        backend.defaults.headers.common['token'] = token
        localStorage.setItem('t', token)
        this.canAccess = true
      } catch {
        this.canAccess = false
      }
    },

    async checkSecurity(): Promise<boolean> {
      return (await backend.get(urlPrefix + '/checkSecurity') as any).isOk
    },

    async trySignIn(): Promise<boolean> {
      this.salt = (await backend.get(urlPrefix + '/signin/salt') as any).salt
      const token = localStorage.getItem('t')
      try {
        await backend.get(urlPrefix + '/hello', {
          headers: { token: token as string }
        })
        this.token = token as string
        backend.defaults.headers.common['token'] = this.token
        this.canAccess = true
      } catch (e) {
        this.canAccess = false
        // 试图做一次登录，以获取token
        await this.signIn('defaultSignin')
      }
      return this.token != ''
    },

    async helpDocTree(): Promise<{ result: true, data: HelpDoc[] } | { result: false, err?: string }> {
      return await backend.get(urlPrefix + '/helpdoc/tree', { headers: { token: this.token } })
    },

    async helpDocReload(): Promise<{ result: true } | { result: false, err?: string }> {
      return await backend.post(urlPrefix + '/helpdoc/reload', undefined,{ headers: { token: this.token } })
    },

    async helpDocUpload(form: any): Promise<{ result: true } | { result: false, err?: string }> {
      return await backend.post(urlPrefix + '/helpdoc/upload', form, { headers: { token: this.token, "Content-Type": "multipart/form-data" } })
    },

    async helpDocDelete(keys: string[]): Promise<{ result: true } | { result: false, err?: string }> {
      return await backend.post(urlPrefix + '/helpdoc/delete', { keys: keys }, { headers: { token: this.token } })
    },

    async helpGetTextItemPage(param: HelpTextItemQuery): Promise<{ result: true; total: number; data: HelpTextItem[] } | { result: false; err?: string }> {
      return await backend.post(urlPrefix + "/helpdoc/textitem/get_page", param)
    },

    async helpGetConfig(): Promise<{ aliases: { [key: string]: string[] } }> {
      return await backend.get(urlPrefix + "/helpdoc/config", { headers: { token: this.token } })
    },

    async helpSetConfig(param: { aliases: { [key: string]: string[] } }): Promise<{ result: true } | { result: false, err?: string }> {
      return await backend.post(urlPrefix + "/helpdoc/config", param, { headers: { token: this.token } })
    },


    async resourceList(type: ResourceType) {
      const info: { result: false, err: string } | {
        result: true,
        total?: number,
        data: Resource[]
      } = await backend.get(urlPrefix + '/resource/page', {
        headers: {
          token: this.token
        },
        params: {
          type
        }
      })
      return info
    },

    async resourceUpload({ form }: any) {
      const info: { result: false, err: string } | { result: true }
          = await backend.post(urlPrefix + '/resource', form, {
        headers: {
          token: this.token,
          "Content-Type": "multipart/form-data"
        },
      })
      return info
    },

    async resourceDelete(path: string) {
      const info: { result: false, err: string } | { result: true }
          = await backend.delete(urlPrefix + '/resource', {
        headers: {
          token: this.token
        },
        params: {
          path
        }
      })
      return info
    },

    async resourceData(path: string, thumbnail: boolean = false)  {
      const response = await backend.get(urlPrefix + '/resource/data', {
        params: { path, thumbnail },
        responseType: "blob",
      })
      return response as unknown as Blob;
    }
  }
})
