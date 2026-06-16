import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Captions, EyeOff, GripHorizontal, Pause, Play, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CaptionOverlaySettings, CaptionStreamState, DesktopCaptionLine } from '../shared/desktopApi';

const DEFAULT_OVERLAY_SETTINGS: CaptionOverlaySettings = {
  visible: false,
  dock: 'right',
  opacity: 0.9,
  fontScale: 1,
  showOriginal: true,
  showTranslation: true,
  compact: false,
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
    <div className={cn('min-h-0 flex-1 overflow-hidden', settings.compact ? 'px-4 pb-3' : 'px-5 pb-4')}>
      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-bold text-white/45">
        <span>#{line.sequence} · {line.startedAt}</span>
        <span>{Math.round(line.confidence * 100)}%</span>
      </div>

      {settings.showTranslation && (
        <p className={cn('font-black leading-snug text-white', settings.compact ? 'text-lg' : 'text-xl')}>
          {line.translatedText}
        </p>
      )}
      {settings.showOriginal && (
        <p className={cn('mt-2 leading-relaxed text-white/58', settings.compact ? 'text-xs' : 'text-sm')}>
          {line.originalText}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {line.keywords.slice(0, settings.compact ? 2 : 4).map((keyword) => (
          <span key={keyword} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[11px] font-bold text-amber-200">
            {keyword}
          </span>
        ))}
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
      setLines((current) => [...current, line].slice(-12));
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
    return '实时中';
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

  function hideOverlay() {
    void window.knowlyDesktop?.hideOverlay().then(setSettings);
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-2">
      <section
        className="knowly-drag flex h-full w-full flex-col overflow-hidden rounded-lg border border-white/10 bg-slate-950/92 text-white shadow-2xl shadow-black/35 backdrop-blur-xl"
        style={{ opacity: settings.opacity, fontSize: `${settings.fontScale}rem` }}
      >
        <header className={cn('flex shrink-0 items-center justify-between gap-3 border-b border-white/8', settings.compact ? 'h-11 px-3' : 'h-13 px-4 py-3')}>
          <div className="flex min-w-0 items-center gap-2">
            <GripHorizontal className="h-4 w-4 shrink-0 text-white/34" />
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-200">
              <Radio className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-white">Knowly 字幕</p>
              <p className="truncate text-[11px] font-semibold text-white/45">{stateLabel} · {streamState.lineCount} 句</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <OverlayButton label={streamState.paused ? '继续' : '暂停'} onClick={togglePause}>
              {streamState.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </OverlayButton>
            <OverlayButton label="隐藏浮层" onClick={hideOverlay}>
              <EyeOff className="h-4 w-4" />
            </OverlayButton>
          </div>
        </header>

        {activeLine ? <CaptionDisplay line={activeLine} settings={settings} /> : <EmptyCaption compact={settings.compact} />}
      </section>
    </div>
  );
}
