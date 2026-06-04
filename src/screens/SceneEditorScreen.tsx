import { Plus, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { ScreenHeader } from '@/components/ScreenHeader';
import type { ScenePrompt } from '@/types';

interface SceneEditorScreenProps {
  onBack: () => void;
  onSaveScene: (scene: ScenePrompt) => void;
}

export function SceneEditorScreen({ onBack, onSaveScene }: SceneEditorScreenProps) {
  const [name, setName] = useState('矿区接待客户');
  const [description, setDescription] = useState('到矿区现场接待客户，确认参观流程、车辆安排和安全要求');
  const [openingLines, setOpeningLines] = useState('欢迎来到现场，我们先确认今天的参观安排。');
  const [keywordHints, setKeywordHints] = useState('安全帽, 参观路线, 车辆安排, 禁止拍照');
  const [summaryTemplate, setSummaryTemplate] = useState('记录客户到访目的、现场确认事项、待跟进资料和负责人。');

  const canSave = name.trim().length > 0 && description.trim().length > 0;

  function saveScene() {
    if (!canSave) return;
    onSaveScene({
      id: `custom-scene-${Date.now()}`,
      name: name.trim(),
      icon: 'message',
      description: description.trim(),
      openingLines: openingLines.split('\n').map((item) => item.trim()).filter(Boolean),
      keywordHints: keywordHints.split(',').map((item) => item.trim()).filter(Boolean),
      summaryTemplate: summaryTemplate.trim(),
    });
  }

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="min-h-full bg-slate-50">
      <ScreenHeader title="编辑场景" subtitle="自定义名称和翻译内容" onBack={onBack} />

      <div className="p-4 space-y-4">
        <section className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-950">新增自定义场景</h2>
            <p className="text-sm text-gray-500 mt-1">保存后会自动展示在首页对话场景里</p>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-gray-500">场景名称</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-950 outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-gray-500">场景内容</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm leading-relaxed text-gray-950 outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-gray-500">常用开场白</span>
            <textarea
              value={openingLines}
              onChange={(event) => setOpeningLines(event.target.value)}
              rows={2}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm leading-relaxed text-gray-950 outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-gray-500">关键词提醒</span>
            <input
              value={keywordHints}
              onChange={(event) => setKeywordHints(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-950 outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-gray-500">纪要模板</span>
            <textarea
              value={summaryTemplate}
              onChange={(event) => setSummaryTemplate(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm leading-relaxed text-gray-950 outline-none focus:border-blue-400 focus:bg-white"
            />
          </label>
        </section>

        <button
          type="button"
          onClick={saveScene}
          disabled={!canSave}
          className="min-h-12 w-full rounded-2xl bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm active:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
        >
          <Save className="w-4 h-4" />
          保存场景
        </button>
      </div>
    </motion.div>
  );
}
