/**
 * Audio utilities for DTMF tones and call notifications
 */

import { DTMFTone } from '@/types/pbx';

// DTMF frequency pairs for each key
const DTMF_FREQUENCIES: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477],
};

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private currentTones: OscillatorNode[] = [];
  private notificationSounds: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.preloadSounds();
    }
  }

  private preloadSounds(): void {
    const sounds = {
      ring: '/sounds/ring.mp3',
      notification: '/sounds/notification.mp3',
      hangup: '/sounds/hangup.mp3',
      connect: '/sounds/connect.mp3',
    };

    Object.entries(sounds).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.notificationSounds.set(name, audio);
    });
  }

  playDTMF(key: string, duration: number = 100): void {
    if (!this.audioContext) return;

    const frequencies = DTMF_FREQUENCIES[key];
    if (!frequencies) return;

    // Stop any currently playing tones
    this.stopDTMF();

    const [freq1, freq2] = frequencies;
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0.3; // Volume
    gainNode.connect(this.audioContext.destination);

    // Create two oscillators for dual-tone
    const osc1 = this.audioContext.createOscillator();
    osc1.frequency.value = freq1;
    osc1.type = 'sine';
    osc1.connect(gainNode);

    const osc2 = this.audioContext.createOscillator();
    osc2.frequency.value = freq2;
    osc2.type = 'sine';
    osc2.connect(gainNode);

    // Start the tones
    osc1.start();
    osc2.start();

    // Store for cleanup
    this.currentTones = [osc1, osc2];

    // Stop after duration
    setTimeout(() => {
      this.stopDTMF();
    }, duration);
  }

  stopDTMF(): void {
    this.currentTones.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    this.currentTones = [];
  }

  async playNotificationSound(soundName: string, loop: boolean = false): Promise<void> {
    const audio = this.notificationSounds.get(soundName);
    if (!audio) return;

    audio.loop = loop;
    try {
      await audio.play();
    } catch (error) {
      console.error(`Failed to play sound ${soundName}:`, error);
    }
  }

  stopNotificationSound(soundName: string): void {
    const audio = this.notificationSounds.get(soundName);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  stopAllSounds(): void {
    this.notificationSounds.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  playRingtone(): void {
    this.playNotificationSound('ring', true);
  }

  stopRingtone(): void {
    this.stopNotificationSound('ring');
  }

  playConnectSound(): void {
    this.playNotificationSound('connect');
  }

  playHangupSound(): void {
    this.playNotificationSound('hangup');
  }

  playNotification(): void {
    this.playNotificationSound('notification');
  }

  cleanup(): void {
    this.stopDTMF();
    this.stopAllSounds();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Singleton instance
let audioManager: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!audioManager) {
    audioManager = new AudioManager();
  }
  return audioManager;
}

export function resetAudioManager(): void {
  if (audioManager) {
    audioManager.cleanup();
    audioManager = null;
  }
}
