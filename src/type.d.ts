export interface JsScriptInfo {
  name: string;
  enable: boolean;
  version: string;
  author: string;
  license: string;
  homepage: string;
  desc: string;
  grant?: string;
  updateTime: number;
  installTime: number;
  errText: string;
  filename: string;
  updateUrls?: string[];
  official: boolean;
  builtin: boolean;
  builtinUpdated: boolean;
}

export interface JsPluginConfigItem {
  key: string;
  type: string;
  defaultValue: any;
  value: any;
  option: any[];
  deprecated: boolean;
  description: string;
}

export interface JsPluginConfig {
  pluginName: string;
  configs: JsPluginConfigItem[];
}

export interface HelpDocData {
  helpInfo: HelpDocHelpInfo;
  docTree: HelpDoc[];
}

export interface HelpDocHelpInfo {
  [key: string]: number;
}

export interface HelpDoc {
  name: string;
  path: string;
  group: string;
  type: '.json' | '.xlsx';
  isDir: boolean;
  loadStatus: 0 | 1 | 2;
  deleted: boolean;

  children: HelpDoc[] | null;
}

export interface HelpTextItemQuery {
  pageNum: number;
  pageSize: number;
  total: number;
  id?: number;
  group?: string;
  from?: string;
  title?: string;
}

export interface HelpTextItem {
  id: number;
  group: string;
  from: string;
  title: string;
  content: string;
  packageName: string;
  keyWords: string;
}

export interface AdvancedConfig {
  show: boolean;
  enable: boolean;
  storyLogBackendUrl: string;
  storyLogApiVersion: string;
  storyLogBackendToken: string;
  storeBackendUrl: string;
}

export interface BanConfig {
  banBehaviorRefuseReply: boolean;
  banBehaviorRefuseInvite: boolean;
  banBehaviorQuitLastPlace: boolean;
  banBehaviorQuitPlaceImmediately: boolean;
  banBehaviorQuitIfAdmin: boolean;
  banBehaviorQuitIfAdminSilentIfNotAdmin: boolean;

  thresholdWarn: number;
  thresholdBan: number;
  scoreGroupMuted: number;
  scoreGroupKicked: number;
  scoreTooManyCommand: number;
  scoreReducePerMinute: number;
  jointScorePercentOfGroup: number;
  jointScorePercentOfInviter: number;
}

export type StoreElemType = 'plugin' | 'deck'; // | 'reply' | 'helpdoc';

export interface StoreElem {
  namespace: string;
  id: string;
  version: string;
  key: string;
  installed: boolean;

  source: 'official' | string;
  type: StoreElemType;
  ext: '.js' | '.toml' | '.json' | '.jsonc' | '.yaml' | '.xlsx' | string;

  name: string;
  authors: string[];
  desc: string;
  license: string;
  releaseTime: number;
  updateTime: number;
  tags?: string[];
  rate?: number;
  extra?: Map<string, string>;
  downloadNum?: number;
  downloadUrl?: string;
  hash?: Map<string, string>;
  homePage?: string;
  sealVersion?: string;
  dependencies?: Map<string, string>;
}

export type StoreBackendType = 'official' | 'trusted' | 'extra';

export interface StoreBackend {
  id: string;
  name: string;
  url: string;
  type: StoreBackendType;
  health: boolean;
  announcement: string;
}
