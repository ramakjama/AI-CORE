/**
 * WebRTC Peer Connection Manager
 * Wraps SimplePeer for easy WebRTC peer-to-peer communication
 */

import SimplePeer from 'simple-peer';

export interface PeerConnectionConfig {
  initiator: boolean;
  stream?: MediaStream;
  trickle?: boolean;
  config?: RTCConfiguration;
}

export interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: SimplePeer.SignalData;
}

export interface PeerConnectionEvents {
  onSignal: (signal: SignalData) => void;
  onStream: (stream: MediaStream) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onError: (error: Error) => void;
  onData?: (data: any) => void;
}

export class PeerConnection {
  private peer: SimplePeer.Instance | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private isAudioMuted: boolean = false;
  private isVideoDisabled: boolean = false;
  private events: PeerConnectionEvents;

  constructor(events: PeerConnectionEvents) {
    this.events = events;
  }

  /**
   * Create a peer connection
   */
  async create(config: PeerConnectionConfig): Promise<void> {
    try {
      this.localStream = config.stream || null;

      this.peer = new SimplePeer({
        initiator: config.initiator,
        stream: config.stream,
        trickle: config.trickle !== false,
        config: config.config || {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });

      this.setupPeerListeners();
    } catch (error) {
      this.events.onError(error as Error);
      throw error;
    }
  }

  /**
   * Setup peer event listeners
   */
  private setupPeerListeners(): void {
    if (!this.peer) return;

    this.peer.on('signal', (data: SimplePeer.SignalData) => {
      const signalType = this.determineSignalType(data);
      this.events.onSignal({
        type: signalType,
        data,
      });
    });

    this.peer.on('stream', (stream: MediaStream) => {
      this.remoteStream = stream;
      this.events.onStream(stream);
    });

    this.peer.on('connect', () => {
      this.events.onConnect();
    });

    this.peer.on('close', () => {
      this.events.onDisconnect();
    });

    this.peer.on('error', (error: Error) => {
      console.error('Peer connection error:', error);
      this.events.onError(error);
    });

    if (this.events.onData) {
      this.peer.on('data', (data: Uint8Array) => {
        try {
          const decoded = new TextDecoder().decode(data);
          const parsed = JSON.parse(decoded);
          this.events.onData?.(parsed);
        } catch (error) {
          console.error('Error parsing peer data:', error);
        }
      });
    }
  }

  /**
   * Determine signal type from signal data
   */
  private determineSignalType(data: SimplePeer.SignalData): 'offer' | 'answer' | 'ice-candidate' {
    if ('type' in data) {
      if (data.type === 'offer') return 'offer';
      if (data.type === 'answer') return 'answer';
    }
    return 'ice-candidate';
  }

  /**
   * Handle incoming signal
   */
  signal(signal: SimplePeer.SignalData): void {
    try {
      if (this.peer && !this.peer.destroyed) {
        this.peer.signal(signal);
      }
    } catch (error) {
      console.error('Error handling signal:', error);
      this.events.onError(error as Error);
    }
  }

  /**
   * Get user media stream
   */
  async getUserMedia(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      throw new Error('Failed to access camera/microphone. Please check permissions.');
    }
  }

  /**
   * Get display media (screen share)
   */
  async getDisplayMedia(constraints: DisplayMediaStreamOptions = { video: true, audio: false }): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      return stream;
    } catch (error) {
      console.error('Error getting display media:', error);
      throw new Error('Failed to access screen sharing.');
    }
  }

  /**
   * Replace video track (for screen sharing)
   */
  async replaceVideoTrack(newStream: MediaStream): Promise<void> {
    if (!this.peer || this.peer.destroyed) return;

    const videoTrack = newStream.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      // Get the sender for video track
      const senders = (this.peer as any)._pc?.getSenders() || [];
      const videoSender = senders.find((sender: RTCRtpSender) =>
        sender.track?.kind === 'video'
      );

      if (videoSender) {
        await videoSender.replaceTrack(videoTrack);
      }
    } catch (error) {
      console.error('Error replacing video track:', error);
      throw error;
    }
  }

  /**
   * Mute/unmute audio
   */
  toggleAudio(): boolean {
    if (!this.localStream) return false;

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    this.isAudioMuted = !this.isAudioMuted;
    return this.isAudioMuted;
  }

  /**
   * Enable/disable video
   */
  toggleVideo(): boolean {
    if (!this.localStream) return false;

    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    this.isVideoDisabled = !this.isVideoDisabled;
    return this.isVideoDisabled;
  }

  /**
   * Send data to peer
   */
  sendData(data: any): void {
    if (this.peer && !this.peer.destroyed) {
      try {
        const encoded = new TextEncoder().encode(JSON.stringify(data));
        this.peer.send(encoded);
      } catch (error) {
        console.error('Error sending data:', error);
      }
    }
  }

  /**
   * Get connection stats
   */
  async getStats(): Promise<RTCStatsReport | null> {
    if (!this.peer || this.peer.destroyed) return null;

    try {
      const pc = (this.peer as any)._pc as RTCPeerConnection;
      if (pc && pc.getStats) {
        return await pc.getStats();
      }
    } catch (error) {
      console.error('Error getting stats:', error);
    }

    return null;
  }

  /**
   * Stop all tracks in local stream
   */
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    try {
      this.stopLocalStream();

      if (this.peer && !this.peer.destroyed) {
        this.peer.destroy();
      }

      this.peer = null;
      this.remoteStream = null;
    } catch (error) {
      console.error('Error disconnecting peer:', error);
    }
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Get audio muted state
   */
  isAudioMutedState(): boolean {
    return this.isAudioMuted;
  }

  /**
   * Get video disabled state
   */
  isVideoDisabledState(): boolean {
    return this.isVideoDisabled;
  }

  /**
   * Check if peer is connected
   */
  isConnected(): boolean {
    return this.peer !== null && !this.peer.destroyed;
  }
}
