import { Alert, Platform } from 'react-native';
import * as ExpoAudio from 'expo-audio';

export const SafeAudio = {
  get isAvailable(): boolean {
    try {
      return !!(ExpoAudio && (ExpoAudio.AudioModule || ExpoAudio.requestRecordingPermissionsAsync));
    } catch {
      return false;
    }
  },

  async requestPermissionsAsync() {
    try {
      if (ExpoAudio && typeof ExpoAudio.requestRecordingPermissionsAsync === 'function') {
        const response = await ExpoAudio.requestRecordingPermissionsAsync();
        if (response && response.granted) {
          return response;
        }
        return response || { status: 'denied', granted: false, canAskAgain: false, expires: 'never' };
      }
    } catch (e) {
      console.warn('[SafeAudio] requestRecordingPermissionsAsync failed or unavailable:', e);
    }

    // Never fake success if the native audio module is missing or request fails
    Alert.alert(
      'الميكروفون غير متاح / Microphone Unavailable',
      'وحدة تسجيل الصوت غير متوفرة في بيئة التشغيل الحالية. يرجى تشغيل التطبيق على جهاز يدعم تسجيل الصوت.\nAudio recording module is not available in this environment. Please run on a supported device.'
    );

    return {
      status: 'denied',
      granted: false,
      canAskAgain: false,
      expires: 'never',
    };
  },

  async setAudioModeAsync(options: any = {}) {
    try {
      if (ExpoAudio && typeof ExpoAudio.setAudioModeAsync === 'function') {
        await ExpoAudio.setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          ...options,
        });
      }
    } catch (e) {
      console.warn('[SafeAudio] setAudioModeAsync failed:', e);
    }
  },

  Sound: {
    async createAsync(
      source: any,
      initialStatus: any = {},
      onPlaybackStatusUpdate: any = null,
      downloadFirst: boolean = true
    ) {
      try {
        if (ExpoAudio && typeof ExpoAudio.createAudioPlayer === 'function') {
          const resolvedSrc = typeof source === 'object' && source.uri ? source.uri : source;
          const player = ExpoAudio.createAudioPlayer(resolvedSrc);
          return {
            sound: {
              playAsync: async () => {
                player.play();
                return { isLoaded: true };
              },
              stopAsync: async () => {
                player.pause();
                return { isLoaded: true };
              },
              unloadAsync: async () => {
                try {
                  player.remove();
                } catch {}
                return { isLoaded: false };
              },
              setOnPlaybackStatusUpdate: (cb: any) => {
                const p = player as any;
                if (typeof p.addListener === 'function') {
                  p.addListener('playbackStatusUpdate', cb);
                }
              },
            },
            status: { isLoaded: true },
          };
        }
      } catch (e) {
        console.warn('[SafeAudio] Sound.createAsync failed:', e);
      }
      return {
        sound: {
          playAsync: async () => ({ isLoaded: true }),
          stopAsync: async () => ({ isLoaded: true }),
          unloadAsync: async () => ({ isLoaded: false }),
          setOnPlaybackStatusUpdate: () => {},
        },
        status: { isLoaded: false },
      };
    },
  },

  Recording: class SafeRecording {
    private recorder: any = null;
    private statusInterval: any = null;
    private statusCallback: ((status: any) => void) | null = null;
    private updateIntervalMs: number = 120;
    private recordingUri: string | null = null;

    constructor() {
      try {
        if (ExpoAudio?.AudioModule?.AudioRecorder) {
          const defaultOptions = {
            extension: '.m4a',
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            isMeteringEnabled: true,
          };
          this.recorder = new ExpoAudio.AudioModule.AudioRecorder(defaultOptions);
        }
      } catch (e) {
        console.warn('[SafeAudio] AudioRecorder constructor failed:', e);
      }
    }

    async prepareToRecordAsync(options?: any) {
      if (this.recorder?.prepareToRecordAsync) {
        try {
          return await this.recorder.prepareToRecordAsync(options);
        } catch (e) {
          console.warn('[SafeAudio] prepareToRecordAsync error:', e);
        }
      }
    }

    setProgressUpdateInterval(interval: number) {
      this.updateIntervalMs = interval;
    }

    setOnRecordingStatusUpdate(callback: (status: any) => void) {
      this.statusCallback = callback;
    }

    async startAsync() {
      if (this.recorder) {
        try {
          if (typeof this.recorder.record === 'function') {
            this.recorder.record();
          } else if (typeof this.recorder.start === 'function') {
            this.recorder.start();
          }
        } catch (e) {
          console.warn('[SafeAudio] recorder start failed:', e);
        }
      }

      if (this.statusInterval) clearInterval(this.statusInterval);
      const startTime = Date.now();
      this.statusInterval = setInterval(() => {
        if (!this.statusCallback) return;
        let durationMillis = Date.now() - startTime;
        let metering = -30;

        if (this.recorder?.getStatus) {
          try {
            const st = this.recorder.getStatus();
            if (st) {
              if (typeof st.durationMillis === 'number') durationMillis = st.durationMillis;
              if (typeof st.metering === 'number') metering = st.metering;
            }
          } catch {}
        } else if (this.recorder?.currentTime) {
          durationMillis = Math.floor(this.recorder.currentTime * 1000);
        }

        this.statusCallback({
          durationMillis,
          metering,
          isRecording: true,
        });
      }, this.updateIntervalMs || 120);
    }

    async stopAndUnloadAsync() {
      if (this.statusInterval) {
        clearInterval(this.statusInterval);
        this.statusInterval = null;
      }
      if (this.recorder) {
        try {
          if (typeof this.recorder.stop === 'function') {
            await this.recorder.stop();
          }
          this.recordingUri = this.recorder.uri || null;
        } catch (e) {
          console.warn('[SafeAudio] stopAndUnloadAsync failed:', e);
        }
      }
    }

    getURI(): string | null {
      return this.recordingUri || this.recorder?.uri || null;
    }
  },

  AndroidOutputFormat: { MPEG_4: 2, DEFAULT: 0 },
  AndroidAudioEncoder: { AAC: 3, DEFAULT: 0 },
  IOSOutputFormat: { MPEG4AAC: 'aac ' },
  IOSAudioQuality: { HIGH: 0x7f },
};

export default SafeAudio;
