import { Pause, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { type KeyboardEvent, useEffect, useState } from 'react';
import { ScreenHeader } from '@/components/ScreenHeader';
import { cn } from '@/lib/utils';
import type { KnowlyService } from '@/services/knowlyService';
import type { SimultaneousCaption, SimultaneousSpeakerId } from '@/types';

interface SimultaneousScreenProps {
  service: KnowlyService;
  onBack: () => void;
}

type EditingTarget = {
  speakerId: SimultaneousSpeakerId;
  targetId: string;
} | null;

type SourceLanguageChoice = 'auto' | 'id' | 'zh' | 'en';
type TargetLanguageChoice = 'zh' | 'id' | 'en' | 'ja';

const SPEAKERS: SimultaneousSpeakerId[] = ['speaker-1', 'speaker-2'];

const DEFAULT_SPEAKER_NAMES: Record<SimultaneousSpeakerId, string> = {
  'speaker-1': '说话人 1',
  'speaker-2': '说话人 2',
};

const SOURCE_LANGUAGE_OPTIONS: Array<{ value: SourceLanguageChoice; label: string }> = [
  { value: 'auto', label: '自动识别' },
  { value: 'id', label: '印尼语' },
  { value: 'zh', label: '中文' },
  { value: 'en', label: '英语' },
];

const TARGET_LANGUAGE_OPTIONS: Array<{ value: TargetLanguageChoice; label: string }> = [
  { value: 'zh', label: '中文' },
  { value: 'id', label: '印尼语' },
  { value: 'en', label: '英语' },
  { value: 'ja', label: '日语' },
];

const SPEAKER_STYLES: Record<SimultaneousSpeakerId, {
  badge: string;
}> = {
  'speaker-1': {
    badge: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  'speaker-2': {
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  },
};

interface SpeakerNameControlProps {
  speakerId: SimultaneousSpeakerId;
  targetId: string;
  names: Record<SimultaneousSpeakerId, string>;
  editingTarget: EditingTarget;
  draftName: string;
  compact?: boolean;
  active?: boolean;
  onBeginRename: (speakerId: SimultaneousSpeakerId, targetId: string) => void;
  onCancelRename: () => void;
  onCommitRename: () => void;
  onDraftNameChange: (value: string) => void;
}

function SpeakerNameControl({
  speakerId,
  targetId,
  names,
  editingTarget,
  draftName,
  compact = false,
  active = false,
  onBeginRename,
  onCancelRename,
  onCommitRename,
  onDraftNameChange,
}: SpeakerNameControlProps) {
  const isEditing = editingTarget?.speakerId === speakerId && editingTarget.targetId === targetId;
  const style = SPEAKER_STYLES[speakerId];

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onCancelRename();
    }
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        value={draftName}
        aria-label="说话人名称"
        onBlur={onCommitRename}
        onChange={(event) => onDraftNameChange(event.target.value)}
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={handleKeyDown}
        className={cn(
          'min-h-10 rounded-xl border border-blue-200 bg-white px-3 font-semibold text-slate-950 shadow-sm outline-none ring-2 ring-blue-100',
          compact ? 'w-32 text-sm' : 'w-full text-base',
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => onBeginRename(speakerId, targetId)}
      className={cn(
        'min-h-10 max-w-full rounded-xl border font-semibold transition active:scale-[0.98]',
        style.badge,
        active && 'ring-2 ring-blue-100 shadow-sm',
        compact ? 'px-2.5 text-xs inline-flex items-center' : 'w-full px-3 text-left flex items-center',
      )}
    >
      <span className="truncate">{names[speakerId]}</span>
    </button>
  );
}

export function SimultaneousScreen({ service, onBack }: SimultaneousScreenProps) {
  const [captions, setCaptions] = useState<SimultaneousCaption[]>([]);
  const [paused, setPaused] = useState(false);
  const [speakerNames, setSpeakerNames] = useState<Record<SimultaneousSpeakerId, string>>(DEFAULT_SPEAKER_NAMES);
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null);
  const [draftName, setDraftName] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<SourceLanguageChoice>('auto');
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguageChoice>('zh');

  useEffect(() => {
    let mounted = true;
    service.simultaneousLines().then((data) => {
      if (mounted) setCaptions(data);
    });
    return () => {
      mounted = false;
    };
  }, [service]);

  const activeCaption = captions[captions.length - 1];

  function beginRename(speakerId: SimultaneousSpeakerId, targetId: string) {
    setEditingTarget({ speakerId, targetId });
    setDraftName(speakerNames[speakerId]);
  }

  function cancelRename() {
    setEditingTarget(null);
    setDraftName('');
  }

  function commitRename() {
    if (!editingTarget) return;

    const nextName = draftName.trim();
    if (nextName) {
      setSpeakerNames((current) => ({
        ...current,
        [editingTarget.speakerId]: nextName,
      }));
    }

    setEditingTarget(null);
    setDraftName('');
  }

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="min-h-full bg-slate-50">
      <ScreenHeader
        title="同声传译"
        onBack={onBack}
        below={
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <label className="min-w-0">
              <span className="mb-1 block text-[11px] font-semibold text-slate-400">识别语言</span>
              <select
                value={sourceLanguage}
                onChange={(event) => setSourceLanguage(event.target.value as SourceLanguageChoice)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                {SOURCE_LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <span className="pb-2.5 text-sm font-semibold text-slate-300">→</span>
            <label className="min-w-0">
              <span className="mb-1 block text-[11px] font-semibold text-slate-400">翻译语言</span>
              <select
                value={targetLanguage}
                onChange={(event) => setTargetLanguage(event.target.value as TargetLanguageChoice)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                {TARGET_LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        }
      />

      <div className="p-4 space-y-4 pb-8">
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-4 text-white shadow-xl shadow-slate-200">
          <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_30%_0%,rgba(59,130,246,0.42),transparent_62%)]" />
          <div className="relative space-y-5">
            <div className="min-w-0">
              <h2 className="text-xl font-bold leading-tight">
                {activeCaption ? activeCaption.translatedText : '等待会议内容'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {activeCaption ? activeCaption.originalText : '会议内容会显示在这里。'}
              </p>
            </div>

            <div className="flex h-12 items-end gap-1.5 rounded-2xl bg-white/8 px-3 py-2">
              {[0.46, 0.82, 0.34, 0.92, 0.55, 0.76, 0.38, 0.88, 0.48, 0.7, 0.42, 0.64].map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className={cn('knowly-audio-bar flex-1 rounded-full bg-blue-300', paused && 'opacity-30 [animation-play-state:paused]')}
                  style={{ height: `${height * 100}%`, animationDelay: `${index * 64}ms` }}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
                className="min-h-12 flex-1 rounded-2xl bg-white px-4 font-semibold text-slate-950 shadow-lg shadow-black/10 active:scale-[0.99] transition flex items-center justify-center gap-2"
              >
                {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {paused ? '继续同传' : '暂停同传'}
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-2">
          {SPEAKERS.map((speakerId) => (
            <div key={speakerId}>
              <SpeakerNameControl
                compact
                active={activeCaption?.speakerId === speakerId && !paused}
                speakerId={speakerId}
                targetId={`speaker-row-${speakerId}`}
                names={speakerNames}
                editingTarget={editingTarget}
                draftName={draftName}
                onBeginRename={beginRename}
                onCancelRename={cancelRename}
                onCommitRename={commitRename}
                onDraftNameChange={setDraftName}
              />
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {captions.map((caption) => {
            const isActive = activeCaption?.id === caption.id && !paused;
            const style = SPEAKER_STYLES[caption.speakerId];

            return (
              <article
                key={caption.id}
                className={cn(
                  'border-b border-slate-100 px-3.5 py-3 last:border-b-0 transition',
                  isActive && 'bg-blue-50/60',
                )}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={cn(
                      'inline-flex h-8 max-w-full items-center rounded-lg border px-2.5 text-xs font-semibold',
                      style.badge,
                      isActive && 'ring-2 ring-blue-100',
                    )}
                  >
                    <span className="truncate">{speakerNames[caption.speakerId]}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">{caption.startedAt}</span>
                </div>

                <p className="text-[13px] leading-relaxed text-slate-500">{caption.originalText}</p>
                <p className="mt-1.5 text-[15px] font-semibold leading-relaxed text-slate-950">{caption.translatedText}</p>
              </article>
            );
          })}
        </section>
      </div>
    </motion.div>
  );
}
