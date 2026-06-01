import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, FileText, Newspaper, Globe, Sparkles, Mail, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  { id: 'minutes', icon: FileText, label: '生成会议纪要' },
  { id: 'todo', icon: CheckSquare, label: '提取待办事项' },
  { id: 'email', icon: Mail, label: '起草往来邮件' },
  { id: 'news', icon: Newspaper, label: '查询印尼新闻' },
  { id: 'culture', icon: Globe, label: '文化背景解释' },
];

export function AgentView() {
  const [inputVal, setInputVal] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full bg-slate-50 relative"
    >
      <header className="px-6 pt-12 pb-4 bg-white border-b border-gray-100 shadow-sm shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <span>AI 本地助理</span>
          <Sparkles className="w-5 h-5 text-blue-500" />
        </h1>
        <p className="text-sm text-gray-500 mt-1">处理翻译沉淀、生活百科与工作任务</p>
      </header>

      {/* Chat Area (Empty State with Suggestions) */}
      <div className="flex-1 p-4 flex flex-col justify-end pb-32">
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">需要我帮你做些什么？</h2>
              <p className="text-sm text-gray-500 mt-1">你可以基于历史翻译记录生成总结，或提出新的任务请求。</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto w-full">
            {SUGGESTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <button 
                  key={item.id}
                  className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm text-left hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors flex flex-col gap-2 group"
                >
                  <Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
        <div className="max-w-md mx-auto bg-white border border-gray-300 rounded-3xl p-1.5 flex items-end shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
          <textarea 
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="指派任务，例如：查询雅加达天气、写一封邮件通知发货..."
            className="w-full resize-none bg-transparent placeholder:text-gray-400 text-gray-900 px-4 py-3 min-h-[44px] max-h-32 focus:outline-none text-sm"
            rows={1}
          />
          <button 
            disabled={!inputVal.trim()}
            className="p-3 bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-full m-1 transition-colors"
          >
            <Send className="w-5 h-5 -ml-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
