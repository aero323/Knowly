import { useState } from 'react';
import { Camera, CheckSquare, ChevronDown, ClipboardCheck, Copy, FileText, Images, MessagesSquare, Pencil } from 'lucide-react';
import { motion } from 'motion/react';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { ConversationSpeaker, ConversationTurn, TranslationMemoryEntry, TranslationSession } from '@/types';

interface SummaryScreenProps {
  session?: TranslationSession;
  onBack: () => void;
  onUpdateSession: (session: TranslationSession) => void;
  onRememberCorrection: (memory: Omit<TranslationMemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const TRANSCRIPT_SPEAKERS: ConversationSpeaker[] = ['me', 'counterpart'];

function formatTurnTime(startedAt: string, index: number) {
  const startTime = new Date(startedAt).getTime();
  const baseTime = Number.isNaN(startTime) ? Date.now() : startTime;
  return new Date(baseTime + index * 90_000).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function defaultSpeakerLabel(speaker: ConversationSpeaker) {
  return speaker === 'me' ? '说话人 1' : '说话人 2';
}

function speakerLabel(speaker: ConversationSpeaker, speakerNames?: Partial<Record<ConversationSpeaker, string>>) {
  return speakerNames?.[speaker] || defaultSpeakerLabel(speaker);
}

function buildTranscriptTurns(turns: ConversationTurn[], session?: TranslationSession) {
  const hasCounterpart = turns.some((turn) => turn.speaker === 'counterpart');
  if (hasCounterpart || turns.length === 0) return turns;

  return [
    ...turns,
    {
      id: 'mock-counterpart-follow-up',
      speaker: 'counterpart',
      sourceLanguage: 'id',
      targetLanguage: 'zh',
      sourceText: 'Baik, saya akan cek dulu dan mengirimkan informasi lengkap sore ini.',
      translatedText: '好的，我先确认一下，今天下午把完整信息发给你。',
      terms: ['确认', '完整信息'],
    } satisfies ConversationTurn,
    {
      id: 'mock-me-reminder',
      speaker: 'me',
      sourceLanguage: 'zh',
      targetLanguage: 'id',
      sourceText: '请同时确认负责人和最晚回复时间，方便我们安排付款。',
      translatedText: 'Tolong sekaligus konfirmasi penanggung jawab dan batas waktu balasan, agar kami bisa mengatur pembayaran.',
      terms: ['负责人', '最晚回复时间', '付款'],
    } satisfies ConversationTurn,
    {
      id: 'mock-counterpart-deadline',
      speaker: 'counterpart',
      sourceLanguage: 'id',
      targetLanguage: 'zh',
      sourceText: 'Baik, PIC-nya Pak Budi. Saya usahakan kirim sebelum jam lima sore.',
      translatedText: '好的，负责人是 Budi 先生。我尽量在下午五点前发送。',
      terms: ['负责人', '下午五点'],
    } satisfies ConversationTurn,
  ].map((turn) => session?.turns.find((item) => item.id === turn.id) ?? turn);
}

function shouldShowTranslation(turn: ConversationTurn) {
  return turn.translatedText.trim() && turn.translatedText !== turn.sourceText;
}

function buildTranscriptCopyText(turns: ConversationTurn[], startedAt: string, speakerNames?: Partial<Record<ConversationSpeaker, string>>) {
  return turns.map((turn, index) => {
    const lines = [
      `${speakerLabel(turn.speaker, speakerNames)} ${formatTurnTime(startedAt, index)}`,
      `原文：${turn.sourceText}`,
    ];
    if (turn.translatedText.trim() && turn.translatedText !== turn.sourceText) {
      lines.push(`译文：${turn.translatedText}`);
    }
    return lines.join('\n');
  }).join('\n\n');
}

function buildTodosCopyText(todos: string[]) {
  return todos.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

export function SummaryScreen({ session, onBack, onUpdateSession, onRememberCorrection }: SummaryScreenProps) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [isTodosOpen, setIsTodosOpen] = useState(true);
  const [isTodosCopied, setIsTodosCopied] = useState(false);
  const [isTranscriptCopied, setIsTranscriptCopied] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<ConversationSpeaker | null>(null);
  const [speakerDraft, setSpeakerDraft] = useState('');
  const [editingTurnId, setEditingTurnId] = useState<string | null>(null);
  const [translationDraft, setTranslationDraft] = useState('');
  const [rememberedTurnId, setRememberedTurnId] = useState<string | null>(null);

  if (!session) {
    return (
      <div className="min-h-full bg-slate-50">
        <ScreenHeader title="会话总结" subtitle="未找到会话" onBack={onBack} />
        <div className="p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-sm text-gray-600">这条会话可能已被清除，请返回重新开始。</div>
        </div>
      </div>
    );
  }

  const transcriptTurns = buildTranscriptTurns(session.turns, session);
  const speakerNames = session.speakerNames;
  const isPhotoTranslation = Boolean(session.photoTranslation);

  async function copyTranscript() {
    const copyText = buildTranscriptCopyText(transcriptTurns, session.startedAt, speakerNames);
    await navigator.clipboard?.writeText(copyText).catch(() => undefined);
    setIsTranscriptCopied(true);
    window.setTimeout(() => setIsTranscriptCopied(false), 1400);
  }

  async function copyTodos() {
    await navigator.clipboard?.writeText(buildTodosCopyText(session.summary.todos)).catch(() => undefined);
    setIsTodosCopied(true);
    window.setTimeout(() => setIsTodosCopied(false), 1400);
  }

  function startSpeakerEdit(speaker: ConversationSpeaker) {
    setEditingSpeaker(speaker);
    setSpeakerDraft(speakerLabel(speaker, speakerNames));
  }

  function saveSpeakerName() {
    if (!editingSpeaker) return;
    const nextName = speakerDraft.trim() || defaultSpeakerLabel(editingSpeaker);
    onUpdateSession({
      ...session,
      speakerNames: {
        ...session.speakerNames,
        [editingSpeaker]: nextName,
      },
    });
    setEditingSpeaker(null);
    setSpeakerDraft('');
  }

  function startCorrection(turn: ConversationTurn) {
    setEditingTurnId(turn.id);
    setTranslationDraft(turn.translatedText);
  }

  function cancelCorrection() {
    setEditingTurnId(null);
    setTranslationDraft('');
  }

  function saveCorrection(turn: ConversationTurn) {
    const correctedText = translationDraft.trim();
    if (!correctedText) return;

    const updateTurn = (item: ConversationTurn) => (
      item.id === turn.id
        ? {
            ...item,
            translatedText: correctedText,
          }
        : item
    );

    const hasStoredTurn = session.turns.some((item) => item.id === turn.id);
    onUpdateSession({
      ...session,
      turns: hasStoredTurn ? session.turns.map(updateTurn) : [...session.turns, updateTurn(turn)],
    });
    onRememberCorrection({
      sourceLanguage: turn.sourceLanguage,
      targetLanguage: turn.targetLanguage,
      sourceText: turn.sourceText,
      originalTranslatedText: turn.translatedText,
      correctedText,
    });
    setEditingTurnId(null);
    setTranslationDraft('');
    setRememberedTurnId(turn.id);
    window.setTimeout(() => setRememberedTurnId((current) => current === turn.id ? null : current), 1600);
  }

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="min-h-full bg-slate-50">
      <ScreenHeader title={isPhotoTranslation ? '拍照翻译记录' : '会话总结'} onBack={onBack} />

      <div className="p-4 space-y-4">
        {!isPhotoTranslation && (
          <section className="bg-white border border-gray-200 rounded-2xl p-4">
            <h2 className="text-lg font-semibold text-gray-950">{session.summary.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{session.turns.length} 条对话 · {new Date(session.endedAt).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
          </section>
        )}

        {session.photoTranslation && (
          <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-gray-950">
              <Images className="w-4 h-4 text-blue-600" />
              图片翻译
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '原图', imageUrl: session.photoTranslation.originalImageUrl, icon: Camera },
                { label: '译图', imageUrl: session.photoTranslation.translatedImageUrl, icon: FileText },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <article key={item.label} className="overflow-hidden rounded-2xl border border-gray-200 bg-slate-950">
                    <div className="flex min-h-9 items-center gap-1.5 bg-white px-3 text-xs font-semibold text-gray-700">
                      <ItemIcon className="h-3.5 w-3.5 text-blue-600" />
                      {item.label}
                    </div>
                    <img src={item.imageUrl} alt={item.label} className="aspect-[3/4] w-full bg-slate-900 object-cover" />
                  </article>
                );
              })}
            </div>
            <p className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-medium leading-5 text-blue-700">{session.photoTranslation.sourceType}</p>
          </section>
        )}

