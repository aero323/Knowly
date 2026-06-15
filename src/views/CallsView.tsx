import { ArrowRight, CheckCircle2, Copy, Pencil, Phone, UserPlus, Video, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { CONTACTS } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { AppScreen } from '@/types';

interface CallsViewProps {
  onOpenScreen: (screen: AppScreen) => void;
  onOpenEnterpriseSubscription: () => void;
}

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
  const displayedContacts = [...addedContacts, ...CONTACTS.filter((contact) => !addedContacts.some((item) => item.id === contact.id))]
    .map((contact) => ({ ...contact, name: contactNameOverrides[contact.id] ?? contact.name }));

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
            <h2 className="text-xs font-semibold text-gray-500">我的会议 ID</h2>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black text-gray-950 tracking-wider font-mono">{inviteCode}</span>
              <button
                type="button"
                onClick={() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1200);
                }}
                className="w-10 h-10 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                aria-label="复制会议 ID"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-gray-500">复制会议ID发送给他人 他人可通过App或网页端加入</p>
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
              placeholder="输入会议 ID"
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
            <h3 className="text-sm font-semibold text-gray-950">通话记录与联系人</h3>
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

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {displayedContacts.map((contact, i) => (
              <div key={contact.id} className={cn('p-4 flex items-center gap-3', i !== displayedContacts.length - 1 && 'border-b border-gray-100')}>
                {contact.source === 'web' ? (
                  <div className="flex-1 min-h-12 flex items-center gap-3 text-left">{renderContactInfo(contact)}</div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenScreen({ type: 'call-lobby', mode: 'contact', contactId: contact.id, code: inviteCode })}
                    className="flex-1 min-h-12 flex items-center gap-3 text-left"
                  >
                    {renderContactInfo(contact)}
                  </button>
                )}
                {contact.source !== 'web' && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditContact(contact)}
                      className="w-10 h-10 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center"
                      aria-label={`编辑 ${contact.name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenScreen({ type: 'call-lobby', mode: 'voice', contactId: contact.id, code: inviteCode })}
                      className="w-10 h-10 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center"
                      aria-label={`呼叫 ${contact.name}`}
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
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
                  placeholder="粘贴会议 ID 或联系人 ID"
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
