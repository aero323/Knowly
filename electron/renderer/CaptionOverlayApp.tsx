import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Captions, GripHorizontal, Maximize2, Minimize2, Pause, Play, Radio, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  CaptionOverlaySettings,
  CaptionStreamState,
  DesktopCaptionLanguageState,
  DesktopCaptionLine,
  DesktopCaptionTranslation,
} from '../shared/desktopApi';
import { activeDesktopTargetLanguages, desktopTargetLanguageLabel } from '../shared/desktopApi';

const OVERLAY_BASE_WIDTH = 430;
const OVERLAY_COLUMN_WIDTH = 330;
const OVERLAY_BASE_HEIGHT = 270;
const OVERLAY_SCROLL_MIN_HEIGHT = 430;
const OVERLAY_SCROLL_LINE_HEIGHT = 18;
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

function expectedOverlayWidth(settings: CaptionOverlaySettings, state?: CaptionStreamState) {
  if (settings.fullscreen) return FULLSCREEN_BASE_WIDTH;
  if (!settings.showTranslation) return OVERLAY_BASE_WIDTH;
  return OVERLAY_BASE_WIDTH + Math.max(0, overlayLanguageCount(state) - 1) * OVERLAY_COLUMN_WIDTH;
}

function expectedOverlayHeight(settings: CaptionOverlaySettings) {
  if (!settings.scrollMode) return OVERLAY_BASE_HEIGHT;
  return OVERLAY_SCROLL_MIN_HEIGHT + (settings.visibleLineCount - 5) * OVERLAY_SCROLL_LINE_HEIGHT;
}

function fontSize(basePx: number, scale: number) {
  return `${Math.round(basePx * scale * 10) / 10}px`;
}

