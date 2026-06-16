import {
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Crown,
  HelpCircle,
  Languages,
  Pencil,
  ScrollText,
  Shield,
  Trash2,
  Type,
  User,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode } from 'react';
import { type ChangeEvent, type KeyboardEvent, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { readStoredValue, writeStoredValue } from '@/lib/storage';
import type {
  AppScreen,
  GeneralSettings,
  HistoryLimit,
  LanguageCode,
  SourceLanguageCode,
  SubtitleSize,
  TranslationFormality,
} from '@/types';

interface ProfileViewProps {
  generalSettings: GeneralSettings;
  onOpenScreen: (screen: AppScreen) => void;
  onUpdateGeneralSettings: (settings: GeneralSettings) => void;
  onClearHistory: () => void;
}

interface UserProfileDraft {
  displayName: string;
  avatarUrl: string;
}

interface ChoiceOption<T extends string | number> {
  value: T;
  label: string;
}

const USER_PROFILE_KEY = 'knowly.userProfile.v1';
const DEFAULT_USER_PROFILE: UserProfileDraft = {
  displayName: 'User1294',
  avatarUrl: '',
};
const CURRENT_PLAN_LABEL = '免费版';

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

const FORMALITY_OPTIONS: ChoiceOption<TranslationFormality>[] = [
  { value: 'plain', label: '自然直译' },
  { value: 'business', label: '商务正式' },
  { value: 'formal', label: '科学严谨' },
];

const SUBTITLE_SIZE_OPTIONS: ChoiceOption<SubtitleSize>[] = [
  { value: 'compact', label: '紧凑' },
  { value: 'standard', label: '标准' },
  { value: 'large', label: '大字' },
];

const HISTORY_DISPLAY_OPTIONS: ChoiceOption<HistoryLimit>[] = [
  { value: 10, label: '10 条' },
  { value: 20, label: '20 条' },
  { value: 50, label: '50 条' },
];

function SettingSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

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
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            type="button"
            key={String(option.value)}
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              'min-h-10 rounded-xl border px-2 text-center text-sm font-semibold transition-colors',
              selected ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 active:bg-gray-50',
            )}
          >
            {option.label}
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
      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

function SwitchRow({
  title,
  checked,
  onChange,
}: {
  title: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="min-h-12 w-full rounded-2xl bg-white px-4 py-3 text-left flex items-center justify-between gap-4 active:bg-gray-50 transition-colors"
    >
      <span className="text-sm font-semibold text-gray-950">{title}</span>
      <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-blue-500' : 'bg-gray-300')}>
        <span className={cn('absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform', checked && 'translate-x-5')} />
      </span>
    </button>
  );
}

