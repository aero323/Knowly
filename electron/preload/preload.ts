import { contextBridge, ipcRenderer } from 'electron';
import { DESKTOP_IPC, type CaptionOverlaySettings, type CaptionStreamState, type DesktopCaptionLine, type KnowlyDesktopApi, type StartCaptionStreamOptions } from '../shared/desktopApi';

function subscribe<T>(channel: string, callback: (payload: T) => void) {
  const listener = (_event: Electron.IpcRendererEvent, payload: T) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

const api: KnowlyDesktopApi = {
  getRuntimeInfo: () => ipcRenderer.invoke(DESKTOP_IPC.runtimeInfo),
  showOverlay: () => ipcRenderer.invoke(DESKTOP_IPC.overlayShow),
  hideOverlay: () => ipcRenderer.invoke(DESKTOP_IPC.overlayHide),
  getOverlaySettings: () => ipcRenderer.invoke(DESKTOP_IPC.overlaySettingsGet),
  setOverlaySettings: (settings: Partial<CaptionOverlaySettings>) => ipcRenderer.invoke(DESKTOP_IPC.overlaySettingsSet, settings),
  startCaptionMockStream: (options: StartCaptionStreamOptions) => ipcRenderer.invoke(DESKTOP_IPC.captionsStart, options),
  pauseCaptionMockStream: () => ipcRenderer.invoke(DESKTOP_IPC.captionsPause),
  resumeCaptionMockStream: () => ipcRenderer.invoke(DESKTOP_IPC.captionsResume),
  stopCaptionMockStream: () => ipcRenderer.invoke(DESKTOP_IPC.captionsStop),
  getCaptionStreamState: () => ipcRenderer.invoke(DESKTOP_IPC.captionsStateGet),
  onCaptionLine: (callback: (line: DesktopCaptionLine) => void) => subscribe(DESKTOP_IPC.captionsLine, callback),
  onCaptionState: (callback: (state: CaptionStreamState) => void) => subscribe(DESKTOP_IPC.captionsStateChanged, callback),
  onOverlaySettings: (callback: (settings: CaptionOverlaySettings) => void) => subscribe(DESKTOP_IPC.overlaySettingsChanged, callback),
};

contextBridge.exposeInMainWorld('knowlyDesktop', api);
