import { ArrowLeft, Pause, Play, RotateCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { SCENES } from '@/data/mockData';
import { applyTranslationMemory } from '@/lib/translationMemory';
import { cn } from '@/lib/utils';
import type { KnowlyService } from '@/services/knowlyService';
import type { ConversationTurn, ScenePrompt, TranslationMemoryEntry, TranslationSession } from '@/types';

interface FaceSessionScreenProps {
  sceneId: string;
  industryId: string;
  concise: boolean;
  scenes: ScenePrompt[];
  service: KnowlyService;
  translationMemory: TranslationMemoryEntry[];
  onBack: () => void;
  onSaveSession: (session: TranslationSession) => void;
}

type Speaker = ConversationTurn['speaker'];

function textForViewer(turn: ConversationTurn, viewer: Speaker) {
  return turn.speaker === viewer ? turn.sourceText : turn.translatedText;
}

function panelCopy(currentTurn: ConversationTurn | undefined, previousTurn: ConversationTurn | undefined, viewer: Speaker) {
  if (!currentTurn) {
    return {
      previous: '',
      current: viewer === 'me' ? '请说中文' : '请说印尼语',
    };
  }

  return {
    previous: previousTurn ? textForViewer(previousTurn, viewer) : '',
    current: textForViewer(currentTurn, viewer),
  };
}

interface ConversationPanelProps {
  speaker: Speaker;
  latestTurn?: ConversationTurn;
  previousTurn?: ConversationTurn;
  isFlipped?: boolean;
  isProcessing: boolean;
}

function ConversationPanel({
  speaker,
  latestTurn,
  previousTurn,
  isFlipped = false,
  isProcessing,
}: ConversationPanelProps) {
  const isCounterpart = speaker === 'counterpart';
  const copy = panelCopy(latestTurn, previousTurn, speaker);

  return (
    <section className={cn('flex-1 basis-0 min-h-0 overflow-hidden', isCounterpart ? 'bg-[#3B92D1] text-white' : 'bg-white text-slate-950')}>
      <div className={cn('h-full flex flex-col justify-between px-6 py-6 transition-transform duration-300 ease-out', isFlipped && 'rotate-180')}>
        <div className="space-y-5">
          <div className="flex items-start">
            <div>
              <h2 className="text-2xl font-bold">{isCounterpart ? '请说印尼语' : '请说中文'}</h2>
              <p className={cn('text-sm mt-0.5', isCounterpart ? 'text-sky-100/80' : 'text-slate-400')}>{isCounterpart ? 'Bahasa Indonesia' : 'Chinese'}</p>
            </div>
          </div>

          <div className={cn('rounded-3xl p-4 border', isCounterpart ? 'bg-white/12 border-white/15 shadow-sm' : 'bg-slate-50 border-slate-100')}>
            {copy.previous && (
              <p className={cn('text-xs leading-relaxed mb-3 line-clamp-2', isCounterpart ? 'text-sky-100/75' : 'text-slate-400')}>{copy.previous}</p>
            )}
            <p className="text-xl font-semibold leading-relaxed">{isProcessing ? (isCounterpart ? 'Menerjemahkan...' : '正在翻译...') : copy.current}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function RealtimeStatus({
  isPaused,
  onPauseToggle,
}: {
  isPaused: boolean;
  onPauseToggle: () => void;
}) {
  const audioBars = [0.36, 0.62, 0.42, 0.86, 0.54, 0.72, 0.48, 0.92, 0.58, 0.68];

  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex h-14 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 text-blue-700">
        <div className="flex h-7 items-end gap-1.5" aria-hidden="true">
          {audioBars.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className={cn('knowly-audio-bar w-2 rounded-full bg-blue-500', isPaused && 'opacity-35 [animation-play-state:paused]')}
              style={{ height: `${height * 100}%`, animationDelay: `${index * 74}ms` }}
            />
          ))}
        </div>
        <span className="shrink-0 text-base font-semibold">{isPaused ? '已暂停' : '即时翻译中'}</span>
      </div>
      <button
        type="button"
        onClick={onPauseToggle}
        aria-label={isPaused ? '继续即时翻译' : '暂停即时翻译'}
        className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#2D63FF] px-5 text-white shadow-md shadow-blue-200 transition active:scale-[0.98]"
      >
        {isPaused ? <Play className="h-5 w-5 fill-current stroke-[2.2]" /> : <Pause className="h-5 w-5 fill-current stroke-[2.2]" />}
        <span className="text-base font-semibold">{isPaused ? '继续' : '暂停'}</span>
      </button>
    </div>
  );
}

