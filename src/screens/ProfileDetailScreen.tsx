import { type ReactNode, useState } from 'react';
import {
  BookOpen,
  Bot,
  Briefcase,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  FileText,
  Headphones,
  HelpCircle,
  Languages,
  Lock,
  MessageSquareText,
  Mic,
  Plus,
  ScrollText,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  Type,
  Upload,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ScreenHeader } from '@/components/ScreenHeader';
import { cn } from '@/lib/utils';
import type {
  AppScreen,
  BusinessProfile,
  GeneralSettings,
  HistoryLimit,
  IndustryContext,
  LanguageCode,
  ScenePrompt,
  SimultaneousDirection,
  SourceLanguageCode,
  SubtitleSize,
  TermEntry,
  TranslationFormality,
} from '@/types';

interface ProfileDetailScreenProps {
  detail: 'industry' | 'scenes' | 'terms' | 'general' | 'privacy' | 'help';
  scenes: ScenePrompt[];
  industries: IndustryContext[];
  profile: BusinessProfile;
  generalSettings: GeneralSettings;
  terms: TermEntry[];
  visibleSceneIds: string[];
  onBack: () => void;
  onOpenScreen: (screen: AppScreen) => void;
  onUpdateProfile: (profile: BusinessProfile) => void;
  onUpdateGeneralSettings: (settings: GeneralSettings) => void;
  onClearHistory: () => void;
  onToggleVisibleScene: (sceneId: string) => void;
  onSaveCustomIndustry: (industry: IndustryContext) => void;
}

type PrivacyDocument = 'privacy-policy' | 'user-agreement';
type FeedbackType = 'translation' | 'audio' | 'photo' | 'account' | 'other';

interface ChoiceOption<T extends string | number> {
  value: T;
  label: string;
  description?: string;
}

const DETAIL_META = {
  industry: { title: '所属行业', subtitle: '影响术语和表达偏好', icon: Briefcase },
  scenes: { title: '自定义场景', subtitle: '保存常用对话流程', icon: MessageSquareText },
  terms: { title: '我的名词库', subtitle: '本地保存的业务术语', icon: BookOpen },
  general: { title: '通用设置', subtitle: '语言、显示和默认模式', icon: Settings },
  privacy: { title: '隐私与安全', subtitle: '政策与协议', icon: Lock },
  help: { title: '帮助与反馈', subtitle: '快速上手和问题反馈', icon: HelpCircle },
};

const SOURCE_LANGUAGE_OPTIONS: ChoiceOption<SourceLanguageCode>[] = [
  { value: 'auto', label: '自动识别' },
  { value: 'zh', label: '中文' },
  { value: 'id', label: '印尼语' },
  { value: 'en', label: '英语' },
  { value: 'ja', label: '日语' },
];

const TARGET_LANGUAGE_OPTIONS: ChoiceOption<LanguageCode>[] = [
  { value: 'zh', label: '中文' },
  { value: 'id', label: '印尼语' },
  { value: 'en', label: '英语' },
  { value: 'ja', label: '日语' },
];

const DIRECTION_OPTIONS: ChoiceOption<SimultaneousDirection>[] = [
  { value: 'id-to-zh', label: '印尼语 → 中文' },
  { value: 'zh-to-id', label: '中文 → 印尼语' },
  { value: 'auto', label: '自动识别' },
];

const FORMALITY_OPTIONS: ChoiceOption<TranslationFormality>[] = [
  { value: 'plain', label: '自然直译', description: '保留口语感' },
  { value: 'business', label: '商务正式', description: '默认推荐' },
  { value: 'formal', label: '正式严谨', description: '适合合同和文件' },
];

const SUBTITLE_SIZE_OPTIONS: ChoiceOption<SubtitleSize>[] = [
  { value: 'compact', label: '紧凑' },
  { value: 'standard', label: '标准' },
  { value: 'large', label: '大字' },
];

const HISTORY_LIMIT_OPTIONS: ChoiceOption<HistoryLimit>[] = [
  { value: 10, label: '10 条' },
  { value: 20, label: '20 条' },
  { value: 50, label: '50 条' },
];

