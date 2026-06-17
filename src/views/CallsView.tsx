import { ArrowRight, CheckCircle2, ChevronDown, Copy, History, Pencil, Phone, UserPlus, Video, X } from 'lucide-react';
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
      summary: '已确认对方可正常接听，后续沟通将通过 Knowly 发起。',
      transcript: [
        { speaker: '我', source: '你好，先试一下这个新联系人能不能接通。', translated: 'Halo, saya ingin mencoba apakah kontak baru ini bisa tersambung.' },
        { speaker: '新联系人', source: '可以，我这边已经收到。', translated: 'Bisa, saya sudah menerima panggilannya.' },
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
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [applyGuestPreferences, setApplyGuestPreferences] = useState(true);
  const [contactIdInput, setContactIdInput] = useState('');
  const [addedContacts, setAddedContacts] = useState<typeof CONTACTS>([]);
  const [addedContactId, setAddedContactId] = useState('');
  const [contactNameOverrides, setContactNameOverrides] = useState<Record<string, string>>({});
  const [editingContactId, setEditingContactId] = useState('');
  const [editingContactName, setEditingContactName] = useState('');
  const [pendingCallContactId, setPendingCallContactId] = useState('');
  const [historyContactId, setHistoryContactId] = useState('');
  const [isAllContactsOpen, setIsAllContactsOpen] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState('');
  const [editingHistoryKey, setEditingHistoryKey] = useState('');
  const [historyTranslationDraft, setHistoryTranslationDraft] = useState('');
  const [historyCorrections, setHistoryCorrections] = useState<Record<string, string>>({});
  const [rememberedHistoryKey, setRememberedHistoryKey] = useState('');
  const displayedContacts = [...addedContacts, ...CONTACTS.filter((contact) => !addedContacts.some((item) => item.id === contact.id))]
    .map((contact) => ({ ...contact, name: contactNameOverrides[contact.id] ?? contact.name }));
  const pendingCallContact = displayedContacts.find((contact) => contact.id === pendingCallContactId) ?? null;
  const historyContact = displayedContacts.find((contact) => contact.id === historyContactId) ?? null;
  const historySessions = historyContact ? (CONTACT_HISTORY[historyContact.id] ?? []) : [];

  function getContactMeta(contact: (typeof CONTACTS)[number]) {
    if (contact.source === 'web') return `网页通话 · ${contact.lastCall}`;
    return `ID ${contact.contactCode} · ${contact.lastCall}`;
  }

  function renderContactInfo(contact: (typeof CONTACTS)[number]) {
    return (
      <>
        <span className="relative">
          <span className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg">
            {contact.name.charAt(0).toUpperCase()}
          </span>
          {contact.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />}
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-gray-950">{contact.name}</span>
          <span className="block text-xs text-gray-500 mt-0.5">{getContactMeta(contact)}</span>
        </span>
      </>
    );
  }

  function autoAddContact() {
    const contactCode = contactIdInput.trim().toUpperCase();
    if (!contactCode) return;

    const contact = {
      id: `added-${contactCode}`,
      name: '新联系人',
      lastCall: '刚刚添加',
      online: true,
      contactCode,
      source: 'app',
    };
    setAddedContacts((current) => [contact, ...current.filter((item) => item.id !== contact.id)]);
    setAddedContactId(contact.id);
  }

  function hasHistory(contact: (typeof displayedContacts)[number]) {
    return Boolean(CONTACT_HISTORY[contact.id]?.length);
  }

  function openEditContact(contact: (typeof displayedContacts)[number]) {
    setEditingContactId(contact.id);
    setEditingContactName(contact.name);
  }

  function saveContactName() {
    const nextName = editingContactName.trim();
    if (!editingContactId || !nextName) return;

    setContactNameOverrides((current) => ({ ...current, [editingContactId]: nextName }));
    setAddedContacts((current) => current.map((contact) => contact.id === editingContactId ? { ...contact, name: nextName } : contact));
    setEditingContactId('');
    setEditingContactName('');
  }

  function startContactCall(contact: (typeof displayedContacts)[number], mode: 'voice' | 'video') {
    onOpenScreen({ type: 'call-lobby', mode, contactId: contact.id, code: inviteCode });
    setPendingCallContactId('');
  }

  function openContactHistory(contact: (typeof displayedContacts)[number]) {
    const sessions = CONTACT_HISTORY[contact.id] ?? [];
    setHistoryContactId(contact.id);
    setExpandedHistoryId(sessions[0]?.id ?? '');
    setEditingHistoryKey('');
    setHistoryTranslationDraft('');
    setRememberedHistoryKey('');
  }

  function closeContactHistory() {
    setHistoryContactId('');
    setExpandedHistoryId('');
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

  function renderContactList(contacts: typeof displayedContacts) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {contacts.map((contact, i) => (
          <div key={contact.id} className={cn('flex items-center gap-3 p-4', i !== contacts.length - 1 && 'border-b border-gray-100')}>
            <div className="flex min-h-12 flex-1 items-center gap-3 text-left">
              <span className="relative">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
                {contact.online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="block truncate font-semibold text-gray-950">{contact.name}</span>
                  <button
                    type="button"
                    onClick={() => openEditContact(contact)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    aria-label={`编辑 ${contact.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">{getContactMeta(contact)}</span>
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {hasHistory(contact) && (
                <button
                  type="button"
                  onClick={() => openContactHistory(contact)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  aria-label={`${contact.name} 的通话历史`}
                >
                  <History className="h-4 w-4" />
                </button>
              )}
              {contact.source !== 'web' && (
                <button
                  type="button"
                  onClick={() => setPendingCallContactId(contact.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  aria-label={`呼叫 ${contact.name}`}
                >
                  <Phone className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (historyContact) {
    return (
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="min-h-full bg-slate-50">
        <ScreenHeader title={`${historyContact.name} 的通话历史`} subtitle="纪要、原文与译文记录" onBack={closeContactHistory} />

        <div className="p-4 space-y-3 pb-24">
          {historySessions.length > 0 ? historySessions.map((session) => {
            const isOpen = expandedHistoryId === session.id;

            return (
              <article key={session.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpandedHistoryId((current) => current === session.id ? '' : session.id)}
                  aria-expanded={isOpen}
                  className="min-h-16 w-full px-4 py-3 text-left active:bg-gray-50 transition-colors"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-950">{session.title}</span>
                      <span className="mt-1 block text-xs text-gray-500">{session.time} · {session.transcript.length} 条原文记录</span>
                    </span>
                    <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
                  </span>
                  <span className="mt-3 block text-sm leading-6 text-gray-600">{session.summary}</span>
                </button>

                {isOpen && (
                  <div className="space-y-3 border-t border-gray-100 bg-gray-50 p-3">
                    <section className="rounded-2xl bg-white p-3">
                      <h3 className="text-xs font-semibold text-gray-500">纪要</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-800">{session.summary}</p>
                    </section>

                    {session.transcript.map((turn, index) => {
                      const key = historyTurnKey(session.id, index);
                      const translatedText = historyCorrections[key] ?? turn.translated;
                      const isEditing = editingHistoryKey === key;

                      return (
                        <section key={key} className="rounded-2xl bg-white p-3">
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
                                <button type="button" onClick={() => saveHistoryCorrection(session.id, index)} className="min-h-9 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white active:bg-blue-700">
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
                                  onClick={() => startHistoryCorrection(session.id, index, translatedText)}
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
                )}
              </article>
            );
          }) : (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 text-sm leading-6 text-gray-500">
              暂无通话历史，发起通话后会在这里沉淀纪要、原文和译文记录。
            </section>
          )}
        </div>
      </motion.div>
    );
  }

  if (isAllContactsOpen) {
    return (
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="min-h-full bg-slate-50">
        <ScreenHeader title="全部联系人" subtitle={`${displayedContacts.length} 位联系人和网页访客`} onBack={() => setIsAllContactsOpen(false)} />

        <div className="space-y-4 p-4 pb-24">
          <section className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">
            App 联系人可直接发起通话；网页访客可编辑姓名并查看历史记录。
          </section>
          {renderContactList(displayedContacts)}
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
              <h3 className="text-sm font-semibold text-gray-950">通话记录与联系人</h3>
              <button
                type="button"
                onClick={() => setIsAllContactsOpen(true)}
                className="mt-1 text-xs font-semibold text-blue-600 active:text-blue-700"
              >
                全部联系人
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAddContactOpen(true);
                setAddedContactId('');
              }}
              className="min-h-10 text-blue-600 text-sm font-medium flex items-center gap-1"
            >
              <UserPlus className="w-4 h-4" />
              <span>添加</span>
            </button>
          </div>
          <p className="px-1 text-xs leading-relaxed text-gray-500">如果通话对象已下载 Knowly App，通话结束后将自动添加为联系人。</p>

          {renderContactList(displayedContacts)}
        </section>
      </div>

      {isAddContactOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 px-0" role="dialog" aria-modal="true" aria-label="添加联系人">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-950">添加联系人</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">粘贴对方的 ID，可以自动识别并添加到联系人列表。</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddContactOpen(false)}
                className="min-h-11 min-w-11 -mr-2 -mt-2 rounded-full text-gray-500 hover:bg-gray-100 flex items-center justify-center"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-gray-500">对方 ID</span>
                <input
                  value={contactIdInput}
                  onChange={(event) => {
                    setContactIdInput(event.target.value.toUpperCase());
                    setAddedContactId('');
                  }}
                  placeholder="粘贴通话 ID 或联系人 ID"
                  className="min-h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 font-mono text-base tracking-wider outline-none focus:border-blue-500 focus:bg-white"
                />
              </label>

              {addedContactId && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  已添加联系人，可在列表顶部发起通话。
                </div>
              )}

              <button
                type="button"
                onClick={autoAddContact}
                disabled={!contactIdInput.trim()}
                className="min-h-12 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white disabled:bg-gray-200 disabled:text-gray-400 active:bg-slate-800"
              >
                自动添加联系人
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingCallContact && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 px-0" role="dialog" aria-modal="true" aria-label="确认发起通话">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-950">发起通话</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">要与 {pendingCallContact.name} 通话吗？请选择语音通话或视频通话。</p>
              </div>
              <button
                type="button"
                onClick={() => setPendingCallContactId('')}
                className="min-h-11 min-w-11 -mr-2 -mt-2 rounded-full text-gray-500 hover:bg-gray-100 flex items-center justify-center"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => startContactCall(pendingCallContact, 'voice')}
                className="min-h-12 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white flex items-center justify-center gap-2 active:bg-slate-800"
              >
                <Phone className="w-4 h-4" />
                语音通话
              </button>
              <button
                type="button"
                onClick={() => startContactCall(pendingCallContact, 'video')}
                className="min-h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 flex items-center justify-center gap-2 active:bg-gray-50"
              >
                <Video className="w-4 h-4" />
                视频通话
              </button>
            </div>
          </div>
        </div>
      )}

      {editingContactId && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 px-0" role="dialog" aria-modal="true" aria-label="编辑联系人姓名">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-950">编辑联系人姓名</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">修改后会在联系人列表和呼叫按钮中展示。</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingContactId('');
                  setEditingContactName('');
                }}
                className="min-h-11 min-w-11 -mr-2 -mt-2 rounded-full text-gray-500 hover:bg-gray-100 flex items-center justify-center"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              className="mt-4 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                saveContactName();
              }}
            >
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-gray-500">联系人姓名</span>
                <input
                  value={editingContactName}
                  onChange={(event) => setEditingContactName(event.target.value)}
                  placeholder="输入联系人姓名"
                  autoFocus
                  className="min-h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-base outline-none focus:border-blue-500 focus:bg-white"
                />
              </label>

              <button
                type="submit"
                disabled={!editingContactName.trim()}
                className="min-h-12 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white disabled:bg-gray-200 disabled:text-gray-400 active:bg-slate-800"
              >
                保存姓名
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