export function FaceSessionScreen({
  sceneId,
  industryId,
  concise,
  scenes,
  service,
  translationMemory,
  onBack,
  onSaveSession,
}: FaceSessionScreenProps) {
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [processingSpeaker, setProcessingSpeaker] = useState<Speaker | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCounterpartFlipped, setIsCounterpartFlipped] = useState(true);
  const isGeneratingRef = useRef(false);

  const scene = scenes.find((item) => item.id === sceneId) ?? SCENES[0];
  const latestTurn = turns[turns.length - 1];
  const previousTurn = turns[turns.length - 2];
  const canFinish = turns.length > 0;

  useEffect(() => {
    if (isPaused || isSaving || isGeneratingRef.current) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || isGeneratingRef.current) return;

      const speaker: Speaker = turns.length % 2 === 0 ? 'counterpart' : 'me';
      isGeneratingRef.current = true;
      setProcessingSpeaker(speaker);
      service.nextConversationTurn({ sceneId, speaker, turnIndex: turns.length })
        .then((turn) => {
          if (!cancelled) {
            setTurns((current) => [...current, applyTranslationMemory(turn, translationMemory)]);
          }
        })
        .finally(() => {
          isGeneratingRef.current = false;
          setProcessingSpeaker((current) => current === speaker ? null : current);
        });
    }, turns.length === 0 ? 650 : 2400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isPaused, isSaving, sceneId, service, translationMemory, turns.length]);

  async function saveAndFinish() {
    if (!canFinish || isSaving) return;
    setIsSaving(true);
    const summary = await service.createSummary(turns);
    const session: TranslationSession = {
      id: `session-${Date.now()}`,
      sceneId,
      industryId,
      concise,
      startedAt: new Date(Date.now() - turns.length * 90000).toISOString(),
      endedAt: new Date().toISOString(),
      turns,
      summary,
      favoriteTurnIds: [],
    };
    onSaveSession(session);
    setIsSaving(false);
  }

  async function handleExit() {
    if (isSaving) return;
    if (!canFinish) {
      onBack();
      return;
    }
    await saveAndFinish();
  }

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="h-screen bg-white flex flex-col overflow-hidden">
      <ConversationPanel
        speaker="counterpart"
        latestTurn={latestTurn}
        previousTurn={previousTurn}
        isFlipped={isCounterpartFlipped}
        isProcessing={processingSpeaker === 'counterpart'}
      />

      <div className="relative z-10 bg-white border-y border-slate-200 shadow-sm">
        <div className="px-3 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExit}
              disabled={isSaving}
              aria-label={canFinish ? '返回并自动生成纪要' : '返回'}
              className="min-h-11 shrink-0 rounded-2xl bg-red-50 px-3 text-base font-bold text-red-600 flex items-center justify-center gap-1.5 active:bg-red-100 disabled:opacity-60 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回</span>
            </button>

            <div className="min-w-0 flex-1 text-center">
              <p className="text-sm font-semibold text-slate-950 truncate">{scene.name}</p>
              <p className="text-xs text-slate-400">{isSaving ? '正在生成纪要' : `${turns.length} 条对话${concise ? ' · 商务简练' : ''}`}</p>
            </div>

            <button
              type="button"
              onClick={() => setIsCounterpartFlipped((current) => !current)}
              className={cn(
                'min-h-11 px-3 rounded-2xl flex items-center gap-1.5 text-sm font-semibold transition-colors',
                isCounterpartFlipped ? 'bg-blue-50 text-blue-700 active:bg-blue-100' : 'bg-slate-100 text-slate-700 active:bg-slate-200',
              )}
            >
              <RotateCw className="w-4 h-4" />
              {isCounterpartFlipped ? '上屏翻转' : '上屏同向'}
            </button>
          </div>
        </div>
      </div>

      <ConversationPanel
        speaker="me"
        latestTurn={latestTurn}
        previousTurn={previousTurn}
        isProcessing={processingSpeaker === 'me'}
      />

      <footer className="relative z-20 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
        <RealtimeStatus isPaused={isPaused} onPauseToggle={() => setIsPaused((current) => !current)} />
      </footer>
    </motion.div>
  );
}
