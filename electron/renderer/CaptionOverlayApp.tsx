import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Captions, GripHorizontal, Maximize2, Minimize2, Pause, Play, Radio, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CaptionOverlaySettings, CaptionStreamState, DesktopCaptionLine } from '../shared/desktopApi';
import { activeDesktopTargetLanguages, desktopTargetLanguageLabel } from '../shared/desktopApi';

const OVERLAY_BASE_WIDTH = 430;
const OVERLAY_BASE_HEIGHT = 270;
const OVERLAY_SCROLL_MIN_HEIGHT = 430;
const OVERLAY_SCROLL_LINE_HEIGHT = 18;
const OVERLAY_LANGUAGE_HEIGHT_STEP = 112;
const OVERLAY_SCROLL_LANGUAGE_HEIGHT_STEP = 150;
const FULLSCREEN_BASE_WIDTH = 1280;
const FULLSCREEN_BASE_HEIGHT = 720;

const DEFAULT_OVERLAY_SETTINGS: CaptionOverlaySettings = {
  visible: false,
  opacity: 0.9,
  fontScale: 1,
  showOriginal: true,
  showTranslation: true,
  scrollMode: true,
  visibleLineCount: 3,
  fullscreen: false,
};

const DEFAULT_CAPTION_STATE: CaptionStreamState = {
  running: false,
  paused: false,
  lineCount: 0,
  sourceDevice: 'system-mix',
  sourceLanguage: 'auto',
  targetLanguage: 'zh',
  targetLanguages: ['zh', 'en', 'th'],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function overlayLanguageCount(state?: CaptionStreamState) {
  if (!state) return 1;
  return Math.max(1, activeDesktopTargetLanguages(state.targetLanguages, state.targetLanguage).length);
}

function expectedOverlayHeight(settings: CaptionOverlaySettings, state?: CaptionStreamState) {
  const extraLanguageCount = overlayLanguageCount(state) - 1;
  if (!settings.scrollMode) return OVERLAY_BASE_HEIGHT + extraLanguageCount * OVERLAY_LANGUAGE_HEIGHT_STEP;
  return OVERLAY_SCROLL_MIN_HEIGHT
    + (settings.visibleLineCount - 5) * OVERLAY_SCROLL_LINE_HEIGHT
    + extraLanguageCount * OVERLAY_SCROLL_LANGUAGE_HEIGHT_STEP;
}

function fontSize(basePx: number, scale: number) {
  return `${Math.round(basePx * scale * 10) / 10}px`;
}

function useWindowScale(settings: CaptionOverlaySettings, streamState: CaptionStreamState) {
  const [windowSize, setWindowSize] = useState(() => ({
    width: window.innerWidth || OVERLAY_BASE_WIDTH,
    height: window.innerHeight || expectedOverlayHeight(DEFAULT_OVERLAY_SETTINGS, DEFAULT_CAPTION_STATE),
  }));

  useEffect(() => {
    function syncWindowSize() {
      setWindowSize({
        width: window.innerWidth || OVERLAY_BASE_WIDTH,
        height: window.innerHeight || expectedOverlayHeight(settings, streamState),
      });
    }

    syncWindowSize();
    window.addEventListener('resize', syncWindowSize);
    return () => window.removeEventListener('resize', syncWindowSize);
  }, [settings, streamState]);

  const baseWidth = settings.fullscreen ? FULLSCREEN_BASE_WIDTH : OVERLAY_BASE_WIDTH;
  const baseHeight = settings.fullscreen ? FULLSCREEN_BASE_HEIGHT : expectedOverlayHeight(settings, streamState);
  const sizeScale = Math.sqrt((windowSize.width * windowSize.height) / (baseWidth * baseHeight));

  return settings.fontScale * clamp(sizeScale, settings.fullscreen ? 0.9 : 0.75, settings.fullscreen ? 1.35 : 2.1);
}

function OverlayButton({ label, children, onClick }: { label: string; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="knowly-no-drag flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-white/82 transition hover:bg-white/14 active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

function EmptyCaption({ textScale }: { textScale: number }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-emerald-300">
        <Captions className="h-6 w-6" />
      </div>
      <p className="font-black text-white" style={{ fontSize: fontSize(16, textScale) }}>等待字幕</p>
      <p className="mt-1 leading-relaxed text-white/52" style={{ fontSize: fontSize(12, textScale) }}>从主窗口开始字幕同传后，这里会持续显示翻译结果。</p>
    </div>
  );
}

function captionTranslations(line: DesktopCaptionLine) {
  return line.translations?.length
    ? line.translations
    : line.translatedText
      ? [{ label: desktopTargetLanguageLabel(line.targetLanguage), translatedText: line.translatedText }]
      : [];
}

function CaptionDisplay({ line, settings, textScale }: { line: DesktopCaptionLine; settings: CaptionOverlaySettings; textScale: number }) {
  const translations = captionTranslations(line);
  const translationBaseSize = settings.fullscreen
    ? translations.length > 1 ? 38 : 60
    : translations.length > 1 ? 16 : 20;

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col justify-center overflow-hidden',
        settings.fullscreen ? 'px-[8vw] pb-[9vh]' : 'px-5 pb-4',
      )}
    >
      {settings.showTranslation && translations.length > 0 && (
        <div className={cn(settings.fullscreen ? 'space-y-3' : 'space-y-2')}>
          {translations.map((translation, index) => (
            <div
              key={`${line.id}-${translation.label}-${index}`}
              className={cn(
                'rounded-lg border border-white/10 bg-white/[0.055]',
                settings.fullscreen ? 'px-5 py-4' : 'px-3 py-2',
              )}
            >
              <p
                className="font-black leading-snug text-white/92"
                style={{ fontSize: fontSize(translationBaseSize, textScale) }}
              >
                {translation.translatedText}
              </p>
            </div>
          ))}
        </div>
      )}
      {settings.showOriginal && (
        <div className={cn('rounded-lg border border-white/8 bg-black/12', settings.fullscreen ? 'mt-4 px-5 py-3' : 'mt-2 px-3 py-2')}>
          <p
            className="leading-relaxed text-white/58"
            style={{ fontSize: fontSize(settings.fullscreen ? 26 : 13, textScale) }}
          >
            {line.originalText}
          </p>
        </div>
      )}
    </div>
  );
}

