import { Bot, CheckSquare, FileText, Globe, Mail, Newspaper, Send, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { HoverNote } from '@/components/HoverNote';
import { KNOWLY_ASSISTANT_MODULE_PROMPTS, KNOWLY_ASSISTANT_TASK_PROMPT, KNOWLY_SYSTEM_PROMPT } from '@/data/assistantPrompts';
import { ASSISTANT_TASKS } from '@/data/mockData';
import type { TranslationSession } from '@/types';

const ICONS = {
  minutes: FileText,
  todo: CheckSquare,
  email: Mail,
  news: Newspaper,
  culture: Globe,
};

const TASK_INPUT_TEMPLATES: Record<string, string> = {
  minutes: '生成会议纪要。请补充：时间范围、参与人、重点议题。',
  todo: '提取待办事项。请补充：要整理哪一天或哪次沟通。',
  email: '起草往来信息。请补充：收件人、目的、语气要求。',
  news: '查询印尼新闻。请补充：行业、城市或关键词。',
  culture: '解释文化背景。请补充：对方说过的话或你不确定的表达。',
};

const TASK_RESULTS: Record<string, string> = {
  minutes: '已整理摘要：\n1. 双方确认本批货重点为交期、DP 付款和单据交付。\n2. 供应商需补发票和装箱单。\n3. 船期需明天上午再次确认。',
  todo: '已提取待办：\n- 跟进发票和装箱单\n- 明早确认船期\n- 确认是否产生滞港费',
  email: '已起草消息：\n您好，关于今天沟通的货物安排，请您协助确认船期，并在今天下午前发送发票和装箱单。如有额外费用，也请提前说明。谢谢。',
  news: '已生成查询建议：\n我会优先关注印尼物流、港口、矿业政策和汇率相关信息。当前原型使用本地模拟，后续可接入新闻 API。',
  culture: '已解释：\n印尼商务沟通中，对方如果说“nanti kami cek dulu”，通常表示还不能立刻承诺，需要你继续确认具体时间和责任人。',
  custom: '已根据你的要求整理：\n我会先读取今天的翻译历史，再按“摘要、待办、风险点、可发送消息”四个部分输出结果。缺失信息会标记为待确认。',
};

interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AgentViewProps {
  history: TranslationSession[];
}

export function AgentView({ history }: AgentViewProps) {
  const [inputVal, setInputVal] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedTaskLabel, setSelectedTaskLabel] = useState('');
  const [messages, setMessages] = useState<AgentMessage[]>([]);

  function fillTaskInput(taskId: string, label: string) {
    setSelectedTaskId(taskId);
    setSelectedTaskLabel(label);
    setInputVal(TASK_INPUT_TEMPLATES[taskId] ?? `${label}。请补充具体信息。`);
  }

  function submitPrompt() {
    const prompt = inputVal.trim();
    if (!prompt) return;
    const taskId = selectedTaskId || 'custom';
    const historyHint = history.length > 0 ? `我已参考 ${history.length} 条本地历史记录。` : '当前暂无历史记录，我会基于你输入的信息模拟处理。';
    setMessages([
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: prompt,
      },
      {
        id: `assistant-process-${Date.now()}`,
        role: 'assistant',
        content: `收到，我会先确认任务信息，再读取本地历史上下文。${historyHint}`,
      },
      {
        id: `assistant-result-${Date.now()}`,
        role: 'assistant',
        content: TASK_RESULTS[taskId] ?? TASK_RESULTS.custom,
      },
    ]);
    setInputVal('');
    setSelectedTaskId('');
    setSelectedTaskLabel('');
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col min-h-full bg-slate-50 relative">
      <HoverNote note={KNOWLY_SYSTEM_PROMPT}>
        <header className="px-6 pt-12 pb-4 bg-white border-b border-gray-100 shadow-sm shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>AI 本地助理</span>
            <Sparkles className="w-5 h-5 text-blue-500" />
          </h1>
          <p className="text-sm text-gray-500 mt-1">处理翻译沉淀、生活百科与工作任务</p>
        </header>
      </HoverNote>

      <div className="flex-1 p-4 space-y-6">
        <HoverNote note={KNOWLY_ASSISTANT_TASK_PROMPT}>
          <section className="flex flex-col items-center text-center space-y-3 py-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">需要我帮你做些什么？</h2>
              <p className="text-sm text-gray-500 mt-1">AI能够根据你的历史记录进行总结、提取、答疑等工作。</p>
            </div>
          </section>
        </HoverNote>

        <section className="grid grid-cols-2 gap-2">
          {ASSISTANT_TASKS.map((item) => {
            const Icon = ICONS[item.id as keyof typeof ICONS] ?? Sparkles;
            return (
              <div key={item.id} className="min-h-24">
                <HoverNote note={KNOWLY_ASSISTANT_MODULE_PROMPTS[item.id]} className="h-full">
                  <button
                    type="button"
                    onClick={() => fillTaskInput(item.id, item.label)}
                    className="min-h-24 h-full w-full bg-white border border-gray-200 p-3 rounded-xl shadow-sm text-left hover:bg-blue-50 hover:border-blue-200 transition-colors flex flex-col justify-between gap-2 group"
                  >
                    <Icon className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
                    <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{item.label}</span>
                  </button>
                </HoverNote>
              </div>
            );
          })}
        </section>

        {messages.length > 0 && (
          <section className="space-y-3">
            {messages.map((message) => (
              <article
                key={message.id}
                className={message.role === 'user' ? 'ml-8 rounded-2xl bg-blue-600 p-4 text-white' : 'mr-8 rounded-2xl border border-gray-200 bg-white p-4 text-gray-800'}
              >
                <div className="mb-2 flex items-center gap-2">
                  {message.role === 'assistant' ? <Bot className="h-4 w-4 text-blue-600" /> : <Send className="h-4 w-4" />}
                  <span className="text-xs font-semibold">{message.role === 'assistant' ? 'Knowly 助理' : '你的任务'}</span>
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed">{message.content}</p>
              </article>
            ))}
          </section>
        )}
      </div>

      <div className="mt-auto p-4 pt-2 bg-slate-50">
        <HoverNote note="自定义输入同样走 AI 助理任务 prompt：先识别用户意图，再基于翻译历史、术语库和业务档案生成可直接执行的结果；缺失信息用“待确认”标注。">
          <div className="max-w-md mx-auto space-y-2">
            {selectedTaskLabel && (
              <p className="rounded-2xl bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-700">
                已选择“{selectedTaskLabel}”，请补充时间范围、对象或重点信息后发送。
              </p>
            )}
            <div className="bg-white border border-gray-300 rounded-3xl p-1.5 flex items-end shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
              <textarea
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="例如：把今天的所有沟通整理一下…"
                className="w-full resize-none bg-transparent placeholder:text-gray-400 text-gray-900 px-3 py-2.5 min-h-[44px] max-h-32 focus:outline-none text-sm"
                rows={1}
              />
              <button
                type="button"
                onClick={submitPrompt}
                disabled={!inputVal.trim()}
                className="w-11 h-11 bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-full m-0.5 transition-colors flex items-center justify-center"
                aria-label="发送任务"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </HoverNote>
      </div>
    </motion.div>
  );
}
