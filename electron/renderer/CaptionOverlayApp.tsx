import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Captions, GripHorizontal, Maximize2, Minimize2, Pause, Play, Radio, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CaptionOverlaySettings, CaptionStreamState, DesktopCaptionLine } from '../shared/desktopApi';

const DEFAULT_OVERLAY_SETTINGS: CaptionOverlaySettings = {
  visible: false,
  opacity: 0.9,
  fontScale: 1,
  showOriginal: true,
  showTranslation: true,
  compact: false,
  scrollMode: false,
  visibleLineCount: 5,
  fullscreen: false,
};

const DEFAULT_CAPTION_STATE: CaptionStreamState = {
  running: false,
  paused: false,
  lineCount: 0,
  sourceDevice: 'system-mix',
  sourceLanguage: 'auto',
  targetLanguage: 'zh',
};

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

function EmptyCaption({ compact }: { compact: boolean }) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col items-center justify-center text-center', compact ? 'px-4' : 'px-6')}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-emerald-300">
        <Captions className="h-6 w-6" />
      </div>
      <p className="text-base font-black text-white">等待字幕</p>
      <p className="mt-1 text-xs leading-relaxed text-white/52">从主窗口开始字幕同传后，这里会持续显示翻译结果。</p>
    </div>
  );
}

function CaptionDisplay({ line, settings }: { line: DesktopCaptionLine; settings: CaptionOverlaySettings }) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col justify-center overflow-hidden',
        settings.fullscreen ? 'px-[8vw] pb-[10vh]' : settings.compact ? 'px-4 pb-3' : 'px-5 pb-4',
      )}
    >
      {settings.showTranslation && (
        <p className={cn('font-black leading-snug text-white', settings.fullscreen ? 'text-6xl' : settings.compact ? 'text-lg' : 'text-xl')}>
          {line.translatedText}
        </p>
      )}
      {settings.showOriginal && (
        <p className={cn('leading-relaxed text-white/58', settings.fullscreen ? 'mt-6 text-3xl' : settings.compact ? 'mt-2 text-xs' : 'mt-2 text-sm')}>
          {line.originalText}
        </p>
      )}
    </div>
  );
}

function ScrollingCaptionDisplay({ lines, settings }: { lines: DesktopCaptionLine[]; settings: CaptionOverlaySettings }) {
  const visibleLines = lines.slice(-settings.visibleLineCount);

  return (
    <div className={cn('min-h-0 flex-1 overflow-hidden', settings.fullscreen ? 'px-[7vw] pb-[7vh]' : settings.compact ? 'px-4 pb-3' : 'px-5 pb-4')}>
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
                  : 'border-white/8 bg-white/[0.04] opacity-55',
              )}
            >
              {settings.showTranslation && (
                <p
                  className={cn(
                    'font-black leading-snug',
                    settings.fullscreen
                      ? active ? 'text-5xl text-white' : 'text-3xl text-white/76'
                      : active ? 'text-base text-white' : 'text-sm text-white/76',
                  )}
                >
                  {line.translatedText}
                </p>
              )}
              {settings.showOriginal && (
                <p
                  className={cn(
                    'leading-relaxed',
                    settings.fullscreen
                      ? active ? 'mt-3 text-2xl text-white/62' : 'mt-2 text-xl text-white/42'
                      : active ? 'mt-1 text-xs text-white/62' : 'mt-1 text-[11px] text-white/42',
                  )}
                >
                  {line.originalText}
                </p>
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
        style={{ opacity: settings.opacity, fontSize: `${settings.fontScale}rem` }}
      >
        <header
          className={cn(
            'flex shrink-0 items-center justify-between gap-3 border-b border-white/8',
            settings.fullscreen ? 'h-[72px] px-8 py-4' : settings.compact ? 'h-11 px-3' : 'h-[52px] px-4 py-3',
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <GripHorizontal className={cn('shrink-0 text-white/34', settings.fullscreen ? 'h-5 w-5' : 'h-4 w-4')} />
            <div className={cn('flex shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-200', settings.fullscreen ? 'h-10 w-10' : 'h-8 w-8')}>
              <Radio className={cn(settings.fullscreen ? 'h-5 w-5' : 'h-4 w-4')} />
            </div>
            <div className="min-w-0">
              <p className={cn('truncate font-black text-white', settings.fullscreen ? 'text-base' : 'text-xs')}>Knowly 字幕</p>
              {stateLabel && <p className={cn('truncate font-semibold text-white/45', settings.fullscreen ? 'text-sm' : 'text-[11px]')}>{stateLabel}</p>}
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
            ? <ScrollingCaptionDisplay lines={lines} settings={settings} />
            : <CaptionDisplay line={activeLine} settings={settings} />
        ) : (
          <EmptyCaption compact={settings.compact} />
        )}
      </section>
    </div>
  );
}