const PRIVACY_DOCUMENTS: Record<PrivacyDocument, {
  title: string;
  subtitle: string;
  sections: Array<{ title: string; body: string[] }>;
}> = {
  'privacy-policy': {
    title: '隐私政策',
    subtitle: '了解数据如何在当前原型中保存和使用',
    sections: [
      {
        title: '本机数据',
        body: [
          '当前 Knowly 原型会把翻译历史、术语库、行业档案和通用设置保存在本机浏览器 localStorage 中，便于离线查看和刷新后继续使用。',
          '清空浏览器站点数据、换设备或换浏览器后，本机数据可能无法恢复。',
        ],
      },
      {
        title: '麦克风、相机和文件',
        body: [
          '麦克风和相机只会在你主动进入通话、面对面翻译、同声传译或拍照翻译时触发。',
          '反馈表单里的截图为可选项；当前原型只展示本地提交成功状态，不会真的上传到服务器。',
        ],
      },
      {
        title: '敏感信息',
        body: [
          '合同、付款、医疗、证件和员工管理内容可能包含敏感信息。原型会尽量用风险提示帮助你识别需要二次确认的内容。',
          '当前前端不内置或暴露任何 provider API key，也不会要求你输入不必要的隐私数据。',
        ],
      },
    ],
  },
  'user-agreement': {
    title: '用户协议',
    subtitle: '使用 Knowly 原型前需要了解的边界',
    sections: [
      {
        title: '服务定位',
        body: [
          'Knowly 是面向出海印尼中文用户的双语翻译与生活工作助理原型，用于辅助现场沟通、字幕整理、拍照识别和任务梳理。',
          '原型内容不能替代律师、医生、会计师、海关代理或其他专业人士的正式意见。',
        ],
      },
      {
        title: '用户责任',
        body: [
          '你需要对输入内容、沟通对象、合同承诺和最终决策负责。涉及金额、法律、医疗和安全责任时，应人工复核。',
          '请不要上传、输入或传播违法、侵权、恶意或侵犯他人隐私的内容。',
        ],
      },
      {
        title: '原型限制',
        body: [
          '当前版本没有真实账号体系、云同步、人工客服 SLA 或生产级数据删除能力。',
          '页面内的反馈提交、用量和部分业务流程属于 mock 演示，用于验证产品体验。',
        ],
      },
    ],
  },
};

const QUICK_START_ITEMS = [
  {
    icon: Mic,
    title: '面对面翻译',
    body: '适合一对一现场沟通。点击双方麦克风，逐句生成对方能看懂的译文，并在结束后沉淀纪要。',
  },
  {
    icon: Headphones,
    title: '同声传译',
    body: '适合会议、展会和多人场景。系统会 mock 自动识别说话人，并持续显示原文、译文和关键词。',
  },
  {
    icon: Camera,
    title: '拍照翻译',
    body: '适合菜单、路牌、文件、图纸和单据。上传或拍照后可查看识别结果，并把重要术语加入名词库。',
  },
  {
    icon: Bot,
    title: 'AI 助理',
    body: '适合整理纪要、提取待办、起草消息和解释印尼商务语境。它会结合最近翻译记录给出建议。',
  },
];

const FEEDBACK_OPTIONS: ChoiceOption<FeedbackType>[] = [
  { value: 'translation', label: '翻译不准' },
  { value: 'audio', label: '语音/字幕' },
  { value: 'photo', label: '拍照识别' },
  { value: 'account', label: '会员/用量' },
  { value: 'other', label: '其他建议' },
];

function ChoiceGroup<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            type="button"
            key={String(option.value)}
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              'min-h-11 rounded-xl border px-3 py-2 text-left transition-colors',
              selected ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 active:bg-gray-50',
            )}
          >
            <span className="block text-sm font-semibold">{option.label}</span>
            {option.description && <span className={cn('mt-0.5 block text-[11px]', selected ? 'text-blue-600/75' : 'text-gray-400')}>{option.description}</span>}
          </button>
        );
      })}
    </div>
  );
}

function SelectField<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

function SwitchRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="min-h-14 w-full rounded-2xl bg-white px-4 py-3 text-left flex items-center justify-between gap-4 active:bg-gray-50 transition-colors"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-950">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-gray-500">{description}</span>
      </span>
      <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-blue-500' : 'bg-gray-300')}>
        <span className={cn('absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform', checked && 'translate-x-5')} />
      </span>
    </button>
  );
}

function SettingBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="px-1 text-xs font-bold uppercase tracking-widest text-gray-400">{title}</h2>
      {children}
    </section>
  );
}

