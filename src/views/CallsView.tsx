import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Phone, Users, Copy, Plus, ArrowRight, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const RECENT_CONTACTS = [
  { id: '1', name: 'Budi (厂长)', lastCall: '2小时前', online: true },
  { id: '2', name: 'Sari (清关中介)', lastCall: '昨天', online: false },
  { id: '3', name: '物流 Adi', lastCall: '3天前', online: true },
];

export function CallsView() {
  const [inviteCode] = useState('7A3-K9W');
  const [joinCode, setJoinCode] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full bg-slate-50"
    >
      <header className="px-6 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI 双语通话</h1>
        <p className="text-sm text-gray-500 mt-1">支持跨端连线，实时语音/视频双向传译</p>
      </header>

      <div className="p-6 space-y-8 pb-24">
        
        {/* Create Call Section */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">我的会议 ID</h2>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-black text-gray-900 tracking-wider font-mono">{inviteCode}</span>
              <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
              <Video className="w-5 h-5" />
              <span className="font-semibold">发起视频通话</span>
            </button>
            <button className="flex-1 bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Phone className="w-5 h-5" />
              <span className="font-semibold">发起语音</span>
            </button>
          </div>
        </section>

        {/* Join Call Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 px-1">加入他人通话</h3>
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="输入会议 ID"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase font-mono tracking-wider"
            />
            <button 
              disabled={!joinCode.trim()}
              className="bg-blue-600 disabled:bg-blue-300 text-white px-5 rounded-xl font-semibold transition-colors flex items-center justify-center"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Contacts Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-gray-900">通话记录与联系人</h3>
            <button className="text-blue-600 text-sm font-medium flex items-center gap-1">
              <UserPlus className="w-4 h-4" />
              <span>添加</span>
            </button>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {RECENT_CONTACTS.map((contact, i) => (
              <div 
                key={contact.id} 
                className={cn(
                  "p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors",
                  i !== RECENT_CONTACTS.length - 1 && "border-b border-gray-100"
                )}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  {contact.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{contact.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{contact.lastCall}</div>
                </div>

                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-full transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-full transition-colors">
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </motion.div>
  );
}
