import { app, BrowserWindow, ipcMain, screen, shell } from 'electron';
import path from 'node:path';
import { SIMULTANEOUS_CAPTIONS } from '../../src/data/mockData';
import {
  DESKTOP_IPC,
  type CaptionOverlaySettings,
  type CaptionStreamState,
  type DesktopCaptionLine,
  type StartCaptionStreamOptions,
} from '../shared/desktopApi';

const MAIN_WINDOW_WIDTH = 1240;
const MAIN_WINDOW_HEIGHT = 820;
const OVERLAY_WIDTH = 430;
const OVERLAY_HEIGHT = 270;
const OVERLAY_SCROLL_MIN_HEIGHT = 430;
const OVERLAY_SCROLL_LINE_HEIGHT = 18;
const OVERLAY_MARGIN = 22;

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let captionTimer: NodeJS.Timeout | null = null;
let captionCursor = 0;
let isQuitting = false;

let overlaySettings: CaptionOverlaySettings = {
  visible: false,
  opacity: 0.9,
  fontScale: 1,
  showOriginal: true,
  showTranslation: true,
  scrollMode: true,
  visibleLineCount: 5,
  fullscreen: false,
};

let captionState: CaptionStreamState = {
  running: false,
  paused: false,
  lineCount: 0,
  sourceDevice: 'system-mix',
  sourceLanguage: 'auto',
  targetLanguage: 'zh',
};

function rendererUrl(page: string) {
  const devServerUrl = process.env.ELECTRON_RENDERER_URL;
  if (devServerUrl) return `${devServerUrl}/${page}`;
  return null;
}

function rendererFile(page: string) {
  return path.join(__dirname, `../renderer/${page}`);
}

function loadRenderer(window: BrowserWindow, page: string) {
  const url = rendererUrl(page);
  if (url) {
    void window.loadURL(url);
    return;
  }

  void window.loadFile(rendererFile(page));
}

function preloadPath() {
  return path.join(__dirname, '../preload/preload.mjs');
}

function broadcast<T>(channel: string, payload: T) {
  for (const targetWindow of [mainWindow, overlayWindow]) {
    if (targetWindow && !targetWindow.isDestroyed()) {
      targetWindow.webContents.send(channel, payload);
    }
  }
}

function broadcastOverlaySettings() {
  broadcast(DESKTOP_IPC.overlaySettingsChanged, overlaySettings);
}

function broadcastCaptionState() {
  broadcast(DESKTOP_IPC.captionsStateChanged, captionState);
}

function attachExternalLinkGuard(window: BrowserWindow) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: MAIN_WINDOW_WIDTH,
    height: MAIN_WINDOW_HEIGHT,
    minWidth: 1080,
    minHeight: 720,
    title: 'Knowly Desktop',
    backgroundColor: '#f5f7fb',
    show: false,
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => {
    mainWindow = null;
    clearCaptionTimer();
    captionState = { ...captionState, running: false, paused: false, startedAt: undefined };
    if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.close();
    if (process.platform !== 'darwin' && !isQuitting) app.quit();
  });
  attachExternalLinkGuard(mainWindow);
  loadRenderer(mainWindow, 'desktop.html');
}

function overlayHeight() {
  if (!overlaySettings.scrollMode) return OVERLAY_HEIGHT;
  return OVERLAY_SCROLL_MIN_HEIGHT + (overlaySettings.visibleLineCount - 5) * OVERLAY_SCROLL_LINE_HEIGHT;
}

function defaultOverlayBounds() {
  const { workArea } = screen.getPrimaryDisplay();
  const height = overlayHeight();
  const width = OVERLAY_WIDTH;
  return {
    x: workArea.x + workArea.width - width - OVERLAY_MARGIN,
    y: workArea.y + Math.round((workArea.height - height) * 0.24),
    width,
    height,
  };
}

function positionOverlay() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;

  overlayWindow.setBounds(defaultOverlayBounds());
}

function resizeOverlayForMode() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  if (overlayWindow.isFullScreen()) return;

  const currentBounds = overlayWindow.getBounds();
  overlayWindow.setBounds({
    ...currentBounds,
    height: overlayHeight(),
  });
}