export function ProfileDetailScreen({
  detail,
  scenes,
  industries,
  profile,
  generalSettings,
  terms,
  visibleSceneIds,
  onBack,
  onOpenScreen,
  onUpdateProfile,
  onUpdateGeneralSettings,
  onClearHistory,
  onToggleVisibleScene,
  onSaveCustomIndustry,
}: ProfileDetailScreenProps) {
  const [customIndustryName, setCustomIndustryName] = useState('');
  const [customIndustryDescription, setCustomIndustryDescription] = useState('');
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [privacyDocument, setPrivacyDocument] = useState<PrivacyDocument | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('translation');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackAttachmentName, setFeedbackAttachmentName] = useState('');
  const [includeRecentContext, setIncludeRecentContext] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const meta = DETAIL_META[detail];
  const Icon = meta.icon;
  const activePrivacyDocument = privacyDocument ? PRIVACY_DOCUMENTS[privacyDocument] : null;

  function updateSettings(nextSettings: Partial<GeneralSettings>) {
    onUpdateGeneralSettings({
      ...generalSettings,
      ...nextSettings,
    });
  }

  function saveCustomIndustry() {
    const name = customIndustryName.trim();
    const description = customIndustryDescription.trim();
    if (!name || !description) return;

    const industry: IndustryContext = {
      id: `custom-industry-${Date.now()}`,
      name,
      description,
    };
    onSaveCustomIndustry(industry);
    onUpdateProfile({ ...profile, industryId: industry.id });
    setCustomIndustryName('');
    setCustomIndustryDescription('');
  }

  function alternateTargetLanguage(sourceLanguage: SourceLanguageCode): LanguageCode {
    if (sourceLanguage === 'zh') return 'id';
    return 'zh';
  }

  function updateSourceLanguage(sourceLanguage: SourceLanguageCode) {
    updateSettings({
      sourceLanguage,
      targetLanguage: sourceLanguage !== 'auto' && sourceLanguage === generalSettings.targetLanguage
        ? alternateTargetLanguage(sourceLanguage)
        : generalSettings.targetLanguage,
    });
  }

  function updateTargetLanguage(targetLanguage: LanguageCode) {
    updateSettings({
      targetLanguage,
      sourceLanguage: targetLanguage === generalSettings.sourceLanguage ? 'auto' : generalSettings.sourceLanguage,
    });
  }

  function handleBack() {
    if (privacyDocument) {
      setPrivacyDocument(null);
      return;
    }
    onBack();
  }

  function handleClearHistory() {
    if (!confirmClearHistory) {
      setConfirmClearHistory(true);
      return;
    }

    onClearHistory();
    setConfirmClearHistory(false);
  }

  function submitFeedback() {
    if (!feedbackDescription.trim()) return;

    setFeedbackSubmitted(true);
    setFeedbackDescription('');
    setFeedbackAttachmentName('');
    setIncludeRecentContext(true);
  }

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="min-h-full bg-slate-50">
      <ScreenHeader
        title={activePrivacyDocument?.title ?? meta.title}
        subtitle={activePrivacyDocument?.subtitle ?? meta.subtitle}
        onBack={handleBack}
      />
      <div className="p-4 space-y-4">
        {detail !== 'industry' && !activePrivacyDocument && (
          <section className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-950">{meta.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{meta.subtitle}</p>
            </div>
          </section>
        )}

        {detail === 'industry' && (
          <>
            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {industries.map((industry) => (
                <button
                  type="button"
                  key={industry.id}
                  onClick={() => onUpdateProfile({ ...profile, industryId: industry.id })}
                  className="min-h-14 w-full px-4 flex items-center justify-between gap-4 border-b last:border-b-0 border-gray-100 text-left hover:bg-gray-50"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-950">{industry.name}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">{industry.description}</span>
                  </span>
                  {profile.industryId === industry.id && <CheckCircle2 className="w-5 h-5 shrink-0 text-blue-600" />}
                </button>
              ))}
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                <Plus className="w-4 h-4 text-blue-600" />
                自定义行业
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-gray-500">行业名称</span>
                <input
                  value={customIndustryName}
                  onChange={(event) => setCustomIndustryName(event.target.value)}
                  placeholder="例如：矿区服务 / 跨境电商"
                  className="min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-gray-500">行业说明</span>
                <textarea
                  value={customIndustryDescription}
                  onChange={(event) => setCustomIndustryDescription(event.target.value)}
                  placeholder="说明常见业务、沟通对象和翻译偏好"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
                />
              </label>
              <button
                type="button"
                onClick={saveCustomIndustry}
                disabled={!customIndustryName.trim() || !customIndustryDescription.trim()}
                className="min-h-11 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 active:bg-slate-800"
              >
                保存并使用
              </button>
            </section>
          </>
        )}

        {detail === 'scenes' && (
          <section className="space-y-3">
            {scenes.map((scene) => {
              const isVisible = visibleSceneIds.includes(scene.id);
              const SelectionIcon = isVisible ? CheckCircle2 : Circle;

              return (
                <article key={scene.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-950">{scene.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{scene.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleVisibleScene(scene.id)}
                    aria-pressed={isVisible}
                    aria-label={`${isVisible ? '隐藏' : '展示'}${scene.name}`}
                    className="min-h-11 min-w-11 -mr-2 -mt-2 rounded-full flex items-center justify-center active:bg-gray-100 transition-colors"
                  >
                    <SelectionIcon className={isVisible ? 'w-5 h-5 text-blue-600' : 'w-5 h-5 text-gray-300'} />
                  </button>
                </article>
              );
            })}

            <button
              type="button"
              onClick={() => onOpenScreen({ type: 'scene-editor' })}
              className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-4 text-left flex items-start gap-3 active:bg-blue-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-blue-900">新增自定义场景</span>
                <span className="block text-xs text-blue-700/80 leading-relaxed mt-1">可按你的业务习惯保存常用对话、关键词和纪要模板，例如“矿区接待客户”或“和清关代理核费用”。</span>
              </span>
            </button>
          </section>
        )}

        {detail === 'terms' && (
          <section className="space-y-3">
            {terms.map((term) => (
              <article key={term.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-950">{term.zh}</p>
                    <p className="text-sm text-blue-700 mt-1">{term.idText}</p>
                    <p className="text-xs text-gray-500 mt-2">{term.note}</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-gray-100 text-[11px] text-gray-600">{term.category}</span>
                </div>
              </article>
            ))}
          </section>
        )}

        {detail === 'general' && (
          <>
            <SettingBlock title="默认语言与方向">
              <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                    <Languages className="w-4 h-4 text-blue-600" />
                    默认源语言
                  </div>
                  <SelectField options={SOURCE_LANGUAGE_OPTIONS} value={generalSettings.sourceLanguage} onChange={updateSourceLanguage} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                    <Languages className="w-4 h-4 text-blue-600" />
                    默认目标语言
                  </div>
                  <SelectField options={TARGET_LANGUAGE_OPTIONS} value={generalSettings.targetLanguage} onChange={updateTargetLanguage} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                    <Headphones className="w-4 h-4 text-blue-600" />
                    同声传译默认方向
                  </div>
                  <ChoiceGroup options={DIRECTION_OPTIONS} value={generalSettings.simultaneousDirection} onChange={(value) => updateSettings({ simultaneousDirection: value })} />
                </div>
              </section>
            </SettingBlock>

            <SettingBlock title="翻译偏好">
              <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                  <ScrollText className="w-4 h-4 text-blue-600" />
                  译文正式度
                </div>
                <ChoiceGroup options={FORMALITY_OPTIONS} value={generalSettings.translationFormality} onChange={(value) => updateSettings({ translationFormality: value })} />
              </section>
            </SettingBlock>

            <SettingBlock title="显示与交互">
              <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                    <Type className="w-4 h-4 text-blue-600" />
                    字幕字号
                  </div>
                  <ChoiceGroup options={SUBTITLE_SIZE_OPTIONS} value={generalSettings.subtitleSize} onChange={(value) => updateSettings({ subtitleSize: value })} />
                </div>
              </section>
              <SwitchRow
                title="显示原文"
                description="在字幕和翻译结果中同时展示印尼语/中文原文。"
                checked={generalSettings.showOriginalText}
                onChange={(checked) => updateSettings({ showOriginalText: checked })}
              />
              <SwitchRow
                title="自动生成纪要"
                description="完成面对面翻译或通话后，默认整理重点、待办和术语。"
                checked={generalSettings.autoGenerateSummary}
                onChange={(checked) => updateSettings({ autoGenerateSummary: checked })}
              />
            </SettingBlock>

            <SettingBlock title="历史记录">
              <SwitchRow
                title="展示历史记录"
                description="控制首页是否展示最近一次翻译纪要，不会删除任何记录。"
                checked={generalSettings.showHistory}
                onChange={(checked) => updateSettings({ showHistory: checked })}
              />
              <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                  <FileText className="w-4 h-4 text-blue-600" />
                  最近记录保留数量
                </div>
                <ChoiceGroup options={HISTORY_LIMIT_OPTIONS} value={generalSettings.historyLimit} onChange={(value) => updateSettings({ historyLimit: value })} />
              </section>
              <section className="bg-white border border-red-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-950">清空历史记录</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">会删除本机保存的翻译历史和纪要，术语库不会被删除。</p>
                  </div>
                </div>
                {confirmClearHistory ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmClearHistory(false)}
                      className="min-h-11 rounded-xl bg-gray-100 text-sm font-semibold text-gray-700 active:bg-gray-200"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="min-h-11 rounded-xl bg-red-600 text-sm font-semibold text-white active:bg-red-700"
                    >
                      确认清空
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="min-h-11 w-full rounded-xl bg-red-50 text-sm font-semibold text-red-700 active:bg-red-100"
                  >
                    清空历史记录
                  </button>
                )}
              </section>
            </SettingBlock>
          </>
        )}

        {detail === 'privacy' && !activePrivacyDocument && (
          <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {([
              { id: 'privacy-policy' as PrivacyDocument, icon: ShieldCheck, title: '隐私政策', subtitle: '数据保存、权限和敏感信息说明' },
              { id: 'user-agreement' as PrivacyDocument, icon: ScrollText, title: '用户协议', subtitle: '服务边界、用户责任和原型限制' },
            ]).map((document, index, list) => {
              const DocumentIcon = document.icon;
              return (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => setPrivacyDocument(document.id)}
                  className={cn('min-h-16 w-full p-4 flex items-center justify-between gap-4 text-left active:bg-gray-50', index !== list.length - 1 && 'border-b border-gray-100')}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <DocumentIcon className="w-5 h-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-950">{document.title}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-gray-500">{document.subtitle}</span>
                    </span>
                  </span>
                  <ChevronRight className="w-5 h-5 shrink-0 text-gray-400" />
                </button>
              );
            })}
          </section>
        )}

        {detail === 'privacy' && activePrivacyDocument && (
          <section className="space-y-3">
            {activePrivacyDocument.sections.map((section) => (
              <article key={section.title} className="bg-white border border-gray-200 rounded-2xl p-4">
                <h2 className="text-sm font-semibold text-gray-950">{section.title}</h2>
                <div className="mt-3 space-y-2">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-6 text-gray-600">{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}

        {detail === 'help' && (
          <>
            <SettingBlock title="快速上手">
              <section className="grid gap-3">
                {QUICK_START_ITEMS.map((item) => {
                  const QuickIcon = item.icon;
                  return (
                    <article key={item.title} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <QuickIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-gray-950">{item.title}</h2>
                        <p className="mt-1 text-xs leading-5 text-gray-500">{item.body}</p>
                      </div>
                    </article>
                  );
                })}
              </section>
            </SettingBlock>

            <SettingBlock title="反馈入口">
              <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                {feedbackSubmitted && (
                  <div className="rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-700 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    已收到反馈，感谢你帮我们把 Knowly 打磨得更顺手。
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-500">问题类型</label>
                  <ChoiceGroup options={FEEDBACK_OPTIONS} value={feedbackType} onChange={setFeedbackType} />
                </div>

                <label className="block space-y-2">
                  <span className="block text-xs font-semibold text-gray-500">问题描述</span>
                  <textarea
                    value={feedbackDescription}
                    onChange={(event) => {
                      setFeedbackDescription(event.target.value);
                      setFeedbackSubmitted(false);
                    }}
                    rows={5}
                    placeholder="告诉我们发生了什么，例如哪句话翻译不自然、哪个场景不好用，或你期待怎样改。"
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-gray-500">可选截图</span>
                  <span className="min-h-12 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-3 flex items-center justify-between gap-3 text-sm text-gray-600">
                    <span className="min-w-0 flex items-center gap-2">
                      <Upload className="w-4 h-4 shrink-0 text-gray-400" />
                      <span className="truncate">{feedbackAttachmentName || '上传截图或问题图片'}</span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-blue-600">选择</span>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => setFeedbackAttachmentName(event.target.files?.[0]?.name ?? '')}
                  />
                </label>

                <SwitchRow
                  title="附带最近页面信息"
                  description="帮助我们定位问题。当前原型只做本地 mock，不会真的上传。"
                  checked={includeRecentContext}
                  onChange={setIncludeRecentContext}
                />

                <button
                  type="button"
                  onClick={submitFeedback}
                  disabled={!feedbackDescription.trim()}
                  className="min-h-12 w-full rounded-2xl bg-slate-950 text-sm font-semibold text-white flex items-center justify-center gap-2 active:bg-slate-800 disabled:bg-gray-200 disabled:text-gray-400"
                >
                  <Send className="w-4 h-4" />
                  提交反馈
                </button>
              </section>
            </SettingBlock>
          </>
        )}
      </div>
    </motion.div>
  );
}