        <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <button
            type="button"
            onClick={() => setIsSummaryOpen((open) => !open)}
            aria-expanded={isSummaryOpen}
            className="min-h-11 w-full flex items-center justify-between gap-3 text-left text-gray-950 font-semibold"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              摘要
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSummaryOpen ? 'rotate-180' : ''}`} />
          </button>
          {isSummaryOpen && (
            <div className="space-y-2">
              {session.summary.minutes.map((item) => (
                <p key={item} className="text-sm leading-relaxed text-gray-700 bg-gray-50 rounded-2xl p-3">{item}</p>
              ))}
            </div>
          )}
        </section>

        {!isPhotoTranslation && (
          <>
            <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsTodosOpen((open) => !open)}
                  aria-expanded={isTodosOpen}
                  className="min-h-11 min-w-0 flex-1 flex items-center justify-between gap-3 text-left text-gray-950 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    待办事项
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isTodosOpen ? 'rotate-180' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={copyTodos}
                  className="min-h-10 rounded-xl px-3 text-xs font-semibold text-blue-600 active:bg-blue-50 inline-flex items-center gap-1.5"
                >
                  {isTodosCopied ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {isTodosCopied ? '已复制' : '复制'}
                </button>
              </div>
              {isTodosOpen && session.summary.todos.map((item) => (
                <label key={item} className="min-h-11 flex items-center gap-3 text-sm text-gray-700">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                  <span>{item}</span>
                </label>
              ))}
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-gray-950 font-semibold">
              <MessagesSquare className="w-4 h-4 text-sky-600" />
              原文记录
            </div>
            <button
              type="button"
              onClick={copyTranscript}
              className="min-h-10 rounded-xl px-3 text-xs font-semibold text-blue-600 active:bg-blue-50 inline-flex items-center gap-1.5"
            >
              {isTranscriptCopied ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {isTranscriptCopied ? '已复制' : '复制'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRANSCRIPT_SPEAKERS.map((speaker) => (
              editingSpeaker === speaker ? (
                <input
                  key={speaker}
                  type="text"
                  value={speakerDraft}
                  aria-label={`编辑${defaultSpeakerLabel(speaker)}`}
                  onChange={(event) => setSpeakerDraft(event.target.value)}
                  onBlur={saveSpeakerName}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveSpeakerName();
                    if (event.key === 'Escape') {
                      setEditingSpeaker(null);
                      setSpeakerDraft('');
                    }
                  }}
                  autoFocus
                  className="h-10 w-32 rounded-full border border-blue-200 bg-white px-4 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-100"
                />
              ) : (
                <button
                  key={speaker}
                  type="button"
                  onClick={() => startSpeakerEdit(speaker)}
                  className="inline-flex h-10 max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 active:bg-blue-50 active:text-blue-700"
                  aria-label={`编辑${speakerLabel(speaker, speakerNames)}`}
                >
                  <span className="truncate">{speakerLabel(speaker, speakerNames)}</span>
                  <Pencil className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                </button>
              )
            ))}
          </div>
          <div className="space-y-3">
            {transcriptTurns.map((turn, index) => (
              <div key={turn.id} className="rounded-2xl bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-xs font-semibold text-gray-900">{speakerLabel(turn.speaker, speakerNames)}</p>
                  <p className="shrink-0 text-[11px] font-medium text-gray-400">{formatTurnTime(session.startedAt, index)}</p>
                </div>
                {shouldShowTranslation(turn) ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm leading-relaxed text-gray-700">{turn.sourceText}</p>
                    {editingTurnId === turn.id ? (
                      <div className="space-y-2 rounded-2xl bg-blue-50 p-2">
                        <textarea
                          value={translationDraft}
                          onChange={(event) => setTranslationDraft(event.target.value)}
                          className="min-h-24 w-full resize-none rounded-xl border border-blue-100 bg-white p-3 text-sm leading-relaxed text-blue-900 outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={cancelCorrection} className="min-h-9 rounded-xl px-3 text-xs font-semibold text-gray-500 active:bg-white">
                            取消
                          </button>
                          <button type="button" onClick={() => saveCorrection(turn)} className="min-h-9 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white active:bg-blue-700">
                            保存订正
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-blue-50 p-3 text-sm leading-relaxed text-blue-800">
                        <p>{turn.translatedText}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="text-[11px] font-medium text-emerald-600">{rememberedTurnId === turn.id ? '已写入记忆' : ''}</p>
                          <button
                            type="button"
                            onClick={() => startCorrection(turn)}
                            className="min-h-8 rounded-lg px-2 text-xs font-semibold text-blue-700 active:bg-blue-100"
                          >
                            订正
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">{turn.sourceText}</p>
                )}
              </div>
            ))}
          </div>
            </section>
          </>
        )}

      </div>
    </motion.div>
  );
}
