import { useState } from 'react';
import { CheckSquare, ChevronDown, ClipboardCheck, Copy, FileText, MessagesSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { ConversationTurn, TranslationSession } from '@/types';

interface SummaryScreenProps {
  session?: TranslationSession;
  onBack: () => void;
}

function formatTurnTime(startedAt: string, index: number) {
  const startTime = new Date(startedAt).getTime();
  const baseTime = Number.isNaN(startTime) ? Date.now() : startTime;
  return new Date(baseTime + index * 90_000).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function speakerLabel(speaker: 'me' | 'counterpart') {
  return speaker === 'me' ? '说话人 1' : '说话人 2';
}

function buildTranscriptTurns(turns: ConversationTurn[]) {
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
  ];
}

function shouldShowTranslation(turn: ConversationTurn) {
  return turn.sourceLanguage === 'id' && turn.translatedText.trim() && turn.translatedText !== turn.sourceText;
}

function buildTranscriptCopyText(turns: ConversationTurn[], startedAt: string) {
  return turns.map((turn, index) => {
    const lines = [
      `${speakerLabel(turn.speaker)} ${formatTurnTime(startedAt, index)}`,
      `原文：${turn.sourceText}`,
    ];
    if (turn.translatedText.trim() && turn.translatedText !== turn.sourceText) {
      lines.push(`译文：${turn.translatedText}`);
    }
    return lines.join('\n');
  }).join('\n\n');
}

export function SummaryScreen({ session, onBack }: SummaryScreenProps) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [isTodosOpen, setIsTodosOpen] = useState(true);
  const [isTranscriptCopied, setIsTranscriptCopied] = useState(false);

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

  const transcriptTurns = buildTranscriptTurns(session.turns);

  async function copyTranscript() {
    const copyText = buildTranscriptCopyText(transcriptTurns, session.startedAt);
    await navigator.clipboard.writeText(copyText);
    setIsTranscriptCopied(true);
    window.setTimeout(() => setIsTranscriptCopied(false), 1400);
  }

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="min-h-full bg-slate-50">
      <ScreenHeader title="会话总结" onBack={onBack} />

      <div className="p-4 space-y-4">
        <section className="bg-white border border-gray-200 rounded-2xl p-4">
          <h2 className="text-lg font-semibold text-gray-950">{session.summary.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{session.turns.length} 条对话 · {new Date(session.endedAt).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
        </section>

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

        <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <button
            type="button"
            onClick={() => setIsTodosOpen((open) => !open)}
            aria-expanded={isTodosOpen}
            className="min-h-11 w-full flex items-center justify-between gap-3 text-left text-gray-950 font-semibold"
          >
            <span className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              待办事项
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isTodosOpen ? 'rotate-180' : ''}`} />
          </button>
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
          <div className="space-y-3">
            {transcriptTurns.map((turn, index) => (
              <div key={turn.id} className="rounded-2xl bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-gray-900">{speakerLabel(turn.speaker)}</p>
                  <p className="shrink-0 text-[11px] font-medium text-gray-400">{formatTurnTime(session.startedAt, index)}</p>
                </div>
                {shouldShowTranslation(turn) ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm leading-relaxed text-gray-700">{turn.sourceText}</p>
                    <p className="rounded-2xl bg-blue-50 p-3 text-sm leading-relaxed text-blue-800">
                      {turn.translatedText}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">{turn.sourceText}</p>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </motion.div>
  );
}
