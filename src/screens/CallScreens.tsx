import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Captions,
  Check,
  ChevronDown,
  Copy,
  Globe2,
  Languages,
  Link2,
  Loader2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  ShieldCheck,
  Smartphone,
  UserCheck,
  Video,
  VideoOff,
  Wifi,
} from 'lucide-react';
import { motion } from 'motion/react';
import { HoverNote } from '@/components/HoverNote';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CONTACTS, SCENE_SCRIPTS, makeSummary } from '@/data/mockData';
import { applyTranslationMemory } from '@/lib/translationMemory';
import type { CallSession, ConversationTurn, TranslationMemoryEntry } from '@/types';

interface CallLobbyScreenProps {
  mode: 'video' | 'voice' | 'join' | 'contact';
  code?: string;
  contactId?: string;
  translationMemory: TranslationMemoryEntry[];
  onBack: () => void;
  onEnterRoom: (call: CallSession) => void;
}

interface CallRoomScreenProps {
  call: CallSession;
  translationMemory: TranslationMemoryEntry[];
  onBack: () => void;
  onEndCall: (call: CallSession) => void;
}

const REMOTE_PROFILES: Record<string, { name: string; role: string; image: string; location: string; latency: string }> = {
  '1': {
    name: 'Budi',
    role: '冶炼厂现场',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    location: 'Morowali',
    latency: '48ms',
  },
  '2': {
    name: 'Sari',
    role: '雅加达清关',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80',
    location: 'Jakarta',
    latency: '62ms',
  },
  '3': {
    name: '物流 Adi',
    role: '港口调度',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80',
    location: 'Surabaya',
    latency: '54ms',
  },
  'web-1': {
    name: '网页访客',
    role: '网页通话',
    image: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=900&q=80',
    location: '网页端',
    latency: '71ms',
  },
  'web-2': {
    name: '网页访客',
    role: '网页通话',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
    location: '网页端',
    latency: '86ms',
  },
  'web-3': {
    name: '网页访客',
    role: '网页通话',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80',
    location: '网页端',
    latency: '78ms',
  },
  default: {
    name: 'Budi',
    role: '冶炼厂现场',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
    location: 'Morowali',
    latency: '52ms',
  },
};

const CAPTION_MODES = [
  { id: 'both', label: '双语字幕' },
  { id: 'source', label: '只看原文' },
  { id: 'target', label: '只看译文' },
] as const;

