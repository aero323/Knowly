import { ArrowRight, ChevronDown, Copy, Phone, Video } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CONTACTS } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { AppScreen } from '@/types';

interface CallsViewProps {
  onOpenScreen: (screen: AppScreen) => void;
  onOpenEnterpriseSubscription: () => void;
}

const CONTACT_HISTORY = {
  'new-contact': [
    {
      id: 'new-contact-session-1',
      title: '首次接通确认',
      time: '刚刚',
      summary: '已确认对方可正常接入，后续沟通可通过会议 ID 加入。',
      transcript: [
        { speaker: '我', source: '你好，先试一下这次通话能不能接通。', translated: 'Halo, saya ingin mencoba apakah panggilan ini bisa tersambung.' },
        { speaker: '对方', source: '可以，我这边已经收到。', translated: 'Bisa, saya sudah menerima panggilannya.' },
      ],
    },
  ],
  '1': [
    {
      id: 'budi-session-1',
      title: '镍矿交付确认',
      time: '2 小时前',
      summary: '双方确认 invoice 与 packing list 今天下午发出，明早继续核船期。',
      transcript: [
        { speaker: '我', source: '发票和装箱单今天下午能给吗？', translated: 'Apakah invoice dan packing list bisa dikirim sore ini?' },
        { speaker: 'Budi', source: 'Bisa, saya kirim sebelum jam lima.', translated: '可以，我会在下午五点前发出。' },
      ],
    },
    {
      id: 'budi-session-2',
      title: '付款节点确认',
      time: '昨天',
      summary: '已确认 DP 比例按合同执行，但需书面确认最晚到账时间。',
      transcript: [
        { speaker: '我', source: 'DP 按合同 30% 走，对吗？', translated: 'DP mengikuti kontrak 30%, betul?' },
        { speaker: 'Budi', source: 'Ya, tetapi mohon transfer sebelum barang keluar.', translated: '对，但请在货出库前完成付款。' },
      ],
    },
  ],
  '2': [
    {
      id: 'sari-session-1',
      title: '员工排班沟通',
      time: '昨天',
      summary: '确认夜班到岗时间和安全帽要求，已提醒现场登记。',
      transcript: [
        { speaker: '我', source: '今天夜班几点到岗？', translated: 'Jam berapa shift malam mulai hari ini?' },
        { speaker: 'Sari', source: 'Jam tujuh malam, semua harus pakai helm.', translated: '晚上七点，所有人都必须戴安全帽。' },
      ],
    },
  ],
  '3': [
    {
      id: 'adi-session-1',
      title: '清关资料确认',
      time: '3 天前',
      summary: '已核对 DO 文件还差盖章页，待下午补齐后提柜。',
      transcript: [
        { speaker: '我', source: '现在还缺哪份文件？', translated: 'Dokumen apa yang masih kurang sekarang?' },
        { speaker: 'Adi', source: 'Masih kurang halaman stempel untuk DO.', translated: '还差提货单的盖章页。' },
      ],
    },
  ],
  'web-1': [
    {
      id: 'web-1-session-1',
      title: '网页咨询记录',
      time: '18 分钟前',
      summary: '访客通过网页发起咨询，重点询问报价和交期。',
      transcript: [
        { speaker: '访客', source: '请问镍矿这批货的交期可以提前吗？', translated: 'Bisa tidak jadwal pengiriman bijih nikel ini dipercepat?' },
        { speaker: '我', source: '可以先确认港口和付款节点，再给你更准确时间。', translated: 'Kami perlu memastikan pelabuhan dan tahapan pembayaran dulu untuk memberi jadwal yang lebih akurat.' },
      ],
    },
  ],
  'web-2': [
    {
      id: 'web-2-session-1',
      title: '网页留言跟进',
      time: '1 小时前',
      summary: '访客在网页留言，后续将按同一条记录继续跟进。',
      transcript: [
        { speaker: '访客', source: '我想补充一下装箱单里的收货地址。', translated: 'Saya ingin menambahkan alamat penerima di packing list.' },
        { speaker: '我', source: '好的，请发我最新地址，我来帮你补充。', translated: 'Baik, kirim alamat terbaru agar saya bantu perbarui.' },
      ],
    },
  ],
  'web-3': [
    {
      id: 'web-3-session-1',
      title: '网页历史会话',
      time: '昨天',
      summary: '网页访客留下的会话纪要，可继续查看原文和译文。',
      transcript: [
        { speaker: '访客', source: '谢谢，等我整理好文件再联系你。', translated: 'Terima kasih, saya akan menghubungi Anda lagi setelah dokumen siap.' },
        { speaker: '我', source: '没问题，整理好后直接发过来即可。', translated: 'Tidak masalah, kirim saja setelah sudah rapi.' },
      ],
    },
  ],
} satisfies Record<string, Array<{
  id: string;
  title: string;
  time: string;
  summary: string;
  transcript: Array<{ speaker: string; source: string; translated: string }>;
}>>;

