import type { KnowlyDesktopApi } from '../shared/desktopApi';

declare global {
  interface Window {
    knowlyDesktop?: KnowlyDesktopApi;
  }
}

export {};
