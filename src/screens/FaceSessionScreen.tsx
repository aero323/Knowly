import { ArrowLeft, Check, Copy, Mic, Plus, RotateCw, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { INDUSTRIES, SCENES } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { KnowlyService } from '@/services/knowlyService';
import type { ConversationTurn, ScenePrompt, TermEntry, TranslationSession } from '@/types';

interface FaceSessionScreenProps {
  sceneId: string;
  industryId: string;
  concise: boolean;
  scenes: ScenePrompt[];
  terms: TermEntry[];
  service: KnowlyService;
  onBack: () => void;
  onSaveSession: (session: TranslationSession) => void;
  onAddTerm: (term: TermEntry) => void;
}

type Speaker = ConversationTurn['speaker'];

function buildTermEntry(term: string, category: string): TermEntry {
  return {
    id: `term-${term}-${Date.now()}`,
    zh: term,
    idText: term === '滞港费' ? 'biaya demurrage' : term === '装箱单' ? 'packing list' : term,
    category,
    note: '从面对面翻译会话加入',
    source: 'session',
    createdAt: new Date().toISOString(),
  };
}

function textForViewer(turn: ConversationTurn, viewer: Speaker) {
  return turn.speaker === viewer ? turn.sourceText : turn.translatedText;
}

function panelCopy(currentTurn: ConversationTurn | undefined, previousTurn: ConversationTurn | undefined, viewer: Speaker) {
  if (!currentTurn) {
    return {
      previous: '',
      current: viewer === 'me' ? '点击麦克风，说一句中文' : 'Tekan mikrofon untuk mulai',
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
  isListening: boolean;
  disabled: boolean;
  onListen: (speaker: Speaker) => void;
}

function ConversationPanel({
  speaker,
  latestTurn,
  previousTurn,
  isFlipped = false,
  isListening,
  disabled,
  onListen,
}: ConversationPanelProps) {
  const isCounterpart = speaker === 'counterpart';
  const copy = panelCopy(latestTurn, previousTurn, speaker);

  return (
    <section className={cn('flex-1 basis-0 min-h-0 overflow-hidden', isCounterpart ? 'bg-[#3B92D1] text-white' : 'bg-white text-slate-950')}>
      <div className={cn('h-full flex flex-col justify-between px-6 py-6 transition-transform duration-300 ease-out', isFlipped && 'rotate-180')}>
        <div className="space-y-5">
          <div className="flex items-start">
            <div>
              <p className={cn('text-sm font-medium', isCounterpart ? 'text-sky-100' : 'text-slate-400')}>{isCounterpart ? '对方' : '我方'}</p>
              <h2 className="text-2xl font-bold mt-1">{isCounterpart ? '印尼语' : '中文(简体)'}</h2>
              <p className={cn('text-sm mt-0.5', isCounterpart ? 'text-sky-100/80' : 'text-slate-400')}>{isCounterpart ? 'Bahasa Indonesia' : 'Chinese'}</p>
            </div>
          </div>

          <div className={cn('rounded-3xl p-4 border', isCounterpart ? 'bg-white/12 border-white/15 shadow-sm' : 'bg-slate-50 border-slate-100')}>
            {copy.previous && (
              <p className={cn('text-xs leading-relaxed mb-3 line-clamp-2', isCounterpart ? 'text-sky-100/75' : 'text-slate-400')}>{copy.previous}</p>
            )}
            <p className="text-xl font-semibold leading-relaxed">{isListening ? (isCounterpart ? 'Mendengarkan...' : '正在翻译...') : copy.current}</p>
          </div>
        </div>

        <div className="pb-1">
          <button
            type="button"
            onClick={() => onListen(speaker)}
            disabled={disabled}
            aria-label={isCounterpart ? '请说印尼语' : '我说中文'}
            className={cn(
              'min-h-14 w-full rounded-2xl px-5 flex items-center justify-center gap-2.5 text-base font-semibold shadow-lg transition active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100',
              isCounterpart ? 'bg-white text-[#2F82C5] shadow-slate-900/20' : 'bg-[#2D63FF] text-white shadow-blue-300/60',
              isListening && 'ring-4 ring-white/30',
            )}
          >
            <Mic className="w-5 h-5 stroke-[2]" />
            {isListening ? (isCounterpart ? '正在听印尼语' : '正在听中文') : (isCounterpart ? '请说印尼语' : '我说中文')}
          </button>
        </div>
      </div>
    </section>
  );
}

export function FaceSessionScreen({
  sceneId,
  industryId,
  concise,
  scenes,
  terms,
  service,
  onBack,
  onSaveSession,
  onAddTerm,
}: FaceSessionScreenProps) {
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [favoriteTurnIds, setFavoriteTurnIds] = useState<string[]>([]);
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [listeningSpeaker, setListeningSpeaker] = useState<Speaker | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCounterpartFlipped, setIsCounterpartFlipped] = useState(true);

  const scene = scenes.find((item) => item.id === sceneId) ?? SCENES[0];
  const industry = INDUSTRIES.find((item) => item.id === industryId) ?? INDUSTRIES[0];
  const latestTurn = turns[turns.length - 1];
  const previousTurn = turns[turns.length - 2];
  const canFinish = turns.length > 0;
  const knownTerms = useMemo(() => new Set(terms.map((term) => term.zh)), [terms]);
  const latestIsFavorite = latestTurn ? favoriteTurnIds.includes(latestTurn.id) : false;

  async function addNextTurn(speaker: Speaker) {
    if (listeningSpeaker) return;
    setListeningSpeaker(speaker);
    const turn = await service.nextConversationTurn({ sceneId, speaker, turnIndex: turns.length });
    setTurns((current) => [...current, turn]);
    setListeningSpeaker(null);
  }

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
      favoriteTurnIds,
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

  function copyLatestTurn() {
    if (!latestTurn) return;
    setCopiedTurnId(latestTurn.id);
    void navigator.clipboard?.writeText(latestTurn.translatedText).catch(() => undefined);
    window.setTimeout(() => setCopiedTurnId(null), 1200);
  }

  function toggleLatestFavorite() {
    if (!latestTurn) return;
    setFavoriteTurnIds((current) => current.includes(latestTurn.id) ? current.filter((id) => id !== latestTurn.id) : [...current, latestTurn.id]);
  }

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="h-screen bg-white flex flex-col overflow-hidden">
      <ConversationPanel
        speaker="counterpart"
        latestTurn={latestTurn}
        previousTurn={previousTurn}
        isFlipped={isCounterpartFlipped}
        isListening={listeningSpeaker === 'counterpart'}
        disabled={Boolean(listeningSpeaker)}
        onListen={addNextTurn}
      />

      <div className="relative z-10 bg-white border-y border-slate-200 shadow-sm">
        <div className="px-3 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExit}
              disabled={isSaving}
              aria-label={canFinish ? '返回并自动生成纪要' : '返回'}
              className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center active:bg-slate-200 disabled:opacity-60 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0 flex-1 text-center">
              <p className="text-sm font-semibold text-slate-950 truncate">{scene.name} · {industry.name}</p>
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

          {latestTurn && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={toggleLatestFavorite}
                className={cn('min-h-10 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors', latestIsFavorite ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 active:bg-slate-200')}
              >
                <Star className={cn('w-3.5 h-3.5', latestIsFavorite && 'fill-current')} />
                {latestIsFavorite ? '已收藏' : '收藏'}
              </button>
              <button
                type="button"
                onClick={copyLatestTurn}
                className="min-h-10 px-3 rounded-xl bg-slate-100 text-xs font-medium text-slate-600 flex items-center gap-1.5 active:bg-slate-200 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedTurnId === latestTurn.id ? '已复制' : '复制译文'}
              </button>
              {latestTurn.terms.map((term) => {
                const isKnown = knownTerms.has(term);
                return (
                  <button
                    type="button"
                    key={term}
                    disabled={isKnown}
                    onClick={() => onAddTerm(buildTermEntry(term, industry.name))}
                    className={cn(
                      'min-h-10 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors',
                      isKnown ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600 active:bg-slate-200',
                    )}
                  >
                    {isKnown ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {term}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConversationPanel
        speaker="me"
        latestTurn={latestTurn}
        previousTurn={previousTurn}
        isListening={listeningSpeaker === 'me'}
        disabled={Boolean(listeningSpeaker)}
        onListen={addNextTurn}
      />
    </motion.div>
  );
}