type CaptionMode = (typeof CAPTION_MODES)[number]['id'];

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function CallLobbyScreen({ mode, code = '7A3-K9W', contactId, translationMemory, onBack, onEnterRoom }: CallLobbyScreenProps) {
  const contact = CONTACTS.find((item) => item.id === contactId);
  const callMode = mode === 'voice' ? 'voice' : 'video';
  const isVideo = callMode === 'video';
  const title = contact ? `呼叫 ${contact.name}` : mode === 'join' ? '加入通话' : isVideo ? '发起视频通话' : '发起语音通话';
  const waitingPerson = contact?.name ?? 'Budi';
  const meetingLink = `https://knowly.app/meet/${code}`;
  const [copyStatus, setCopyStatus] = useState<'id' | 'link' | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isAppQrOpen, setIsAppQrOpen] = useState(false);

  const startCall = useCallback(() => {
    const turns = SCENE_SCRIPTS.meeting.map((turn) => applyTranslationMemory(turn, translationMemory));
    onEnterRoom({
      id: `call-${Date.now()}`,
      mode: callMode,
      inviteCode: code,
      contactId,
      participants: ['我', waitingPerson],
      startedAt: new Date().toISOString(),
      turns,
    });
  }, [callMode, code, contactId, onEnterRoom, translationMemory, waitingPerson]);

  useEffect(() => {
    setHasJoined(false);
    const joinTimer = window.setTimeout(() => setHasJoined(true), 2600);
    const startTimer = window.setTimeout(startCall, 4500);

    return () => {
      window.clearTimeout(joinTimer);
      window.clearTimeout(startTimer);
    };
  }, [startCall]);

  function copyToClipboard(value: string, type: 'id' | 'link') {
    void navigator.clipboard?.writeText(value);
    setCopyStatus(type);
    window.setTimeout(() => setCopyStatus(null), 1400);
  }

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="min-h-full bg-slate-50">
      <ScreenHeader title={title} subtitle="等待室 · 实时通话" onBack={onBack} />
      <div className="p-4 space-y-4 pb-24">
        <section className="bg-white border border-gray-200 rounded-2xl p-5 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 text-blue-700 flex items-center justify-center">
            {isVideo ? <Video className="w-9 h-9" /> : <Phone className="w-9 h-9" />}
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">会议 ID</p>
            <p className="text-3xl font-black font-mono tracking-wider text-gray-950 mt-1">{code}</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              将会议 ID 或会议链接发给对方，对方可下载 Knowly App，或直接通过网页端加入。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => copyToClipboard(code, 'id')}
              className="min-h-12 rounded-2xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100 flex items-center justify-center gap-2"
            >
              {copyStatus === 'id' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              复制 ID
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard(meetingLink, 'link')}
              className="min-h-12 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 flex items-center justify-center gap-2"
            >
              {copyStatus === 'link' ? <Check className="w-4 h-4 text-emerald-300" /> : <Link2 className="w-4 h-4" />}
              复制链接
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIsAppQrOpen(true)}
            className="rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40 active:scale-[0.99]"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Smartphone className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-gray-950">下载 APP</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">点击扫码下载后输入会议 ID。</p>
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard(meetingLink, 'link')}
            className="rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40 active:scale-[0.99]"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              {copyStatus === 'link' ? <Check className="h-5 w-5" /> : <Globe2 className="h-5 w-5" />}
            </div>
            <p className="text-sm font-semibold text-gray-950">网页端加入</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">{copyStatus === 'link' ? '网页链接已复制。' : '点击复制网页会议链接。'}</p>
          </button>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${hasJoined ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {hasJoined ? <UserCheck className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-950">{hasJoined ? `${waitingPerson} 已加入` : '等待对方加入会议'}</p>
              <p className="mt-0.5 text-xs text-gray-500">{hasJoined ? '即将自动开始通话' : '复制会议 ID 或链接发送给对方'}</p>
            </div>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className={`h-full rounded-full bg-blue-600 transition-all duration-700 ${hasJoined ? 'w-full' : 'w-2/5'}`} />
          </div>

          {hasJoined && (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
              {waitingPerson} 已加入会议，系统将自动开始通话。
            </div>
          )}
        </section>

        <p className="px-1 text-center text-xs leading-relaxed text-gray-400">
          这是等待室 mock 流程：对方加入后会先展示提醒，再自动进入通话。
        </p>
      </div>

      {isAppQrOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Smartphone className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-lg font-bold text-gray-950">扫码下载 Knowly APP</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">下载后输入会议 ID {code}，即可加入本次会议。</p>
            <div className="mx-auto mt-5 grid h-44 w-44 grid-cols-7 gap-1 rounded-2xl border border-gray-200 bg-white p-3 shadow-inner">
              {Array.from({ length: 49 }).map((_, index) => (
                <span
                  key={index}
                  className={`rounded-sm ${[0, 1, 2, 7, 14, 8, 15, 42, 43, 44, 35, 28, 36, 29, 6, 5, 4, 13, 20, 12, 19, 26, 30, 32, 38, 40, 45].includes(index) ? 'bg-slate-950' : index % 5 === 0 || index % 7 === 3 ? 'bg-slate-400' : 'bg-slate-100'}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsAppQrOpen(false)}
              className="mt-5 min-h-12 w-full rounded-2xl bg-slate-900 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function CallRoomScreen({ call, translationMemory, onBack, onEndCall }: CallRoomScreenProps) {
  const scriptedTurns = useMemo(
    () => (call.turns.length > 0 ? call.turns : SCENE_SCRIPTS.meeting).map((turn) => applyTranslationMemory(turn, translationMemory)),
    [call.turns, translationMemory],
  );
  const [elapsed, setElapsed] = useState(0);
  const [revealedCount, setRevealedCount] = useState(1);
  const [captionMode, setCaptionMode] = useState<CaptionMode>('both');
  const [isCaptionMenuOpen, setIsCaptionMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(call.mode === 'video');
  const [showCaptions, setShowCaptions] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const visibleTurns = scriptedTurns.slice(0, Math.max(1, revealedCount));
  const currentTurn = visibleTurns[visibleTurns.length - 1] ?? scriptedTurns[0];
  const summary = makeSummary(visibleTurns);
  const remoteProfile = REMOTE_PROFILES[call.contactId ?? ''] ?? REMOTE_PROFILES.default;
  const remoteName = call.participants.find((participant) => participant !== '我') ?? remoteProfile.name;
  const selectedCaptionMode = CAPTION_MODES.find((mode) => mode.id === captionMode) ?? CAPTION_MODES[0];
  const progress = Math.min(100, (visibleTurns.length / scriptedTurns.length) * 100);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setRevealedCount(1);
    setElapsed(0);
  }, [call.id]);

  useEffect(() => {
    if (revealedCount >= scriptedTurns.length) return undefined;
    const timer = window.setTimeout(() => {
      setRevealedCount((current) => Math.min(current + 1, scriptedTurns.length));
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [revealedCount, scriptedTurns.length]);

  function finishCall() {
    onEndCall({ ...call, turns: visibleTurns, summary });
  }

  function renderCaption(turn: ConversationTurn) {
    return (
      <article
        key={turn.id}
        className={`max-w-[88%] ${turn.speaker === 'me' ? 'self-end text-right' : 'self-start text-left'}`}
      >
        <p className="mb-1 text-[11px] font-medium text-white/65">
          {turn.speaker === 'me' ? '我方' : remoteName} · {turn.sourceLanguage.toUpperCase()} → {turn.targetLanguage.toUpperCase()}
        </p>
        <div className={`rounded-2xl border border-white/10 px-4 py-3 shadow-lg backdrop-blur-xl ${turn.speaker === 'me' ? 'rounded-tr-sm bg-blue-600/90' : 'rounded-tl-sm bg-black/55'}`}>
          {captionMode !== 'target' && <p className="text-sm font-semibold leading-relaxed text-white">{turn.sourceText}</p>}
          {captionMode !== 'source' && <p className="mt-2 text-xs leading-relaxed text-blue-100">{turn.translatedText}</p>}
        </div>
      </article>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative min-h-dvh overflow-hidden bg-black text-white"
    >
      <img
        src={remoteProfile.image}
        alt={`${remoteName} 的视频画面`}
        className={`absolute inset-0 h-full w-full object-cover transition duration-300 ${isCameraOn ? 'opacity-100' : 'opacity-35 grayscale'}`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/85" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.28),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.2),transparent_36%)]" />

      <header className="absolute left-0 right-0 top-0 z-40 p-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white shadow-lg backdrop-blur-md transition hover:bg-white/15"
            aria-label="返回"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.16)]" />
              <p className="truncate text-sm font-semibold">{remoteName}</p>
            </div>
            <p className="truncate text-[11px] text-white/70">{remoteProfile.role} · {remoteProfile.location}</p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="rounded-full border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs font-bold tabular-nums backdrop-blur-md">
              {formatDuration(elapsed)}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCaptionMenuOpen((current) => !current)}
                className="flex min-h-10 items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 text-xs font-semibold backdrop-blur-md transition hover:bg-white/15"
                aria-label="切换字幕模式"
              >
                <Languages className="h-3.5 w-3.5" />
                {selectedCaptionMode.label}
                <ChevronDown className={`h-3.5 w-3.5 transition ${isCaptionMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCaptionMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 overflow-hidden rounded-2xl border border-white/15 bg-white text-slate-900 shadow-2xl">
                  {CAPTION_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setCaptionMode(mode.id);
                        setIsCaptionMenuOpen(false);
                      }}
                      className="flex min-h-11 w-full items-center justify-between px-3 text-left text-xs font-semibold transition hover:bg-slate-100"
                    >
                      {mode.label}
                      {captionMode === mode.id && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur-md">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
          AI正在生成会议纪要
        </div>
      </header>

      <HoverNote note="高级会员功能" triggerOnContainer className="absolute left-4 right-32 top-28 z-30">
        <aside className="rounded-2xl border border-white/10 bg-black/45 p-3 shadow-2xl backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-blue-100">AI 同传助理</p>
            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
              {visibleTurns.length}/{scriptedTurns.length}
            </span>
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed text-white/78">{currentTurn?.suggestedAction ?? '持续识别双方发言，并沉淀术语。'}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(currentTurn?.terms ?? []).slice(0, 3).map((term) => (
              <span key={term} className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/80">
                {term}
              </span>
            ))}
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-emerald-300 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </aside>
      </HoverNote>

      <div className="absolute right-4 top-28 z-30 h-36 w-24 overflow-hidden rounded-2xl border-2 border-white/20 bg-slate-950 shadow-2xl">
        {isCameraOn ? (
          <div className="flex h-full flex-col justify-between bg-gradient-to-br from-slate-700 via-slate-900 to-blue-950 p-2">
            <div className="flex justify-end">
              <Wifi className="h-3.5 w-3.5 text-emerald-300" />
            </div>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-lg font-black shadow-lg">
              我
            </div>
            <div className="flex h-5 items-end justify-center gap-1">
              {[0, 1, 2, 3].map((bar) => (
                <span key={bar} className="knowly-audio-bar w-1 rounded-full bg-emerald-300" style={{ animationDelay: `${bar * 120}ms` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-950 px-2 text-center">
            <VideoOff className="h-6 w-6 text-white/65" />
            <span className="text-[10px] font-medium text-white/70">摄像头已关闭</span>
          </div>
        )}
      </div>

      {showCaptions && (
        <section className="knowly-caption-mask absolute bottom-28 left-0 right-0 z-30 flex max-h-72 flex-col justify-end gap-3 overflow-hidden px-4 pb-2">
          {visibleTurns.slice(-4).map(renderCaption)}
        </section>
      )}

      <footer className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
        <div className="mx-auto flex max-w-sm items-center justify-between rounded-full border border-white/10 bg-black/45 p-2 shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setIsMuted((current) => !current)}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95 ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/18'}`}
            aria-label={isMuted ? '打开麦克风' : '关闭麦克风'}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() => setShowCaptions((current) => !current)}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95 ${showCaptions ? 'bg-white/10 text-white hover:bg-white/18' : 'bg-slate-700 text-white/65'}`}
            aria-label={showCaptions ? '隐藏字幕' : '显示字幕'}
          >
            <Captions className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-950/45 transition hover:bg-red-400 active:scale-95"
            aria-label="结束通话"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => setIsCameraOn((current) => !current)}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95 ${isCameraOn ? 'bg-white/10 text-white hover:bg-white/18' : 'bg-slate-700 text-white/65'}`}
            aria-label={isCameraOn ? '关闭摄像头' : '打开摄像头'}
          >
            {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/18 active:scale-95"
            aria-label="最小化"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
      </footer>

      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-slate-950 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <PhoneOff className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">结束本次通话？</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">系统会保存已生成的双语字幕，并沉淀为本地会议纪要。</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="min-h-12 flex-1 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-200"
              >
                继续通话
              </button>
              <button
                type="button"
                onClick={finishCall}
                className="min-h-12 flex-1 rounded-2xl bg-red-600 px-4 text-sm font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-700"
              >
                结束并生成纪要
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