export function ProfileView({ generalSettings, onOpenScreen, onUpdateGeneralSettings, onClearHistory }: ProfileViewProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [userProfile, setUserProfile] = useState<UserProfileDraft>(() => readStoredValue(USER_PROFILE_KEY, DEFAULT_USER_PROFILE));
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(userProfile.displayName);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  function updateUserProfile(nextProfile: UserProfileDraft) {
    setUserProfile(nextProfile);
    writeStoredValue(USER_PROFILE_KEY, nextProfile);
  }

  function startNameEdit() {
    setDraftName(userProfile.displayName);
    setEditingName(true);
  }

  function cancelNameEdit() {
    setDraftName(userProfile.displayName);
    setEditingName(false);
  }

  function commitNameEdit() {
    const nextName = draftName.trim();
    if (nextName) updateUserProfile({ ...userProfile, displayName: nextName });
    setEditingName(false);
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitNameEdit();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelNameEdit();
    }
  }

  function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateUserProfile({ ...userProfile, avatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function updateSettings(nextSettings: Partial<GeneralSettings>) {
    onUpdateGeneralSettings({
      ...generalSettings,
      ...nextSettings,
    });
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

  function handleClearHistory() {
    if (!confirmClearHistory) {
      setConfirmClearHistory(true);
      return;
    }

    onClearHistory();
    setConfirmClearHistory(false);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col min-h-full bg-slate-50 relative">
      <header className="px-6 pt-12 pb-6 bg-slate-900 text-white sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="sr-only"
            aria-label="上传头像"
          />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/30 bg-white/20 backdrop-blur-sm"
            aria-label="编辑头像"
          >
            {userProfile.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 flex h-6 items-center justify-center bg-black/45 text-white opacity-95">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </button>

          <div className="flex min-h-16 min-w-0 flex-1 items-center">
            {editingName ? (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  autoFocus
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  onFocus={(event) => event.currentTarget.select()}
                  onKeyDown={handleNameKeyDown}
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-3 text-base font-semibold text-white outline-none placeholder:text-white/45 focus:border-white/50"
                  aria-label="用户名"
                />
                <button
                  type="button"
                  onClick={commitNameEdit}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 active:scale-[0.98]"
                  aria-label="保存用户名"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={cancelNameEdit}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white active:scale-[0.98]"
                  aria-label="取消编辑用户名"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex min-w-0 flex-col items-start justify-center gap-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-xl font-bold tracking-tight">{userProfile.displayName}</h1>
                  <button
                    type="button"
                    onClick={startNameEdit}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/75 active:bg-white/10 active:text-white"
                    aria-label="编辑用户名"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                <div className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 text-xs font-semibold text-white/85">
                  <Crown className="h-3.5 w-3.5 text-blue-200" />
                  当前方案 · {CURRENT_PLAN_LABEL}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 pb-24">
        <div className="p-4 space-y-5">
          <section className="space-y-3">
            <button
              type="button"
              onClick={() => setIsSettingsOpen((open) => !open)}
              aria-expanded={isSettingsOpen}
              className="min-h-11 w-full px-1 flex items-center justify-between gap-3 text-left"
            >
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">系统设置</h2>
              <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', isSettingsOpen && 'rotate-180')} />
            </button>

            {isSettingsOpen && (
              <div className="space-y-4">
                <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-950">语言</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block space-y-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                        <Languages className="w-3.5 h-3.5 text-blue-600" />
                        源语言
                      </span>
                      <SelectField options={SOURCE_LANGUAGE_OPTIONS} value={generalSettings.sourceLanguage} onChange={updateSourceLanguage} />
                    </label>
                    <label className="block space-y-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                        <Languages className="w-3.5 h-3.5 text-blue-600" />
                        目标语言
                      </span>
                      <SelectField options={TARGET_LANGUAGE_OPTIONS} value={generalSettings.targetLanguage} onChange={updateTargetLanguage} />
                    </label>
                  </div>
                </section>

                <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-950">翻译</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                      <ScrollText className="w-3.5 h-3.5 text-blue-600" />
                      译文风格
                    </div>
                    <ChoiceGroup options={FORMALITY_OPTIONS} value={generalSettings.translationFormality} onChange={(value) => updateSettings({ translationFormality: value })} />
                  </div>
                  <SwitchRow
                    title="自动纪要"
                    checked={generalSettings.autoGenerateSummary}
                    onChange={(checked) => updateSettings({ autoGenerateSummary: checked })}
                  />
                </section>

                <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-950">显示</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                      <Type className="w-3.5 h-3.5 text-blue-600" />
                      字幕字号
                    </div>
                    <ChoiceGroup options={SUBTITLE_SIZE_OPTIONS} value={generalSettings.subtitleSize} onChange={(value) => updateSettings({ subtitleSize: value })} />
                  </div>
                  <SwitchRow
                    title="显示原文"
                    checked={generalSettings.showOriginalText}
                    onChange={(checked) => updateSettings({ showOriginalText: checked })}
                  />
                </section>

                <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-950">历史</h3>
                  <SwitchRow
                    title="首页历史"
                    checked={generalSettings.showHistory}
                    onChange={(checked) => updateSettings({ showHistory: checked })}
                  />
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-500">展示记录</div>
                    <ChoiceGroup options={HISTORY_DISPLAY_OPTIONS} value={generalSettings.historyLimit} onChange={(value) => updateSettings({ historyLimit: value })} />
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
                      className="min-h-11 w-full rounded-xl bg-red-50 text-sm font-semibold text-red-700 active:bg-red-100 inline-flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      清空历史记录
                    </button>
                  )}
                </section>
              </div>
            )}
          </section>

          <SettingSection title="更多">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {[
                { icon: Shield, label: '隐私与安全', detail: 'privacy' as const, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { icon: HelpCircle, label: '帮助与反馈', detail: 'help' as const, color: 'text-blue-600', bg: 'bg-blue-50' },
              ].map((item, i, arr) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onOpenScreen({ type: 'profile-detail', detail: item.detail })}
                className={cn('min-h-14 w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left', i !== arr.length - 1 && 'border-b border-gray-100')}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', item.bg, item.color)}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              ))}
            </div>
          </SettingSection>
        </div>
      </div>
    </motion.div>
  );
}