function createOverlayWindow() {
  const initialBounds = defaultOverlayBounds();
  overlayWindow = new BrowserWindow({
    width: initialBounds.width,
    height: initialBounds.height,
    minWidth: 360,
    minHeight: 220,
    frame: false,
    transparent: true,
    resizable: true,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    hasShadow: false,
    title: 'Knowly Caption Overlay',
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setAlwaysOnTop(true, 'floating');
  overlayWindow.on('enter-full-screen', () => {
    overlaySettings = { ...overlaySettings, fullscreen: true };
    broadcastOverlaySettings();
  });
  overlayWindow.on('leave-full-screen', () => {
    overlaySettings = { ...overlaySettings, fullscreen: false };
    broadcastOverlaySettings();
  });
  overlayWindow.on('closed', () => {
    overlaySettings = { ...overlaySettings, fullscreen: false };
    overlayWindow = null;
  });
  attachExternalLinkGuard(overlayWindow);
  positionOverlay();
  loadRenderer(overlayWindow, 'desktop-overlay.html');
}

function showOverlay() {
  if (!overlayWindow || overlayWindow.isDestroyed()) createOverlayWindow();
  overlaySettings = { ...overlaySettings, visible: true };
  overlayWindow?.showInactive();
  broadcastOverlaySettings();
  return overlaySettings;
}

function hideOverlay() {
  if (overlayWindow && !overlayWindow.isDestroyed() && overlayWindow.isFullScreen()) {
    overlayWindow.setFullScreen(false);
  }
  overlaySettings = { ...overlaySettings, visible: false, fullscreen: false };
  overlayWindow?.hide();
  broadcastOverlaySettings();
  return overlaySettings;
}

function setOverlaySettings(settings: Partial<CaptionOverlaySettings>) {
  const previousScrollMode = overlaySettings.scrollMode;
  const previousVisibleLineCount = overlaySettings.visibleLineCount;
  overlaySettings = {
    ...overlaySettings,
    ...settings,
    opacity: clamp(settings.opacity ?? overlaySettings.opacity, 0.55, 1),
    fontScale: clamp(settings.fontScale ?? overlaySettings.fontScale, 0.86, 1.32),
    visibleLineCount: Math.round(clamp(settings.visibleLineCount ?? overlaySettings.visibleLineCount, 3, 9)),
  };

  if (overlaySettings.visible) {
    if (!overlayWindow || overlayWindow.isDestroyed()) createOverlayWindow();
    if (
      previousScrollMode !== overlaySettings.scrollMode
      || previousVisibleLineCount !== overlaySettings.visibleLineCount
    ) {
      resizeOverlayForMode();
    }
    overlayWindow?.showInactive();
    if (typeof settings.fullscreen === 'boolean') {
      overlayWindow?.setFullScreen(settings.fullscreen);
    }
  } else {
    overlayWindow?.hide();
  }

  broadcastOverlaySettings();
  return overlaySettings;
}

function toggleOverlayFullscreen() {
  if (!overlayWindow || overlayWindow.isDestroyed()) createOverlayWindow();
  if (!overlayWindow || overlayWindow.isDestroyed()) return overlaySettings;

  overlaySettings = { ...overlaySettings, visible: true };
  overlayWindow.show();
  overlayWindow.setFullScreen(!overlayWindow.isFullScreen());
  overlayWindow.setAlwaysOnTop(true, 'floating');
  overlaySettings = { ...overlaySettings, fullscreen: overlayWindow.isFullScreen() };
  broadcastOverlaySettings();
  return overlaySettings;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`;
}

function nextCaptionLine(): DesktopCaptionLine {
  const caption = SIMULTANEOUS_CAPTIONS[captionCursor % SIMULTANEOUS_CAPTIONS.length];
  const sequence = captionCursor + 1;
  captionCursor += 1;

  return {
    ...caption,
    id: `desktop-caption-${Date.now()}-${sequence}`,
    sequence,
    startedAt: formatElapsed(8 + sequence * 7),
    receivedAt: new Date().toISOString(),
  };
}

function publishCaptionLine() {
  if (!captionState.running || captionState.paused) return;

  const line = nextCaptionLine();
  captionState = {
    ...captionState,
    lineCount: line.sequence,
  };
  broadcast(DESKTOP_IPC.captionsLine, line);
  broadcastCaptionState();
}

function clearCaptionTimer() {
  if (!captionTimer) return;
  clearInterval(captionTimer);
  captionTimer = null;
}

function startCaptionTimer() {
  clearCaptionTimer();
  publishCaptionLine();
  captionTimer = setInterval(publishCaptionLine, 2600);
}

function startCaptionStream(options: StartCaptionStreamOptions) {
  captionCursor = 0;
  captionState = {
    ...options,
    running: true,
    paused: false,
    lineCount: 0,
    startedAt: new Date().toISOString(),
  };
  showOverlay();
  broadcastCaptionState();
  startCaptionTimer();
  return captionState;
}

function pauseCaptionStream() {
  if (!captionState.running) return captionState;
  captionState = { ...captionState, paused: true };
  broadcastCaptionState();
  return captionState;
}

function resumeCaptionStream() {
  if (!captionState.running) return captionState;
  captionState = { ...captionState, paused: false };
  broadcastCaptionState();
  return captionState;
}

function stopCaptionStream() {
  clearCaptionTimer();
  captionState = {
    ...captionState,
    running: false,
    paused: false,
    startedAt: undefined,
  };
  hideOverlay();
  broadcastCaptionState();
  return captionState;
}

function setupIpc() {
  ipcMain.handle(DESKTOP_IPC.runtimeInfo, () => ({
    appVersion: app.getVersion(),
    isPackaged: app.isPackaged,
    platform: process.platform,
  }));
  ipcMain.handle(DESKTOP_IPC.overlayShow, () => showOverlay());
  ipcMain.handle(DESKTOP_IPC.overlayHide, () => hideOverlay());
  ipcMain.handle(DESKTOP_IPC.overlaySettingsGet, () => overlaySettings);
  ipcMain.handle(DESKTOP_IPC.overlaySettingsSet, (_event, settings: Partial<CaptionOverlaySettings>) => setOverlaySettings(settings));
  ipcMain.handle(DESKTOP_IPC.overlayFullscreenToggle, () => toggleOverlayFullscreen());
  ipcMain.handle(DESKTOP_IPC.captionsStart, (_event, options: StartCaptionStreamOptions) => startCaptionStream(options));
  ipcMain.handle(DESKTOP_IPC.captionsPause, () => pauseCaptionStream());
  ipcMain.handle(DESKTOP_IPC.captionsResume, () => resumeCaptionStream());
  ipcMain.handle(DESKTOP_IPC.captionsStop, () => stopCaptionStream());
  ipcMain.handle(DESKTOP_IPC.captionsStateGet, () => captionState);
}

app.whenReady().then(() => {
  setupIpc();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  clearCaptionTimer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
