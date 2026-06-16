import type { SimultaneousCaption } from '../../src/types';

export const DESKTOP_IPC = {
  runtimeInfo: 'desktop:runtime-info',
  overlayShow: 'desktop:overlay-show',
  overlayHide: 'desktop:overlay-hide',
  overlaySettingsGet: 'desktop:overlay-settings-get',
  overlaySettingsSet: 'desktop:overlay-settings-set',
  overlaySettingsChanged: 'desktop:overlay-settings-changed',
  captionsStart: 'desktop:captions-start',
  captionsPause: 'desktop:captions-pause',
  captionsResume: 'desktop:captions-resume',
  captionsStop: 'desktop:captions-stop',
  captionsStateGet: 'desktop:captions-state-get',
  captionsStateChanged: 'desktop:captions-state-changed',
  captionsLine: 'desktop:captions-line',
} as const;

export type CaptionDock = 'left' | 'right';
export type DesktopSourceLanguage = 'auto' | 'id' | 'zh' | 'en';
export type DesktopTargetLanguage = 'zh' | 'id' | 'en';

export interface DesktopRuntimeInfo {
  appVersion: string;
  isPackaged: boolean;
  platform: string;
}

export interface CaptionOverlaySettings {
  visible: boolean;
  dock: CaptionDock;
  opacity: number;
  fontScale: number;
  showOriginal: boolean;
  showTranslation: boolean;
  compact: boolean;
}

export interface StartCaptionStreamOptions {
  sourceDevice: string;
  sourceLanguage: DesktopSourceLanguage;
  targetLanguage: DesktopTargetLanguage;
}

export interface CaptionStreamState extends StartCaptionStreamOptions {
  running: boolean;
  paused: boolean;
  lineCount: number;
  startedAt?: string;
}

export type DesktopCaptionLine = SimultaneousCaption & {
  sequence: number;
  receivedAt: string;
};

export interface KnowlyDesktopApi {
  getRuntimeInfo: () => Promise<DesktopRuntimeInfo>;
  showOverlay: () => Promise<CaptionOverlaySettings>;
  hideOverlay: () => Promise<CaptionOverlaySettings>;
  getOverlaySettings: () => Promise<CaptionOverlaySettings>;
  setOverlaySettings: (settings: Partial<CaptionOverlaySettings>) => Promise<CaptionOverlaySettings>;
  startCaptionMockStream: (options: StartCaptionStreamOptions) => Promise<CaptionStreamState>;
  pauseCaptionMockStream: () => Promise<CaptionStreamState>;
  resumeCaptionMockStream: () => Promise<CaptionStreamState>;
  stopCaptionMockStream: () => Promise<CaptionStreamState>;
  getCaptionStreamState: () => Promise<CaptionStreamState>;
  onCaptionLine: (callback: (line: DesktopCaptionLine) => void) => () => void;
  onCaptionState: (callback: (state: CaptionStreamState) => void) => () => void;
  onOverlaySettings: (callback: (settings: CaptionOverlaySettings) => void) => () => void;
}
