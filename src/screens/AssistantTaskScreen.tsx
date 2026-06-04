import { Bot, Send, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ASSISTANT_TASKS } from '@/data/mockData';
import type { KnowlyService } from '@/services/knowlyService';
import type { AssistantMessage } from '@/types';

interface AssistantTaskScreenProps {
  taskId: string;
  prompt?: string;
  historyCount: number;
  service: KnowlyService;
  onBack: () => void;
}

export function AssistantTaskScreen({ taskId, prompt, historyCount, service, onBack }: AssistantTaskScreenProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const task = ASSISTANT_TASKS.find((item) => item.id === taskId);

  useEffect(() => {
    let mounted = true;
    service.assistantMessages(taskId, historyCount).then((data) => {
      if (mounted) {
        setMessages(prompt ? [{ id: 'custom-prompt', role: 'user', content: prompt, createdAt: new Date().toISOString() }, ...data.slice(1)] : data);
      }
    });
    return () => {
      mounted = false;
    };
  }, [historyCount, prompt, service, taskId]);

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="min-h-full bg-slate-50">
      <ScreenHeader title={task?.label ?? 'AI 本地助理'} subtitle="基于翻译历史生成结果" onBack={onBack} />

      <div className="p-4 space-y-4">
        <section className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-950">Knowly 助理正在整理上下文</p>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">会优先参考你的翻译历史、待办和术语库。</p>
          </div>
        </section>

        <section className="space-y-3">
          {messages.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 text-sm text-gray-500 text-center">正在整理本地记录...</div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={message.role === 'assistant' ? 'bg-white border border-gray-200 rounded-2xl p-4' : 'bg-blue-600 text-white rounded-2xl p-4'}
              >
                <div className="flex items-center gap-2 mb-2">
                  {message.role === 'assistant' ? <Bot className="w-4 h-4 text-blue-600" /> : <Send className="w-4 h-4" />}
                  <span className="text-xs font-semibold">{message.role === 'assistant' ? 'Knowly 助理' : '你的任务'}</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
              </article>
            ))
          )}
        </section>
      </div>
    </motion.div>
  );
}
