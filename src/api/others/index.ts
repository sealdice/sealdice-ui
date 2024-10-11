import request from "..";

export function getPreInfo() {
    return request<{
        testMode: boolean
      }>('get','preInfo',null,'form',{timeout:5000})
}

export function getBaseInfo() {
    return request<DiceBaseInfo>('get','baseInfo',null,'form',{timeout:5000})
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
    extraTitle?: string
  }