function ScrollingCaptionDisplay({ lines, settings, textScale }: { lines: DesktopCaptionLine[]; settings: CaptionOverlaySettings; textScale: number }) {
  const activeTranslationCount = captionTranslations(lines[lines.length - 1] ?? ({} as DesktopCaptionLine)).length;
  const maxVisibleLines = Math.max(2, settings.visibleLineCount - Math.max(0, activeTranslationCount - 1));
  const visibleLines = lines.slice(-maxVisibleLines);

  return (
    <div className={cn('min-h-0 flex-1 overflow-hidden', settings.fullscreen ? 'px-[7vw] pb-[18vh]' : 'px-5 pb-4')}>
      <div className={cn('flex h-full flex-col justify-end', settings.fullscreen ? 'gap-5' : 'gap-2.5')}>
        {visibleLines.map((line, index) => {
          const active = index === visibleLines.length - 1;
          const translations = captionTranslations(line);
          return (
            <article
              key={line.id}
              className={cn(
                'rounded-lg border transition',
                settings.fullscreen ? 'px-6 py-5' : 'px-3 py-2',
                active
                  ? 'border-blue-300/35 bg-blue-400/15 shadow-lg shadow-blue-950/20'
                  : 'border-white/8 bg-white/[0.04] opacity-55',
              )}
            >
              {settings.showTranslation && translations.length > 0 && (
                <div className={cn(settings.fullscreen ? active ? 'space-y-3' : 'space-y-2' : active ? 'space-y-2' : 'space-y-1.5')}>
                  {translations.map((translation, translationIndex) => (
                    <div
                      key={`${line.id}-${translation.label}-${translationIndex}`}
                      className={cn(
                        'rounded-md border border-white/8 bg-white/[0.05]',
                        settings.fullscreen ? active ? 'px-4 py-3' : 'px-3 py-2' : active ? 'px-3 py-2' : 'px-2.5 py-1.5',
                        !active && 'bg-white/[0.035]',
                      )}
                    >
                      <p
                        className={cn(
                          'font-black leading-snug',
                          active ? 'text-white/94' : 'text-white/72',
                        )}
                        style={{ fontSize: fontSize(settings.fullscreen ? active ? 36 : 22 : active ? 16 : 12, textScale) }}
                      >
                        {translation.translatedText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {settings.showOriginal && (
                <div
                  className={cn(
                    'rounded-md border border-white/6 bg-black/12',
                    settings.fullscreen ? active ? 'mt-3 px-4 py-3' : 'mt-2 px-3 py-2' : active ? 'mt-2 px-3 py-2' : 'mt-1.5 px-2.5 py-1.5',
                  )}
                >
                  <p
                    className={cn('leading-relaxed', active ? 'text-white/62' : 'text-white/42')}
                    style={{ fontSize: fontSize(settings.fullscreen ? active ? 23 : 18 : active ? 12 : 10.5, textScale) }}
                  >
                    {line.originalText}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function CaptionOverlayApp() {
  const [settings, setSettings] = useState<CaptionOverlaySettings>(DEFAULT_OVERLAY_SETTINGS);
  const [streamState, setStreamState] = useState<CaptionStreamState>(DEFAULT_CAPTION_STATE);
  const [lines, setLines] = useState<DesktopCaptionLine[]>([]);
  const activeLine = lines[lines.length - 1];
  const textScale = useWindowScale(settings, streamState);

  useEffect(() => {
    const api = window.knowlyDesktop;
    if (!api) return;

    void api.getOverlaySettings().then(setSettings);
    void api.getCaptionStreamState().then(setStreamState);

    const removeLineListener = api.onCaptionLine((line) => {
      setLines((current) => [...current, line].slice(-18));
    });
    const removeStateListener = api.onCaptionState(setStreamState);
    const removeSettingsListener = api.onOverlaySettings(setSettings);

    return () => {
      removeLineListener();
      removeStateListener();
      removeSettingsListener();
    };
  }, []);

  const stateLabel = useMemo(() => {
    if (!streamState.running) return '待开始';
    if (streamState.paused) return '已暂停';
    return '';
  }, [streamState.paused, streamState.running]);

  function togglePause() {
    const api = window.knowlyDesktop;
    if (!api || !streamState.running) return;
    if (streamState.paused) {
      void api.resumeCaptionMockStream().then(setStreamState);
      return;
    }
    void api.pauseCaptionMockStream().then(setStreamState);
  }

  function stopCaptionStream() {
    const api = window.knowlyDesktop;
    if (!api) return;
    void api.stopCaptionMockStream().then(setStreamState);
  }

  function toggleFullscreen() {
    const api = window.knowlyDesktop;
    if (!api) return;
    void api.toggleOverlayFullscreen().then(setSettings);
  }

  return (
    <div className={cn('flex h-full w-full items-center justify-center', settings.fullscreen ? 'p-0' : 'p-1')}>
      <section
        className={cn(
          'knowly-drag flex h-full w-full flex-col overflow-hidden border border-white/10 bg-slate-950/92 text-white shadow-2xl shadow-black/35 backdrop-blur-xl',
          settings.fullscreen ? 'rounded-none' : 'rounded-lg',
        )}
        style={{ opacity: settings.opacity }}
      >
        <header
          className={cn(
            'flex shrink-0 items-center justify-between gap-3 border-b border-white/8',
            settings.fullscreen ? 'h-[72px] px-8 py-4' : 'h-[52px] px-4 py-3',
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <GripHorizontal className={cn('shrink-0 text-white/34', settings.fullscreen ? 'h-5 w-5' : 'h-4 w-4')} />
            <div className={cn('flex shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-200', settings.fullscreen ? 'h-10 w-10' : 'h-8 w-8')}>
              <Radio className={cn(settings.fullscreen ? 'h-5 w-5' : 'h-4 w-4')} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-black text-white" style={{ fontSize: fontSize(settings.fullscreen ? 16 : 12, textScale) }}>Knowly 字幕</p>
              {stateLabel && <p className="truncate font-semibold text-white/45" style={{ fontSize: fontSize(settings.fullscreen ? 14 : 11, textScale) }}>{stateLabel}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <OverlayButton label={streamState.paused ? '继续' : '暂停'} onClick={togglePause}>
              {streamState.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </OverlayButton>
            <OverlayButton label="停止同传" onClick={stopCaptionStream}>
              <Square className="h-3.5 w-3.5 fill-current" />
            </OverlayButton>
            <OverlayButton label={settings.fullscreen ? '退出全屏' : '全屏'} onClick={toggleFullscreen}>
              {settings.fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </OverlayButton>
          </div>
        </header>

        {activeLine ? (
          settings.scrollMode
            ? <ScrollingCaptionDisplay lines={lines} settings={settings} textScale={textScale} />
            : <CaptionDisplay line={activeLine} settings={settings} textScale={textScale} />
        ) : (
          <EmptyCaption textScale={textScale} />
        )}
      </section>
    </div>
  );
}