export function CallsView({ onOpenScreen, onOpenEnterpriseSubscription }: CallsViewProps) {
  const [inviteCode] = useState('7A3-K9W');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [applyGuestPreferences, setApplyGuestPreferences] = useState(true);
  const [selectedHistoryId, setSelectedHistoryId] = useState('');
  const [editingHistoryKey, setEditingHistoryKey] = useState('');
  const [historyTranslationDraft, setHistoryTranslationDraft] = useState('');
  const [historyCorrections, setHistoryCorrections] = useState<Record<string, string>>({});
  const [rememberedHistoryKey, setRememberedHistoryKey] = useState('');

  const callHistoryRecords = CONTACTS.flatMap((participant) => (CONTACT_HISTORY[participant.id] ?? []).map((session) => ({
    ...session,
    participantId: participant.id,
    participantName: participant.id === 'new-contact' ? 'Rizky' : participant.source === 'web' ? '网页用户' : participant.name,
    channel: participant.source === 'web' ? '网页通话' : 'Knowly App',
  })));
  const selectedHistory = callHistoryRecords.find((record) => record.id === selectedHistoryId) ?? null;

  function openCallHistory(record: (typeof callHistoryRecords)[number]) {
    setSelectedHistoryId(record.id);
    setEditingHistoryKey('');
    setHistoryTranslationDraft('');
    setRememberedHistoryKey('');
  }

  function closeCallHistory() {
    setSelectedHistoryId('');
    setEditingHistoryKey('');
    setHistoryTranslationDraft('');
    setRememberedHistoryKey('');
  }

  function historyTurnKey(sessionId: string, turnIndex: number) {
    return `${sessionId}-${turnIndex}`;
  }

  function startHistoryCorrection(sessionId: string, turnIndex: number, translated: string) {
    const key = historyTurnKey(sessionId, turnIndex);
    setEditingHistoryKey(key);
    setHistoryTranslationDraft(historyCorrections[key] ?? translated);
  }

  function cancelHistoryCorrection() {
    setEditingHistoryKey('');
    setHistoryTranslationDraft('');
  }

  function saveHistoryCorrection(sessionId: string, turnIndex: number) {
    const key = historyTurnKey(sessionId, turnIndex);
    const correctedText = historyTranslationDraft.trim();
    if (!correctedText) return;

    setHistoryCorrections((current) => ({ ...current, [key]: correctedText }));
    setEditingHistoryKey('');
    setHistoryTranslationDraft('');
    setRememberedHistoryKey(key);
    window.setTimeout(() => setRememberedHistoryKey((current) => current === key ? '' : current), 1600);
  }

  function renderCallHistoryList(records: typeof callHistoryRecords) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {records.map((record, i) => (
          <button
            key={record.id}
            type="button"
            onClick={() => openCallHistory(record)}
            className={cn('flex min-h-24 w-full items-start p-4 text-left transition-colors active:bg-gray-50', i !== records.length - 1 && 'border-b border-gray-100')}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-950">{record.title}</span>
                  <span className="mt-1 block text-xs text-gray-500">{record.participantName} · {record.channel} · {record.time}</span>
                </span>
                <ChevronDown className="-rotate-90 mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              </span>
              <span className="mt-2 block text-sm leading-6 text-gray-600">{record.summary}</span>
            </span>
          </button>
        ))}
      </div>
    );
  }

  if (selectedHistory) {
    return (
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="min-h-full bg-slate-50">
        <ScreenHeader title="通话记录详情" subtitle={`${selectedHistory.participantName} · ${selectedHistory.time}`} onBack={closeCallHistory} />

        <div className="space-y-3 p-4 pb-24">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-950">{selectedHistory.title}</p>
            <p className="mt-1 text-xs text-gray-500">{selectedHistory.channel} · {selectedHistory.transcript.length} 条原文记录</p>
            <div className="mt-4 rounded-2xl bg-blue-50 p-3">
              <h3 className="text-xs font-semibold text-blue-700">纪要</h3>
              <p className="mt-2 text-sm leading-6 text-blue-900">{selectedHistory.summary}</p>
            </div>
          </section>

          {selectedHistory.transcript.map((turn, index) => {
            const key = historyTurnKey(selectedHistory.id, index);
            const translatedText = historyCorrections[key] ?? turn.translated;
            const isEditing = editingHistoryKey === key;

            return (
              <section key={key} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-xs font-semibold text-gray-500">{turn.speaker}</p>
                  <p className="shrink-0 text-[11px] font-medium text-gray-400">#{index + 1}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-800">原文：{turn.source}</p>

                {isEditing ? (
                  <div className="mt-2 space-y-2 rounded-2xl bg-blue-50 p-2">
                    <textarea
                      value={historyTranslationDraft}
                      onChange={(event) => setHistoryTranslationDraft(event.target.value)}
                      className="min-h-24 w-full resize-none rounded-xl border border-blue-100 bg-white p-3 text-sm leading-6 text-blue-900 outline-none focus:ring-2 focus:ring-blue-200"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={cancelHistoryCorrection} className="min-h-9 rounded-xl px-3 text-xs font-semibold text-gray-500 active:bg-white">
                        取消
                      </button>
                      <button type="button" onClick={() => saveHistoryCorrection(selectedHistory.id, index)} className="min-h-9 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white active:bg-blue-700">
                        保存订正
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 rounded-2xl bg-blue-50 p-3 text-sm leading-6 text-blue-800">
                    <p>译文：{translatedText}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium text-emerald-600">{rememberedHistoryKey === key ? '已写入记忆' : ''}</p>
                      <button
                        type="button"
                        onClick={() => startHistoryCorrection(selectedHistory.id, index, translatedText)}
                        className="min-h-8 rounded-lg px-2 text-xs font-semibold text-blue-700 active:bg-blue-100"
                      >
                        订正
                      </button>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col min-h-full bg-slate-50">
      <header className="px-6 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI 双语通话</h1>
        <p className="text-sm text-gray-500 mt-1">实时通话，实时字幕，目前支持双人通话</p>
      </header>

      <button
        type="button"
        onClick={onOpenEnterpriseSubscription}
        className="min-h-9 w-full bg-blue-50 px-6 text-left text-xs font-semibold text-blue-700 active:bg-blue-100"
      >
        🏢 企业多人通话请联系销售定制 →
      </button>

      <div className="p-6 space-y-8 pb-24">
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xs font-semibold text-gray-500">我的通话 ID</h2>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black text-gray-950 tracking-wider font-mono">{inviteCode}</span>
              <button
                type="button"
                onClick={() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1200);
                }}
                className="w-10 h-10 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                aria-label="复制通话 ID"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-gray-500">复制通话ID发送给他人 他人可通过App或网页端加入</p>
            {copied && <p className="text-xs text-emerald-600">已复制</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onOpenScreen({ type: 'call-lobby', mode: 'voice', code: inviteCode })}
              className="min-h-12 bg-slate-900 hover:bg-slate-800 text-white px-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Phone className="w-5 h-5" />
              <span className="font-semibold text-sm">语音通话</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenScreen({ type: 'call-lobby', mode: 'video', code: inviteCode })}
              className="min-h-12 bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Video className="w-5 h-5" />
              <span className="font-semibold text-sm">视频通话</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setApplyGuestPreferences((current) => !current)}
            className="flex min-h-11 w-full items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3 text-left ring-1 ring-gray-200 active:bg-gray-100"
            aria-pressed={applyGuestPreferences}
          >
            <span className="text-sm font-medium text-gray-700">应用翻译偏好</span>
            <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', applyGuestPreferences ? 'bg-blue-500' : 'bg-gray-300')}>
              <span className={cn('absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform', applyGuestPreferences ? 'translate-x-5' : 'translate-x-0')} />
            </span>
          </button>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-950 px-1">加入他人通话</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="输入通话 ID"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="min-h-12 flex-1 bg-white border border-gray-200 rounded-xl px-4 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase font-mono tracking-wider text-base"
            />
            <button
              type="button"
              disabled={!joinCode.trim()}
              onClick={() => onOpenScreen({ type: 'call-lobby', mode: 'join', code: joinCode })}
              className="min-h-12 bg-blue-600 disabled:bg-blue-300 text-white px-5 rounded-xl font-semibold transition-colors flex items-center justify-center"
              aria-label="加入通话"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-950">通话记录</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">查看历史通话的纪要、原文和译文记录。</p>
            </div>
          </div>

          {renderCallHistoryList(callHistoryRecords)}
        </section>
      </div>
    </motion.div>
  );
}