function useWindowScale(settings: CaptionOverlaySettings, streamState: CaptionStreamState) {
  const [windowSize, setWindowSize] = useState(() => ({
    width: window.innerWidth || OVERLAY_BASE_WIDTH,
    height: window.innerHeight || expectedOverlayHeight(DEFAULT_OVERLAY_SETTINGS),
  }));

  useEffect(() => {
    function syncWindowSize() {
      setWindowSize({
        width: window.innerWidth || OVERLAY_BASE_WIDTH,
        height: window.innerHeight || expectedOverlayHeight(settings),
      });
    }

    syncWindowSize();
    window.addEventListener('resize', syncWindowSize);
    return () => window.removeEventListener('resize', syncWindowSize);
  }, [settings]);

  const baseWidth = expectedOverlayWidth(settings, streamState);
  const baseHeight = settings.fullscreen ? FULLSCREEN_BASE_HEIGHT : expectedOverlayHeight(settings);
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

function captionTranslation(line: DesktopCaptionLine, targetLanguage: string): DesktopCaptionTranslation | undefined {
  const translation = line.translations?.find((item) => item.targetLanguage === targetLanguage);
  if (translation) return translation;
  if (line.targetLanguage === 'none' || line.targetLanguage !== targetLanguage || !line.translatedText) return undefined;
  return {
    targetLanguage: line.targetLanguage,
    label: desktopTargetLanguageLabel(line.targetLanguage),
    translatedText: line.translatedText,
  };
}

function languagePillTone(status: DesktopCaptionLanguageState['status']) {
  if (status === 'error' || status === 'reconnecting') return 'border-rose-300/30 bg-rose-400/12 text-rose-50';
  return 'border-white/10 bg-white/10 text-white/86';
}

function clampTextStyle(fontPx: string, lines: number): CSSProperties {
  return {
    fontSize: fontPx,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    overflow: 'hidden',
  };
}

function resolveLanguageStates(streamState: CaptionStreamState) {
  const activeLanguages = activeDesktopTargetLanguages(streamState.targetLanguages, streamState.targetLanguage);
  const fallbackUpdatedAt = streamState.startedAt ?? new Date().toISOString();
  const fallbackStatus: DesktopCaptionLanguageState['status'] = streamState.running ? 'live' : 'connecting';
  const statesByLanguage = new Map(
    (streamState.languageStates ?? []).map((state) => [state.targetLanguage, state] as const),
  );

  return activeLanguages.map((targetLanguage) => statesByLanguage.get(targetLanguage) ?? {
    targetLanguage,
    label: desktopTargetLanguageLabel(targetLanguage),
    status: fallbackStatus,
    updatedAt: fallbackUpdatedAt,
  });
}

function OriginalOnlyDisplay({
  lines,
  settings,
  textScale,
}: {
  lines: DesktopCaptionLine[];
  settings: CaptionOverlaySettings;
  textScale: number;
}) {
  const visibleLines = lines.slice(-Math.max(1, settings.visibleLineCount));

  if (!settings.scrollMode) {
    const activeLine = visibleLines[visibleLines.length - 1];
    if (!activeLine) return null;

    return (
      <div className={cn('flex min-h-0 flex-1 flex-col justify-center overflow-hidden', settings.fullscreen ? 'px-[8vw] pb-[15vh]' : 'px-5 pb-4')}>
        <div className={cn('rounded-lg border border-white/8 bg-black/12', settings.fullscreen ? 'px-5 py-4' : 'px-3 py-2')}>
          <p
            className="leading-relaxed text-white/82"
            style={clampTextStyle(fontSize(settings.fullscreen ? 32 : 13, textScale), settings.fullscreen ? 3 : 2)}
          >
            {activeLine.originalText}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-0 flex-1 overflow-hidden', settings.fullscreen ? 'px-[7vw] pb-[22vh]' : 'px-5 pb-4')}>
      <div className={cn('flex h-full flex-col justify-end', settings.fullscreen ? 'gap-5' : 'gap-2.5')}>
        {visibleLines.map((line, index) => {
          const active = index === visibleLines.length - 1;
          return (
            <article
              key={line.id}
              className={cn(
                'rounded-lg border transition',
                settings.fullscreen ? 'px-6 py-5' : 'px-3 py-2',
                active
                  ? 'border-blue-300/35 bg-blue-400/15 shadow-lg shadow-blue-950/20'
                  : 'border-white/8 bg-white/[0.04] opacity-72',
              )}
            >
              <p
                className={cn('leading-relaxed', active ? 'text-white/82' : 'text-white/58')}
                style={clampTextStyle(fontSize(settings.fullscreen ? active ? 30 : 22 : active ? 12 : 10.5, textScale), settings.fullscreen ? active ? 3 : 2 : active ? 2 : 2)}
              >
                {line.originalText}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function LanguageCell({
  line,
  languageState,
  settings,
  textScale,
  active,
}: {
  line: DesktopCaptionLine;
  languageState: DesktopCaptionLanguageState;
  settings: CaptionOverlaySettings;
  textScale: number;
  active: boolean;
}) {
  const translation = captionTranslation(line, languageState.targetLanguage);
  const blocked = languageState.status !== 'live';
  const frozen = blocked && (typeof languageState.lastSequence !== 'number' || line.sequence > languageState.lastSequence);
  const cellTone = frozen
    ? 'border-rose-300/22 bg-rose-400/10'
    : active
      ? 'border-blue-300/35 bg-blue-400/15 shadow-lg shadow-blue-950/12'
      : 'border-white/8 bg-white/[0.045]';
  const bodyTone = frozen ? 'text-rose-50' : active ? 'text-white/92' : 'text-white/76';
  const bodySize = settings.fullscreen ? active ? 31 : 23 : active ? 15 : 11.5;
  const clampLines = settings.fullscreen ? active ? 4 : 3 : active ? 3 : 2;

  return (
    <article
      className={cn(
        'flex min-h-0 flex-col rounded-lg border transition',
        settings.fullscreen ? 'px-4 py-3' : 'px-3 py-2',
        cellTone,
      )}
    >
      {frozen ? (
        <div className="flex min-h-[64px] flex-1 items-center">
          <p className="text-xs font-semibold leading-relaxed text-rose-50/78">
            {languageState.message || '等待恢复'}
          </p>
        </div>
      ) : translation ? (
        <p
          className={cn('font-black leading-snug', bodyTone)}
          style={clampTextStyle(fontSize(bodySize, textScale), clampLines)}
        >
          {translation.translatedText}
        </p>
      ) : (
        <div className="flex min-h-[72px] flex-1 flex-col justify-center">
          <p className={cn('text-[11px] font-black uppercase tracking-[0.18em]', bodyTone)}>
            {languageState.message || '未生成译文'}
          </p>
        </div>
      )}
    </article>
  );
}

function LanguagePill({
  languageState,
  settings,
  textScale,
}: {
  languageState: DesktopCaptionLanguageState;
  settings: CaptionOverlaySettings;
  textScale: number;
}) {
  return (
    <div className="flex shrink-0 items-center">
      <span
        className={cn(
          'inline-flex max-w-full items-center rounded-full border px-3 py-1 font-black',
          languagePillTone(languageState.status),
        )}
        style={{ fontSize: fontSize(settings.fullscreen ? 14 : 11, textScale) }}
      >
        <span className="truncate">{languageState.label}</span>
      </span>
    </div>
  );
}

function MultilingualColumnDisplay({
  lines,
  settings,
  textScale,
  languageStates,
}: {
  lines: DesktopCaptionLine[];
  settings: CaptionOverlaySettings;
  textScale: number;
  languageStates: DesktopCaptionLanguageState[];
}) {
  const visibleLineCount = Math.max(1, settings.scrollMode ? settings.visibleLineCount : 1);
  const visibleRows = lines.slice(-visibleLineCount);
  const latestSequence = visibleRows[visibleRows.length - 1]?.sequence;
  const columns = settings.showTranslation ? languageStates : [];

  if (columns.length === 0) {
    return <OriginalOnlyDisplay lines={lines} settings={settings} textScale={textScale} />;
  }

  return (
    <div className={cn('min-h-0 flex-1 overflow-hidden', settings.fullscreen ? 'px-[4.5vw] pb-[12vh]' : 'px-5 pb-4')}>
      <div className={cn('flex h-full min-h-0 flex-col', settings.scrollMode ? 'justify-end' : 'justify-center', settings.fullscreen ? 'gap-5' : 'gap-3')}>
        <div
          className={cn('grid min-h-0 flex-1', settings.fullscreen ? 'gap-3' : 'gap-2.5')}
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {columns.map((languageState) => (
            <section key={languageState.targetLanguage} className={cn('flex min-h-0 flex-col', settings.fullscreen ? 'gap-3' : 'gap-2.5')}>
              <LanguagePill
                languageState={languageState}
                settings={settings}
                textScale={textScale}
              />
              <div className="min-h-0 flex-1 overflow-hidden">
                <div className={cn('flex h-full flex-col', settings.scrollMode ? 'justify-end' : 'justify-center', settings.fullscreen ? 'gap-3' : 'gap-2.5')}>
                  {visibleRows.map((line, rowIndex) => {
                    const active = rowIndex === visibleRows.length - 1;
                    return (
                      <div key={`${languageState.targetLanguage}-${line.id}`} className="min-h-0">
                        <LanguageCell
                          line={line}
                          languageState={languageState}
                          settings={settings}
                          textScale={textScale}
                          active={active && line.sequence === latestSequence}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>

        {settings.showOriginal && latestSequence && (
          <div className={cn('shrink-0 rounded-lg border border-white/8 bg-black/12', settings.fullscreen ? 'px-5 py-4' : 'px-3 py-2')}>
            <p
              className="leading-relaxed text-white/72"
              style={clampTextStyle(fontSize(settings.fullscreen ? 30 : 13, textScale), settings.fullscreen ? 3 : 2)}
            >
              {visibleRows[visibleRows.length - 1]?.originalText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function CaptionOverlayApp() {
  const [settings, setSettings] = useState<CaptionOverlaySettings>(DEFAULT_OVERLAY_SETTINGS);
  const [streamState, setStreamState] = useState<CaptionStreamState>(DEFAULT_CAPTION_STATE);
  const [lines, setLines] = useState<DesktopCaptionLine[]>([]);
  const [languageStates, setLanguageStates] = useState<DesktopCaptionLanguageState[]>([]);
  const activeLine = lines[lines.length - 1];
  const textScale = useWindowScale(settings, streamState);
  const sessionKey = `${streamState.startedAt ?? 'idle'}:${streamState.running ? 'running' : 'idle'}`;
  const previousSessionKeyRef = useRef(sessionKey);

  useEffect(() => {
    const api = window.knowlyDesktop;
    if (!api) return;

    void api.getOverlaySettings().then(setSettings);
    void api.getCaptionStreamState().then((state) => {
      setStreamState(state);
      setLanguageStates(state.languageStates ?? []);
    });

    const removeLineListener = api.onCaptionLine((line) => {
      setLines((current) => [...current, line].slice(-24));
    });
    const removeStateListener = api.onCaptionState((state) => {
      setStreamState(state);
      if (state.languageStates?.length) setLanguageStates(state.languageStates);
    });
    const removeLanguageStateListener = api.onCaptionLanguageStates(setLanguageStates);
    const removeSettingsListener = api.onOverlaySettings(setSettings);

    return () => {
      removeLineListener();
      removeStateListener();
      removeLanguageStateListener();
      removeSettingsListener();
    };
  }, []);

  useEffect(() => {
    if (previousSessionKeyRef.current === sessionKey) return;
    previousSessionKeyRef.current = sessionKey;

    if (streamState.running) {
      setLines([]);
      setLanguageStates(streamState.languageStates?.length ? streamState.languageStates : resolveLanguageStates(streamState));
      return;
    }

    setLines([]);
    setLanguageStates(streamState.languageStates ?? []);
  }, [sessionKey, streamState]);

  const resolvedLanguageStates = useMemo(() => resolveLanguageStates(streamState), [streamState]);

  const stateLabel = useMemo(() => {
    if (!streamState.running) return '待开始';
    if (streamState.paused) return '已暂停';
    return '';
  }, [streamState.paused, streamState.running]);

  function togglePause() {
    const api = window.knowlyDesktop;
    if (!api || !streamState.running) return;
    if (streamState.paused) {
      void api.resumeCaptionMockStream().then((state) => {
        setStreamState(state);
        if (state.languageStates?.length) setLanguageStates(state.languageStates);
      });
      return;
    }
    void api.pauseCaptionMockStream().then((state) => {
      setStreamState(state);
      if (state.languageStates?.length) setLanguageStates(state.languageStates);
    });
  }

  function stopCaptionStream() {
    const api = window.knowlyDesktop;
    if (!api) return;
    void api.stopCaptionMockStream().then((state) => {
      setStreamState(state);
      if (state.languageStates?.length) setLanguageStates(state.languageStates);
    });
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

        {!activeLine ? (
          <EmptyCaption textScale={textScale} />
        ) : settings.showTranslation ? (
          <MultilingualColumnDisplay
            lines={lines}
            settings={settings}
            textScale={textScale}
            languageStates={languageStates.length > 0 ? languageStates : resolvedLanguageStates}
          />
        ) : (
          <OriginalOnlyDisplay lines={lines} settings={settings} textScale={textScale} />
        )}
      </section>
    </div>
  );
}
