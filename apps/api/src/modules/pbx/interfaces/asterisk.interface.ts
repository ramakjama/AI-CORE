export interface IAsteriskConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  reconnect: boolean;
  reconnectTimeout: number;
  keepalive: boolean;
  keepaliveInterval: number;
}

export interface IAsteriskEvent {
  event: string;
  privilege?: string;
  [key: string]: any;
}

export interface IAsteriskResponse {
  response: string;
  message?: string;
  actionid?: string;
  [key: string]: any;
}

export interface IOriginateOptions {
  channel: string;
  context: string;
  exten: string;
  priority: number;
  application?: string;
  data?: string;
  timeout?: number;
  callerid?: string;
  variable?: Record<string, string>;
  account?: string;
  async?: boolean;
}

export interface IChannelInfo {
  channel: string;
  channelState: string;
  channelStateDesc: string;
  callerIdNum: string;
  callerIdName: string;
  connectedLineNum: string;
  connectedLineName: string;
  accountCode: string;
  context: string;
  exten: string;
  priority: string;
  uniqueId: string;
  linkedId: string;
  duration?: string;
}
