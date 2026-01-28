import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as AsteriskManager from 'asterisk-manager';
import {
  IAsteriskConfig,
  IAsteriskEvent,
  IAsteriskResponse,
  IOriginateOptions,
  IChannelInfo,
} from '../interfaces/asterisk.interface';

@Injectable()
export class AsteriskService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AsteriskService.name);
  private ami: any;
  private connected = false;
  private reconnectTimer: NodeJS.Timeout;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly config: IAsteriskConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.config = {
      host: this.configService.get<string>('ASTERISK_HOST', 'localhost'),
      port: this.configService.get<number>('ASTERISK_PORT', 5038),
      username: this.configService.get<string>('ASTERISK_USERNAME', 'admin'),
      password: this.configService.get<string>('ASTERISK_PASSWORD', 'secret'),
      reconnect: true,
      reconnectTimeout: 5000,
      keepalive: true,
      keepaliveInterval: 30000,
    };
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      this.ami = new AsteriskManager(
        this.config.port,
        this.config.host,
        this.config.username,
        this.config.password,
        true,
      );

      this.setupEventListeners();

      await new Promise<void>((resolve, reject) => {
        this.ami.once('connect', () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          this.logger.log('Connected to Asterisk AMI');
          this.eventEmitter.emit('pbx.asterisk.connected');
          resolve();
        });

        this.ami.once('error', (error: Error) => {
          this.logger.error('Failed to connect to Asterisk AMI', error);
          reject(error);
        });
      });

      if (this.config.keepalive) {
        this.startKeepalive();
      }
    } catch (error) {
      this.logger.error('Error connecting to Asterisk AMI', error);
      this.scheduleReconnect();
    }
  }

  private setupEventListeners(): void {
    this.ami.on('managerevent', (event: IAsteriskEvent) => {
      this.handleEvent(event);
    });

    this.ami.on('close', () => {
      this.connected = false;
      this.logger.warn('Connection to Asterisk AMI closed');
      this.eventEmitter.emit('pbx.asterisk.disconnected');

      if (this.config.reconnect) {
        this.scheduleReconnect();
      }
    });

    this.ami.on('error', (error: Error) => {
      this.logger.error('Asterisk AMI error', error);
      this.eventEmitter.emit('pbx.asterisk.error', { error });
    });

    this.ami.on('response', (response: IAsteriskResponse) => {
      this.logger.debug('AMI Response', response);
    });
  }

  private handleEvent(event: IAsteriskEvent): void {
    const eventType = event.event;
    this.logger.debug(`AMI Event: ${eventType}`, event);

    switch (eventType) {
      case 'Newchannel':
        this.eventEmitter.emit('pbx.call.newchannel', event);
        break;
      case 'Newstate':
        this.eventEmitter.emit('pbx.call.newstate', event);
        break;
      case 'Dial':
        this.eventEmitter.emit('pbx.call.dial', event);
        break;
      case 'DialBegin':
        this.eventEmitter.emit('pbx.call.dialbegin', event);
        break;
      case 'DialEnd':
        this.eventEmitter.emit('pbx.call.dialend', event);
        break;
      case 'Bridge':
        this.eventEmitter.emit('pbx.call.bridge', event);
        break;
      case 'BridgeEnter':
        this.eventEmitter.emit('pbx.call.bridgeenter', event);
        break;
      case 'BridgeLeave':
        this.eventEmitter.emit('pbx.call.bridgeleave', event);
        break;
      case 'Hangup':
        this.eventEmitter.emit('pbx.call.hangup', event);
        break;
      case 'Join':
        this.eventEmitter.emit('pbx.queue.join', event);
        break;
      case 'Leave':
        this.eventEmitter.emit('pbx.queue.leave', event);
        break;
      case 'AgentConnect':
        this.eventEmitter.emit('pbx.queue.agentconnect', event);
        break;
      case 'AgentComplete':
        this.eventEmitter.emit('pbx.queue.agentcomplete', event);
        break;
      case 'QueueMemberStatus':
        this.eventEmitter.emit('pbx.queue.memberstatus', event);
        break;
      case 'QueueMemberAdded':
        this.eventEmitter.emit('pbx.queue.memberadded', event);
        break;
      case 'QueueMemberRemoved':
        this.eventEmitter.emit('pbx.queue.memberremoved', event);
        break;
      case 'Hold':
        this.eventEmitter.emit('pbx.call.hold', event);
        break;
      case 'Unhold':
        this.eventEmitter.emit('pbx.call.unhold', event);
        break;
      case 'MusicOnHold':
        this.eventEmitter.emit('pbx.call.musiconhold', event);
        break;
      default:
        this.eventEmitter.emit('pbx.asterisk.event', event);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached. Giving up.');
      this.eventEmitter.emit('pbx.asterisk.reconnect.failed');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.config.reconnectTimeout * this.reconnectAttempts, 60000);

    this.logger.warn(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startKeepalive(): void {
    setInterval(() => {
      if (this.connected) {
        this.ping().catch((error) => {
          this.logger.error('Keepalive ping failed', error);
        });
      }
    }, this.config.keepaliveInterval);
  }

  private async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.ami && this.connected) {
      await new Promise<void>((resolve) => {
        this.ami.disconnect(() => {
          this.connected = false;
          this.logger.log('Disconnected from Asterisk AMI');
          resolve();
        });
      });
    }
  }

  async ping(): Promise<void> {
    return this.sendAction('Ping');
  }

  async makeCall(from: string, to: string, variables?: Record<string, string>): Promise<string> {
    const actionId = this.generateActionId();

    const options: IOriginateOptions = {
      channel: `PJSIP/${from}`,
      context: 'from-internal',
      exten: to,
      priority: 1,
      timeout: 30000,
      callerid: from,
      variable: variables || {},
      async: true,
    };

    const response = await this.sendAction('Originate', options, actionId);

    if (response.response === 'Success') {
      this.logger.log(`Call originated from ${from} to ${to}`);
      return actionId;
    } else {
      throw new Error(`Failed to originate call: ${response.message}`);
    }
  }

  async hangupCall(channel: string): Promise<void> {
    await this.sendAction('Hangup', {
      channel,
    });
    this.logger.log(`Call hangup requested for channel ${channel}`);
  }

  async transferCall(channel: string, target: string, type: 'blind' | 'attended' = 'blind'): Promise<void> {
    if (type === 'blind') {
      await this.sendAction('Redirect', {
        channel,
        exten: target,
        context: 'from-internal',
        priority: 1,
      });
    } else {
      await this.sendAction('Atxfer', {
        channel,
        exten: target,
      });
    }
    this.logger.log(`Call transfer requested for channel ${channel} to ${target}`);
  }

  async holdCall(channel: string): Promise<void> {
    await this.sendAction('Hold', {
      channel,
    });
    this.logger.log(`Call hold requested for channel ${channel}`);
  }

  async unholdCall(channel: string): Promise<void> {
    await this.sendAction('Unhold', {
      channel,
    });
    this.logger.log(`Call unhold requested for channel ${channel}`);
  }

  async recordCall(channel: string, filename: string, format = 'wav'): Promise<void> {
    await this.sendAction('MixMonitor', {
      channel,
      file: `${filename}.${format}`,
      options: 'b',
    });
    this.logger.log(`Call recording started for channel ${channel}`);
  }

  async stopRecordCall(channel: string): Promise<void> {
    await this.sendAction('StopMixMonitor', {
      channel,
    });
    this.logger.log(`Call recording stopped for channel ${channel}`);
  }

  async getChannelInfo(channel: string): Promise<IChannelInfo> {
    const response = await this.sendAction('CoreShowChannel', {
      channel,
    });

    return {
      channel: response.channel,
      channelState: response.channelstate,
      channelStateDesc: response.channelstatedesc,
      callerIdNum: response.calleridnum,
      callerIdName: response.calleridname,
      connectedLineNum: response.connectedlinenum,
      connectedLineName: response.connectedlinename,
      accountCode: response.accountcode,
      context: response.context,
      exten: response.exten,
      priority: response.priority,
      uniqueId: response.uniqueid,
      linkedId: response.linkedid,
      duration: response.duration,
    };
  }

  async getActiveChannels(): Promise<IChannelInfo[]> {
    return new Promise((resolve, reject) => {
      const channels: IChannelInfo[] = [];

      this.ami.action(
        {
          action: 'CoreShowChannels',
        },
        (error: Error, response: any) => {
          if (error) {
            return reject(error);
          }

          if (response.events) {
            for (const event of response.events) {
              if (event.event === 'CoreShowChannel') {
                channels.push({
                  channel: event.channel,
                  channelState: event.channelstate,
                  channelStateDesc: event.channelstatedesc,
                  callerIdNum: event.calleridnum,
                  callerIdName: event.calleridname,
                  connectedLineNum: event.connectedlinenum,
                  connectedLineName: event.connectedlinename,
                  accountCode: event.accountcode,
                  context: event.context,
                  exten: event.exten,
                  priority: event.priority,
                  uniqueId: event.uniqueid,
                  linkedId: event.linkedid,
                  duration: event.duration,
                });
              }
            }
          }

          resolve(channels);
        },
      );
    });
  }

  async addQueueMember(queue: string, interface_: string, penalty = 0): Promise<void> {
    await this.sendAction('QueueAdd', {
      queue,
      interface: interface_,
      penalty,
    });
    this.logger.log(`Added member ${interface_} to queue ${queue}`);
  }

  async removeQueueMember(queue: string, interface_: string): Promise<void> {
    await this.sendAction('QueueRemove', {
      queue,
      interface: interface_,
    });
    this.logger.log(`Removed member ${interface_} from queue ${queue}`);
  }

  async pauseQueueMember(queue: string, interface_: string, paused = true, reason?: string): Promise<void> {
    await this.sendAction('QueuePause', {
      queue,
      interface: interface_,
      paused: paused ? 'true' : 'false',
      reason: reason || '',
    });
    this.logger.log(`${paused ? 'Paused' : 'Unpaused'} member ${interface_} in queue ${queue}`);
  }

  async getQueueStatus(queue?: string): Promise<any> {
    return this.sendAction('QueueStatus', queue ? { queue } : {});
  }

  isConnected(): boolean {
    return this.connected;
  }

  private sendAction(action: string, parameters: Record<string, any> = {}, actionId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        return reject(new Error('Not connected to Asterisk AMI'));
      }

      const actionData: any = {
        action,
        ...parameters,
      };

      if (actionId) {
        actionData.actionid = actionId;
      }

      this.ami.action(actionData, (error: Error, response: any) => {
        if (error) {
          this.logger.error(`Action ${action} failed`, error);
          return reject(error);
        }

        if (response.response === 'Error') {
          return reject(new Error(response.message || 'Action failed'));
        }

        resolve(response);
      });
    });
  }

  private generateActionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
