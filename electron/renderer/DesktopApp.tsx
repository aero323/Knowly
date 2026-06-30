import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Captions,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleStop,
  Crown,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  Globe2,
  Handshake,
  History,
  CircleHelp,
  Languages,
  Link2,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Maximize2,
  MessageSquareText,
  Mic,
  MicOff,
  Minus,
  PanelRight,
  Pause,
  Pencil,
  Phone,
  PhoneOff,
  Play,
  Plus,
  Radio,
  Settings2,
  ShieldCheck,
  Smartphone,
  ScrollText,
  Type,
  Upload,
  UserPlus,
  UserRound,
  Video,
  VideoOff,
  Wifi,
  Volume2,
  X,
} from 'lucide-react';
import { CONTACTS, DEFAULT_TERMS, SCENES, SCENE_SCRIPTS, SIMULTANEOUS_CAPTIONS, makeSummary } from '@/data/mockData';
import appDownloadQrUrl from '../../assets/brand/knowly-app-download-qr.png';
import knowlyLogoUrl from '../../assets/brand/knowly-logo.png';
import { cn } from '@/lib/utils';
import { readStoredValue, writeStoredValue } from '@/lib/storage';
import type { CallSession, ConversationTurn, SessionSummary, TermEntry } from '@/types';
import type {
  CaptionOverlaySettings,
  CaptionStreamState,
  DesktopCaptionLine,
  DesktopSourceLanguage,
  DesktopTargetLanguage,
  StartCaptionStreamOptions,
} from '../shared/desktopApi';
import {
  DESKTOP_TARGET_LANGUAGE_OPTIONS,
  activeDesktopTargetLanguages,
  buildDesktopCaptionTranslations,
  desktopTargetLanguageLabel,
  normalizeDesktopTargetLanguages,
} from '../shared/desktopApi';

type DesktopView = 'call' | 'captions' | 'preferences';
type DesktopCallStage = 'home' | 'lobby' | 'room' | 'ended';
type DesktopCallMode = 'voice' | 'video' | 'join' | 'contact';
type DesktopCaptionMode = 'both' | 'source' | 'target';
type DesktopTranslationFormality = 'plain' | 'business' | 'formal';
type DesktopSubtitleSize = 'compact' | 'standard' | 'large';
type DesktopAccountPlan = 'free' | 'enterprise';

interface DesktopTranslationPreferences {
  sourceLanguage: DesktopSourceLanguage;
  targetLanguage: DesktopTargetLanguage;
  targetLanguages: DesktopTargetLanguage[];
  translationFormality: DesktopTranslationFormality;
  subtitleSize: DesktopSubtitleSize;
  showOriginalText: boolean;
  autoGenerateSummary: boolean;
  useTermsLibrary: boolean;
  activeSceneId: string;
}

interface DesktopCustomScene {
  id: string;
  name: string;
  prompt: string;
}

interface DesktopMockUser {
  id: string;
  phone: string;
  email?: string;
  name: string;
  company: string;
  plan: DesktopAccountPlan;
  createdAt: string;
}

interface ReferenceFileState {
  name: string;
  size: number;
  extension: string;
  uploadedAt: string;
}

interface DesktopCaptionSession {
  id: string;
  title: string;
  startedAt: string;
  endedAt: string;
  sourceDevice: string;
  sourceLanguage: DesktopSourceLanguage;
  targetLanguage: DesktopTargetLanguage;
  targetLanguages: DesktopTargetLanguage[];
  preferenceSummary: string;
  lines: DesktopCaptionLine[];
  turns: ConversationTurn[];
  summary: SessionSummary;
}

interface DesktopCallDraft {
  mode: DesktopCallMode;
  code: string;
  contactId?: string;
}

type ContactHistorySession = {
  id: string;
  title: string;
  time: string;
  summary: string;
  transcript: Array<{ speaker: string; source: string; translated: string }>;
};

const INVITE_CODE = '7A3-K9W';
const CAPTION_CONFERENCE_CODE = 'KLY-2026';

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
} satisfies Record<string, ContactHistorySession[]>;

const REMOTE_PROFILES: Record<string, { name: string; role: string; image: string; location: string; latency: string }> = {
  '1': {
    name: 'Budi',
    role: '冶炼厂现场',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
    location: 'Morowali',
    latency: '48ms',
  },
  '2': {
    name: 'Sari',
    role: '雅加达清关',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80',
    location: 'Jakarta',
    latency: '62ms',
  },
  '3': {
    name: '物流 Adi',
    role: '港口调度',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80',
    location: 'Surabaya',
    latency: '54ms',
  },
  'new-contact': {
    name: '新联系人',
    role: 'Knowly App',
    image: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=900&q=80',
    location: 'App 端',
    latency: '64ms',
  },
  default: {
    name: 'Budi',
    role: '冶炼厂现场',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
    location: 'Morowali',
    latency: '52ms',
  },
};

const CAPTION_MODES: Array<{ id: DesktopCaptionMode; label: string }> = [
  { id: 'both', label: '双语字幕' },
  { id: 'source', label: '只看原文' },
  { id: 'target', label: '只看译文' },
];

const DEFAULT_OVERLAY_SETTINGS: CaptionOverlaySettings = {
  visible: false,
  opacity: 0.9,
  fontScale: 1,
  showOriginal: true,
  showTranslation: true,
  scrollMode: true,
  visibleLineCount: 3,
  fullscreen: false,
};

const MULTILINGUAL_CAPTION_DEMO_LANGUAGES: DesktopTargetLanguage[] = ['zh', 'en', 'th'];

const DEFAULT_CAPTION_STATE: CaptionStreamState = {
  running: false,
  paused: false,
  lineCount: 0,
  sourceDevice: 'system-mix',
  sourceLanguage: 'auto',
  targetLanguage: 'zh',
  targetLanguages: ['zh'],
};

const DEFAULT_DESKTOP_TARGET_LANGUAGES: DesktopTargetLanguage[] = ['id'];

const DESKTOP_PREFERENCES_KEY = 'knowly.desktop.translationPreferences.v1';
const DESKTOP_TERMS_KEY = 'knowly.desktop.terms.v1';
const DESKTOP_CUSTOM_SCENES_KEY = 'knowly.desktop.customScenes.v1';
const DESKTOP_CAPTION_SESSIONS_KEY = 'knowly.desktop.captionSessions.v1';
const DESKTOP_AUTH_USER_KEY = 'knowly.desktop.mockUser.v1';
const REFERENCE_FILE_LIMIT_BYTES = 5 * 1024 * 1024;
const REFERENCE_FILE_EXTENSIONS = ['txt', 'docx', 'pdf', 'xlsx'] as const;
const DEFAULT_CUSTOM_SCENE_PROMPT = '请根据当前业务场景调整翻译：优先保留关键专有名词、金额、时间、单据名称和责任方；语气保持清楚、礼貌、可直接用于商务沟通。';

const DEFAULT_TRANSLATION_PREFERENCES: DesktopTranslationPreferences = {
  sourceLanguage: 'auto',
  targetLanguage: 'id',
  targetLanguages: DEFAULT_DESKTOP_TARGET_LANGUAGES,
  translationFormality: 'business',
  subtitleSize: 'standard',
  showOriginalText: true,
  autoGenerateSummary: true,
  useTermsLibrary: true,
  activeSceneId: 'meeting',
};

const AUDIO_DEVICES = [
  { id: 'system-mix', label: '系统混音（默认）', detail: '可在此处选择输入音源，如内置麦克风、会议软件、浏览器、播放器等' },
  { id: 'mic-default', label: '默认麦克风', detail: 'MacBook / 外接麦克风' },
  { id: 'meeting-app', label: '会议应用', detail: 'Zoom / Teams / 飞书会议' },
];

const SOURCE_LANGUAGES: Array<{ value: DesktopSourceLanguage; label: string }> = [
  { value: 'auto', label: '自动识别' },
  { value: 'id', label: '印尼语' },
  { value: 'zh', label: '中文' },
  { value: 'en', label: '英语' },
];

const TARGET_LANGUAGES = DESKTOP_TARGET_LANGUAGE_OPTIONS;

const FORMALITY_OPTIONS: Array<{ value: DesktopTranslationFormality; label: string; description: string }> = [
  { value: 'plain', label: '自然直译', description: '保留口语感' },
  { value: 'business', label: '商务正式', description: '默认推荐' },
  { value: 'formal', label: '科学严谨', description: '适合合同和文件' },
];

const SUBTITLE_SIZE_OPTIONS: Array<{ value: DesktopSubtitleSize; label: string }> = [
  { value: 'compact', label: '小字' },
  { value: 'standard', label: '标准' },
  { value: 'large', label: '大字' },
];

function desktopPlanLabel(plan: DesktopAccountPlan) {
  return plan === 'enterprise' ? '企业版' : '未付费';
}

function desktopPlanBadgeClass(plan: DesktopAccountPlan) {
  return plan === 'enterprise'
    ? 'bg-blue-50 text-blue-700'
    : 'bg-amber-50 text-amber-700';
}

function maskPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return phone;
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
}

function makeDesktopMockUser(plan: DesktopAccountPlan, account: string): DesktopMockUser {
  const normalizedAccount = account.trim();
  const isEmail = normalizedAccount.includes('@');
  const normalizedPhone = normalizedAccount.replace(/\D/g, '');
  return {
    id: `desktop-mock-${plan}-${isEmail ? normalizedAccount.toLowerCase() : normalizedPhone || Date.now()}`,
    phone: isEmail ? '' : normalizedPhone || normalizedAccount,
    email: isEmail ? normalizedAccount.toLowerCase() : undefined,
    name: plan === 'enterprise' ? '企业管理员' : '未付费用户',
    company: plan === 'enterprise' ? 'Knowly 企业测试账号' : '待开通企业账号',
    plan,
    createdAt: new Date().toISOString(),
  };
}

function readDesktopMockUser() {
  const stored = readStoredValue<Partial<DesktopMockUser> | null>(DESKTOP_AUTH_USER_KEY, null);
  if (!stored?.phone && !stored?.email) return null;
  return {
    id: stored.id ?? `desktop-mock-${stored.email ?? stored.phone}`,
    phone: stored.phone ?? '',
    email: stored.email,
    name: stored.name ?? '未付费用户',
    company: stored.company ?? '待开通企业账号',
    plan: stored.plan === 'enterprise' ? 'enterprise' : 'free',
    createdAt: stored.createdAt ?? new Date().toISOString(),
  } satisfies DesktopMockUser;
}

function desktopPreferenceSummary(preferences: DesktopTranslationPreferences) {
  const source = SOURCE_LANGUAGES.find((item) => item.value === preferences.sourceLanguage)?.label ?? preferences.sourceLanguage;
  const target = desktopTargetLanguageSummary(preferences.targetLanguages, preferences.targetLanguage);
  const formality = FORMALITY_OPTIONS.find((item) => item.value === preferences.translationFormality)?.label ?? preferences.translationFormality;
  return `${source} → ${target} · ${formality}${preferences.useTermsLibrary ? ' · 使用术语库' : ''}`;
}

function desktopTargetLanguageSummary(targetLanguages: DesktopTargetLanguage[] | undefined, fallback: DesktopTargetLanguage) {
  const activeLanguages = activeDesktopTargetLanguages(targetLanguages, fallback);
  if (activeLanguages.length === 0) return '无译文';
  return activeLanguages.map(desktopTargetLanguageLabel).join(' / ');
}

function captionTranslationTrackLabel(label: string, index: number, total: number) {
  return total > 1 ? `译文 ${index + 1} · ${label}` : `译文 · ${label}`;
}

function captionSourceLanguageLabel(language: DesktopCaptionLine['sourceLanguage']) {
  if (language === 'zh') return '中文';
  if (language === 'id') return '印尼语';
  return '原语言';
}

function isDesktopTargetLanguage(value: unknown): value is DesktopTargetLanguage {
  return TARGET_LANGUAGES.some((item) => item.value === value);
}

function desktopCaptionSessionSummary(
  preferences: DesktopTranslationPreferences,
  sourceLanguage: DesktopSourceLanguage,
  targetLanguages: DesktopTargetLanguage[],
) {
  const source = SOURCE_LANGUAGES.find((item) => item.value === sourceLanguage)?.label ?? sourceLanguage;
  const target = desktopTargetLanguageSummary(targetLanguages, preferences.targetLanguage);
  const formality = FORMALITY_OPTIONS.find((item) => item.value === preferences.translationFormality)?.label ?? preferences.translationFormality;
  return `${source} → ${target} · ${formality}${preferences.useTermsLibrary ? ' · 使用术语库' : ''}`;
}

function desktopCaptionTemporarySummary(sourceLanguage: DesktopSourceLanguage, targetLanguages: DesktopTargetLanguage[]) {
  const source = SOURCE_LANGUAGES.find((item) => item.value === sourceLanguage)?.label ?? sourceLanguage;
  const target = desktopTargetLanguageSummary(targetLanguages, 'zh');
  return `临时设置 · ${source} → ${target}`;
}

function subtitleSizeToOverlayDefaults(size: DesktopSubtitleSize): Pick<CaptionOverlaySettings, 'fontScale'> {
  if (size === 'compact') return { fontScale: 0.9 };
  if (size === 'large') return { fontScale: 1.18 };
  return { fontScale: 1 };
}

function primaryCaptionTranslationText(line: DesktopCaptionLine) {
  return line.translations?.[0]?.translatedText ?? line.translatedText;
}

function withDesktopCaptionTranslations(line: DesktopCaptionLine, targetLanguages: DesktopTargetLanguage[] | undefined): DesktopCaptionLine {
  const translations = buildDesktopCaptionTranslations(line.originalText, line.translatedText, targetLanguages);
  return {
    ...line,
    targetLanguage: translations[0]?.targetLanguage ?? 'none',
    translatedText: translations[0]?.translatedText ?? '',
    translations,
  };
}

function captionLinesToTurns(lines: DesktopCaptionLine[]): ConversationTurn[] {
  return lines.map((line) => ({
    id: `desktop-caption-turn-${line.id}`,
    speaker: line.speakerId === 'speaker-1' ? 'me' : 'counterpart',
    sourceLanguage: line.sourceLanguage,
    targetLanguage: line.targetLanguage === 'id' ? 'id' : 'zh',
    sourceText: line.originalText,
    translatedText: primaryCaptionTranslationText(line),
    terms: line.keywords,
  }));
}

function simultaneousCaptionTodos(turns: ConversationTurn[], fallbackTodos: string[]) {
  const terms = new Set(turns.flatMap((turn) => turn.terms));
  const todos = [
    terms.has('发票') || terms.has('装箱单') ? '跟进发票和装箱单在约定时间前发出' : '',
    terms.has('船期') || terms.has('港口确认') ? '再次确认船期和港口状态' : '',
    terms.has('滞港费') || terms.has('费用承担') ? '书面确认滞港费责任方' : '',
  ].filter(Boolean);

  return todos.length > 0 ? todos : fallbackTodos;
}

function makeDesktopCaptionTitle(turns: ConversationTurn[]) {
  const terms = new Set(turns.flatMap((turn) => turn.terms));
  const text = turns.map((turn) => `${turn.sourceText} ${turn.translatedText}`).join(' ');

  if (terms.has('船期') || terms.has('港口确认') || /船期|港口|kapal|pelabuhan/i.test(text)) {
    return '船期与港口确认';
  }

  if (terms.has('DP') || /付款|到账|DP|payment|transfer/i.test(text)) {
    return '付款节点确认';
  }

  if (terms.has('发票') || terms.has('装箱单') || /发票|装箱单|invoice|packing list/i.test(text)) {
    return '单据交付确认';
  }

  if (terms.has('滞港费') || terms.has('费用承担') || /滞港费|费用承担|demurrage/i.test(text)) {
    return '滞港费责任确认';
  }

  if (terms.has('清关') || /清关|海关|bea cukai|customs/i.test(text)) {
    return '清关资料沟通';
  }

  if (terms.has('镍矿') || /镍矿|bijih nikel/i.test(text)) {
    return '镍矿业务沟通';
  }

  const firstTranslatedText = turns.find((turn) => turn.translatedText.trim())?.translatedText.trim() ?? '';
  if (firstTranslatedText) {
    return firstTranslatedText.replace(/[。！？.!?].*$/, '').slice(0, 14);
  }

  return '同传沟通纪要';
}

function makeDesktopCaptionSummary(turns: ConversationTurn[]): SessionSummary {
  const baseSummary = makeSummary(turns);
  const terms = Array.from(new Set(turns.flatMap((turn) => turn.terms))).slice(0, 8);

  return {
    ...baseSummary,
    title: makeDesktopCaptionTitle(turns),
    minutes: [
      '本次同声传译已整理为双语纪要。',
      terms.length > 0 ? `重点涉及 ${terms.slice(0, 5).join('、')}。` : '已整理关键内容、确认事项和后续跟进。',
      ...baseSummary.minutes.slice(0, 2),
    ],
    todos: simultaneousCaptionTodos(turns, baseSummary.todos),
    terms,
  };
}

function captionSummaryMinutes(minutes: string[]) {
  return minutes.map((minute) => (
    /共记录\s*\d+\s*条双语字幕/.test(minute) ? '本次同声传译已整理为双语纪要。' : minute
  ));
}

function captionSessionTitle(session: DesktopCaptionSession) {
  if (session.title && session.title !== '同声传译纪要') return session.title;
  return makeDesktopCaptionTitle(session.turns.length ? session.turns : captionLinesToTurns(session.lines));
}

function readDesktopPreferences() {
  const stored = readStoredValue<Partial<DesktopTranslationPreferences> | null>(DESKTOP_PREFERENCES_KEY, null);
  if (!stored) return DEFAULT_TRANSLATION_PREFERENCES;

  const validSource = SOURCE_LANGUAGES.some((item) => item.value === stored.sourceLanguage);
  const validTarget = TARGET_LANGUAGES.some((item) => item.value === stored.targetLanguage);
  const storedTargetLanguage = validTarget ? stored.targetLanguage! : DEFAULT_TRANSLATION_PREFERENCES.targetLanguage;
  const storedTargetLanguages = Array.isArray(stored.targetLanguages)
    ? stored.targetLanguages.filter(isDesktopTargetLanguage).slice(0, 3)
    : [];
  const targetLanguages = normalizeDesktopTargetLanguages(
    storedTargetLanguages.length ? storedTargetLanguages : [storedTargetLanguage],
    storedTargetLanguage,
  );
  const validFormality = FORMALITY_OPTIONS.some((item) => item.value === stored.translationFormality);
  const validSubtitleSize = SUBTITLE_SIZE_OPTIONS.some((item) => item.value === stored.subtitleSize);
  const validScene = SCENES.some((item) => item.id === stored.activeSceneId) || stored.activeSceneId?.startsWith('desktop-custom-scene-');

  return {
    ...DEFAULT_TRANSLATION_PREFERENCES,
    ...stored,
    sourceLanguage: validSource ? stored.sourceLanguage! : DEFAULT_TRANSLATION_PREFERENCES.sourceLanguage,
    targetLanguage: activeDesktopTargetLanguages(targetLanguages, storedTargetLanguage)[0] ?? storedTargetLanguage,
    targetLanguages,
    translationFormality: validFormality ? stored.translationFormality! : DEFAULT_TRANSLATION_PREFERENCES.translationFormality,
    subtitleSize: validSubtitleSize ? stored.subtitleSize! : DEFAULT_TRANSLATION_PREFERENCES.subtitleSize,
    activeSceneId: validScene ? stored.activeSceneId! : DEFAULT_TRANSLATION_PREFERENCES.activeSceneId,
  };
}

function applyMultilingualCaptionDemoPreferences(preferences: DesktopTranslationPreferences): DesktopTranslationPreferences {
  return {
    ...preferences,
    targetLanguage: MULTILINGUAL_CAPTION_DEMO_LANGUAGES[0],
    targetLanguages: MULTILINGUAL_CAPTION_DEMO_LANGUAGES,
    showOriginalText: true,
  };
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatSessionTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSessionDuration(startedAt: string, endedAt: string) {
  const started = new Date(startedAt).getTime();
  const ended = new Date(endedAt).getTime();
  if (Number.isNaN(started) || Number.isNaN(ended)) return '--';
  const seconds = Math.max(0, Math.round((ended - started) / 1000));
  return formatDuration(seconds);
}

function getContactMeta(contact: (typeof CONTACTS)[number]) {
  if (contact.source === 'web') return `网页通话 · ${contact.lastCall}`;
  return `ID ${contact.contactCode} · ${contact.lastCall}`;
}

function makeFallbackCaptionLine(index: number, targetLanguages: DesktopTargetLanguage[] = ['zh']): DesktopCaptionLine {
  const caption = SIMULTANEOUS_CAPTIONS[index % SIMULTANEOUS_CAPTIONS.length];
  return withDesktopCaptionTranslations({
    ...caption,
    id: `browser-fallback-caption-${Date.now()}-${index}`,
    sequence: index + 1,
    receivedAt: new Date().toISOString(),
  }, targetLanguages);
}

function IconButton({
  label,
  children,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  );
}

function StatusPill({ running, paused }: { running: boolean; paused: boolean }) {
  return (
    <span className={cn(
      'inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 text-xs font-semibold',
      running && !paused && 'border-emerald-200 bg-emerald-50 text-emerald-700',
      running && paused && 'border-amber-200 bg-amber-50 text-amber-700',
      !running && 'border-slate-200 bg-slate-50 text-slate-500',
    )}
    >
      <span className={cn(
        'h-2 w-2 rounded-full',
        running && !paused && 'bg-emerald-500',
        running && paused && 'bg-amber-500',
        !running && 'bg-slate-300',
      )}
      />
      {running ? paused ? '已暂停' : '实时中' : '待开始'}
    </span>
  );
}

function DeveloperNoteBadge({ note }: { note: string }) {
  return (
    <span
      tabIndex={0}
      role="note"
      aria-label={note}
      aria-describedby="ai-call-dev-note"
      className="group absolute right-1.5 top-1.5 z-20 flex h-5 min-w-5 cursor-help items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-black leading-none text-slate-950 shadow-sm outline-none ring-1 ring-amber-500/30 focus:ring-2 focus:ring-amber-300"
    >
      注
      <span
        id="ai-call-dev-note"
        className="pointer-events-none absolute right-0 top-full z-[9999] mt-1 w-max max-w-44 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold leading-5 text-white opacity-0 shadow-xl transition group-hover:opacity-100 group-focus:opacity-100"
      >
        {note}
      </span>
    </span>
  );
}

function DesktopLoginScreen({ onLogin }: { onLogin: (user: DesktopMockUser) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const normalizedEmail = email.trim().toLowerCase();
  const emailReady = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const canSubmit = emailReady && password.trim().length >= 6;

  function submitLogin() {
    if (!canSubmit) {
      setLoginError('请输入正确的邮箱和至少 6 位密码');
      return;
    }
    onLogin(makeDesktopMockUser('free', normalizedEmail));
  }

  return (
    <main className="flex h-full min-h-0 items-center justify-center overflow-y-auto bg-[#eef2f7] px-6 py-8">
      <section className="grid w-full max-w-5xl grid-cols-[minmax(0,0.9fr)_minmax(360px,420px)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <div className="flex min-h-[620px] flex-col justify-between bg-slate-950 p-10 text-white">
          <div>
            <div className="flex items-center gap-3">
              <img src={knowlyLogoUrl} alt="Knowly" className="h-12 w-12 rounded-lg bg-white object-contain p-1" />
	              <div>
	                <p className="text-base font-black">懂译Knowly</p>
	                <p className="mt-0.5 text-xs font-semibold text-white/55">AI Multilingual Workspace</p>
	              </div>
	            </div>

	            <div className="mt-16 max-w-xl">
	              <p className="text-sm font-bold text-blue-200">Knowly Desktop</p>
	              <h1 className="mt-4 text-4xl font-black leading-tight">登录后开始桌面端字幕同传</h1>
	              <p className="mt-5 text-base font-semibold leading-7 text-white/68">
	                在会议、网页通话和本地音频中实时生成字幕，并同步展示多语译文。企业账号可开启完整同传能力，让跨语言沟通保持清楚、连贯。
	              </p>
	            </div>
	          </div>

	          <div className="grid grid-cols-3 gap-3 text-xs font-semibold text-white/70">
	            {['实时字幕', '多语译文', '企业协作'].map((item) => (
	              <div key={item} className="rounded-lg border border-white/10 bg-white/6 px-3 py-3">
	                <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-300" />
	                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center p-8">
	          <div>
	            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Sign in</p>
	            <h2 className="mt-3 text-2xl font-black text-slate-950">请使用Knowly移动端APP账号登录</h2>
	            <p className="mt-2 text-sm leading-6 text-slate-500">输入移动端 APP 账号绑定的邮箱和密码，登录后进入桌面端字幕同传工作台。</p>
	          </div>

          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-500">邮箱</span>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setLoginError('');
                  }}
                  placeholder="name@company.com"
                  inputMode="email"
                  autoComplete="email"
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-500">密码</span>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
                <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setLoginError('');
                  }}
                  placeholder="请输入密码"
                  type="password"
                  autoComplete="current-password"
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            {loginError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-700">{loginError}</p>
            )}

            <button
              type="button"
              onClick={submitLogin}
              disabled={!canSubmit}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-black text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400"
            >
              <LogIn className="h-4 w-4" />
              登录
            </button>
          </div>

	          <div className="mt-8 border-t border-slate-100 pt-5">
	            <p className="text-center text-xs font-bold text-slate-400">体验入口</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
	                onClick={() => onLogin(makeDesktopMockUser('free', '13800000001'))}
	                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
	              >
	                个人体验
              </button>
              <button
                type="button"
	                onClick={() => onLogin(makeDesktopMockUser('enterprise', '13800000002'))}
	                className="h-9 rounded-lg border border-blue-100 bg-blue-50 px-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 active:scale-[0.98]"
	              >
	                企业体验
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Sidebar({
  activeView,
  currentUser,
  onChange,
  onLogout,
}: {
  activeView: DesktopView;
  currentUser: DesktopMockUser;
  onChange: (view: DesktopView) => void;
  onLogout: () => void;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const navItems = [
    { id: 'captions' as const, label: '字幕同传', icon: Captions },
    { id: 'call' as const, label: 'AI 通话', icon: Phone, note: '研发注释：一期不做' },
    { id: 'preferences' as const, label: '翻译偏好', icon: Settings2 },
  ];

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <img src={knowlyLogoUrl} alt="Knowly" className="h-10 w-10 shrink-0 rounded-lg object-contain" />
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">懂译Knowly</p>
          <p className="truncate text-xs text-slate-500">AI Multilingual Workplace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <div key={item.id} className="relative">
              <button
                type="button"
                onClick={() => onChange(item.id)}
                className={cn(
                  'flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition',
                  item.note ? 'pr-8' : '',
                  isActive ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
              {item.note && <DeveloperNoteBadge note={item.note} />}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="relative">
          {accountMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/12">
              <button type="button" onClick={() => setAccountMenuOpen(false)} className="flex h-10 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs font-bold text-slate-800 transition hover:bg-slate-50">
                <UserRound className="h-4 w-4 text-slate-600" />
                {currentUser.email ?? maskPhoneNumber(currentUser.phone)}
              </button>
              <button type="button" className="flex h-10 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs font-bold text-slate-800 transition hover:bg-slate-50">
                <Handshake className="h-4 w-4 text-emerald-600" />
                联系销售
              </button>
              <button type="button" onClick={onLogout} className="flex h-10 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs font-bold text-slate-800 transition hover:bg-slate-50">
                <LogOut className="h-4 w-4 text-slate-600" />
                退出登录
              </button>
              <button type="button" className="flex h-10 w-full items-center gap-2 rounded-md px-2.5 text-left text-xs font-bold text-slate-800 transition hover:bg-slate-50">
                <CircleHelp className="h-4 w-4 text-blue-600" />
                帮助与反馈
              </button>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <button
            type="button"
            onClick={() => setAccountMenuOpen((open) => !open)}
            aria-expanded={accountMenuOpen}
            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-2 text-left transition hover:bg-white"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm shadow-slate-200/70">
                <UserRound className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-slate-950">{currentUser.name}</span>
                <span className={cn('mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold', desktopPlanBadgeClass(currentUser.plan))}>
                  <Crown className="h-3 w-3 shrink-0" />
                  <span className="truncate">{desktopPlanLabel(currentUser.plan)}</span>
                </span>
              </span>
            </span>
            <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition', accountMenuOpen && 'rotate-180')} />
          </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function DesktopShell({
  activeView,
  currentUser,
  onChangeView,
  onLogout,
  children,
}: {
  activeView: DesktopView;
  currentUser: DesktopMockUser;
  onChangeView: (view: DesktopView) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const title = activeView === 'call' ? 'AI 通话' : activeView === 'captions' ? 'PC 字幕同声传译' : '翻译偏好';
  const [appDownloadOpen, setAppDownloadOpen] = useState(false);
  const [appDownloadExpanded, setAppDownloadExpanded] = useState(false);

  function closeAppDownload() {
    setAppDownloadOpen(false);
    setAppDownloadExpanded(false);
  }

  return (
    <div className="flex h-full min-h-0 bg-[#eef2f7]">
      <Sidebar activeView={activeView} currentUser={currentUser} onChange={onChangeView} onLogout={onLogout} />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-black text-slate-950">{title}</h1>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setAppDownloadOpen((open) => !open)}
              className="flex h-9 select-none items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              APP 下载
            </button>
            {appDownloadOpen && !appDownloadExpanded && (
              <div className="absolute right-0 top-11 z-50 w-72 rounded-lg border border-slate-200 bg-white p-4 text-center shadow-2xl shadow-slate-900/16">
                <div className="mb-2 flex items-center justify-end">
                  <button type="button" onClick={() => setAppDownloadExpanded(true)} aria-label="最大化 APP 下载" title="最大化" className="flex h-7 w-7 items-center justify-center rounded-md text-blue-700 transition hover:bg-blue-50">
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-lg border border-slate-200 bg-white p-2">
                  <img src={appDownloadQrUrl} alt="Knowly APP 下载二维码" className="h-full w-full object-contain" />
                </div>
                <p className="mt-3 text-sm font-black text-slate-950">APP 下载</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">下载Knowly手机APP，输入大会码可在手机同步观看字幕翻译</p>
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-sm font-black tracking-wider text-slate-950">{CAPTION_CONFERENCE_CODE}</p>
              </div>
            )}
          </div>
        </header>
        <div className="relative min-h-0 flex-1 overflow-hidden p-5">
          {children}
          {appDownloadOpen && appDownloadExpanded && (
            <div className="absolute inset-0 z-[80] flex items-center justify-center bg-white p-10">
              <button type="button" onClick={closeAppDownload} aria-label="关闭 APP 下载投屏" className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
              <div className="text-center">
                <div className="mx-auto flex h-[min(46vh,420px)] w-[min(46vh,420px)] items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
                  <img src={appDownloadQrUrl} alt="Knowly APP 下载二维码" className="h-full w-full object-contain" />
                </div>
                <h2 className="mt-8 text-4xl font-black text-slate-950">APP 下载</h2>
                <p className="mx-auto mt-4 max-w-2xl text-xl font-semibold leading-relaxed text-slate-600">下载Knowly手机APP，输入大会码可在手机同步观看字幕翻译</p>
                <p className="mx-auto mt-8 inline-flex rounded-2xl bg-blue-50 px-12 py-5 font-mono text-6xl font-black tracking-wider text-blue-700">{CAPTION_CONFERENCE_CODE}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function AiCallWorkspace({
  preferences,
  onOpenPreferences,
}: {
  preferences: DesktopTranslationPreferences;
  onOpenPreferences: () => void;
}) {
  const script = useMemo(() => SCENE_SCRIPTS.meeting, []);
  const [stage, setStage] = useState<DesktopCallStage>('home');
  const [draft, setDraft] = useState<DesktopCallDraft | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [endedSummary, setEndedSummary] = useState<SessionSummary | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState<'id' | 'link' | null>(null);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactIdInput, setContactIdInput] = useState('');
  const [addedContacts, setAddedContacts] = useState<typeof CONTACTS>([]);
  const [contactNameOverrides, setContactNameOverrides] = useState<Record<string, string>>({});
  const [applyGuestPreferences, setApplyGuestPreferences] = useState(true);
  const [isAllContactsOpen, setIsAllContactsOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState('');
  const [editingContactName, setEditingContactName] = useState('');
  const [pendingCallContactId, setPendingCallContactId] = useState('');
  const [historyContactId, setHistoryContactId] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState('');
  const [editingHistoryKey, setEditingHistoryKey] = useState('');
  const [historyTranslationDraft, setHistoryTranslationDraft] = useState('');
  const [historyCorrections, setHistoryCorrections] = useState<Record<string, string>>({});
  const [rememberedHistoryKey, setRememberedHistoryKey] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [lobbyJoined, setLobbyJoined] = useState(false);
  const [appQrOpen, setAppQrOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [revealedCount, setRevealedCount] = useState(1);
  const [captionMode, setCaptionMode] = useState<DesktopCaptionMode>('both');
  const [captionMenuOpen, setCaptionMenuOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const displayedContacts = useMemo(() => {
    return [...addedContacts, ...CONTACTS.filter((contact) => !addedContacts.some((item) => item.id === contact.id))]
      .map((contact) => ({ ...contact, name: contactNameOverrides[contact.id] ?? contact.name }));
  }, [addedContacts, contactNameOverrides]);

  useEffect(() => {
    if (stage !== 'lobby' || !draft) return undefined;
    setLobbyJoined(false);
    const joinTimer = window.setTimeout(() => setLobbyJoined(true), 1600);
    const startTimer = window.setTimeout(() => {
      const contact = displayedContacts.find((item) => item.id === draft.contactId);
      const remoteName = contact?.name ?? (draft.mode === 'join' ? '网页访客' : 'Budi');
      const callMode = draft.mode === 'voice' ? 'voice' : 'video';
      setActiveCall({
        id: `desktop-call-${Date.now()}`,
        mode: callMode,
        inviteCode: draft.code,
        contactId: draft.contactId,
        participants: ['我', remoteName],
        startedAt: new Date().toISOString(),
        turns: script,
      });
      setCameraOn(callMode === 'video');
      setMuted(false);
      setShowCaptions(true);
      setCaptionMode('both');
      setRevealedCount(1);
      setElapsed(0);
      setStage('room');
    }, 3300);

    return () => {
      window.clearTimeout(joinTimer);
      window.clearTimeout(startTimer);
    };
  }, [displayedContacts, draft, script, stage]);

  useEffect(() => {
    if (stage !== 'room') return undefined;
    const timer = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'room' || !activeCall) return undefined;
    if (revealedCount >= activeCall.turns.length) return undefined;
    const timer = window.setTimeout(() => {
      setRevealedCount((current) => Math.min(current + 1, activeCall.turns.length));
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [activeCall, revealedCount, stage]);

  const selectedContact = displayedContacts.find((contact) => contact.id === selectedContactId) ?? displayedContacts[0];
  const pendingCallContact = displayedContacts.find((contact) => contact.id === pendingCallContactId) ?? null;
  const historyContact = displayedContacts.find((contact) => contact.id === historyContactId) ?? null;
  const historySessions = historyContact ? (CONTACT_HISTORY[historyContact.id] ?? []) : [];
  const visibleTurns = activeCall?.turns.slice(0, Math.max(1, revealedCount)) ?? [];
  const currentTurn = visibleTurns[visibleTurns.length - 1] ?? script[0];
  const summary = useMemo(() => makeSummary(visibleTurns.length ? visibleTurns : script.slice(0, 2)), [script, visibleTurns]);
  const remoteProfile = REMOTE_PROFILES[activeCall?.contactId ?? ''] ?? REMOTE_PROFILES.default;
  const remoteName = activeCall?.participants.find((participant) => participant !== '我') ?? remoteProfile.name;
  const selectedCaptionMode = CAPTION_MODES.find((mode) => mode.id === captionMode) ?? CAPTION_MODES[0];
  const progress = activeCall ? Math.min(100, (visibleTurns.length / activeCall.turns.length) * 100) : 0;
  const preferenceSummaryText = desktopPreferenceSummary(preferences);
  const displayedPreferenceSummary = applyGuestPreferences ? preferenceSummaryText : '未使用翻译偏好';

  function copyToClipboard(value: string, type: 'id' | 'link') {
    void navigator.clipboard?.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1200);
  }

  function openLobby(mode: DesktopCallMode, contactId?: string, code = INVITE_CODE) {
    setDraft({ mode, contactId, code });
    setEndedSummary(null);
    setStage('lobby');
  }

  function joinCall() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    openLobby('join', undefined, code);
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
    } satisfies (typeof CONTACTS)[number];
    setAddedContacts((current) => [contact, ...current.filter((item) => item.id !== contact.id)]);
    setContactIdInput('');
    setIsAddContactOpen(false);
  }

  function saveContactName() {
    const nextName = editingContactName.trim();
    if (!editingContactId || !nextName) return;
    setContactNameOverrides((current) => ({ ...current, [editingContactId]: nextName }));
    setAddedContacts((current) => current.map((contact) => (contact.id === editingContactId ? { ...contact, name: nextName } : contact)));
    setEditingContactId('');
    setEditingContactName('');
  }

  function hasHistory(contact: (typeof displayedContacts)[number]) {
    return Boolean(CONTACT_HISTORY[contact.id]?.length);
  }

  function openEditContact(contact: (typeof displayedContacts)[number]) {
    setEditingContactId(contact.id);
    setEditingContactName(contact.name);
  }

  function startContactCall(contact: (typeof displayedContacts)[number], mode: 'voice' | 'video') {
    openLobby(mode, contact.id);
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

  function finishCall() {
    setEndedSummary(summary);
    setShowExitConfirm(false);
    setStage('ended');
  }

  function backToHome() {
    setStage('home');
    setDraft(null);
    setActiveCall(null);
    setEndedSummary(null);
    setLobbyJoined(false);
    setShowExitConfirm(false);
  }

  function renderContactAvatar(contact: (typeof displayedContacts)[number]) {
    return (
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-black text-blue-700">
        {contact.name.slice(0, 1).toUpperCase()}
        {contact.online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />}
      </span>
    );
  }

  function renderCaption(turn: ConversationTurn) {
    const isMe = turn.speaker === 'me';
    return (
      <article key={turn.id} className={cn('max-w-[78%]', isMe ? 'ml-auto text-right' : 'mr-auto text-left')}>
        <p className="mb-1 text-[11px] font-medium text-white/60">{isMe ? '我方' : remoteName} · {turn.sourceLanguage.toUpperCase()} → {turn.targetLanguage.toUpperCase()}</p>
        <div className={cn(
          'rounded-lg border border-white/10 px-4 py-3 shadow-lg backdrop-blur-xl',
          isMe ? 'rounded-tr-sm bg-blue-600/88' : 'rounded-tl-sm bg-black/55',
        )}
        >
          {captionMode !== 'target' && <p className="text-sm font-semibold leading-relaxed text-white">{turn.sourceText}</p>}
          {captionMode !== 'source' && <p className="mt-2 text-xs leading-relaxed text-blue-100">{turn.translatedText}</p>}
        </div>
      </article>
    );
  }

  function renderTranslationPreferenceControl(className = '') {
    return (
      <div className={cn('flex h-10 max-w-none items-center overflow-hidden rounded-lg border border-slate-200 bg-white/75 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-white', className)}>
        <button
          type="button"
          onClick={() => setApplyGuestPreferences((current) => !current)}
          aria-pressed={applyGuestPreferences}
          className="flex h-full shrink-0 items-center gap-2 border-r border-slate-200 px-3 transition hover:bg-slate-50"
        >
          <span className={cn('h-5 w-9 rounded-full p-0.5 transition', applyGuestPreferences ? 'bg-blue-500' : 'bg-slate-200')}>
            <span className={cn('block h-4 w-4 rounded-full bg-white shadow-sm transition', applyGuestPreferences && 'translate-x-4')} />
          </span>
          <span className="hidden whitespace-nowrap xl:inline">使用翻译偏好</span>
        </button>
        <button type="button" onClick={onOpenPreferences} className="flex h-full min-w-0 items-center gap-2 px-3 transition hover:bg-slate-50">
          <Settings2 className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="whitespace-nowrap">{displayedPreferenceSummary}</span>
        </button>
      </div>
    );
  }

  function renderTopCallBar() {
    return (
      <section className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/50">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[246px] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-xs font-bold text-slate-500">我的通话 ID</span>
            <span className="font-mono text-lg font-black tracking-wider text-slate-950">{INVITE_CODE}</span>
            <button type="button" onClick={() => copyToClipboard(INVITE_CODE, 'id')} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-white hover:text-slate-950" aria-label="复制通话 ID">
              {copied === 'id' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => openLobby('voice')} className="flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.98]">
              <Phone className="h-4 w-4" />
              语音通话
            </button>
            <button type="button" onClick={() => openLobby('video')} className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-50 active:scale-[0.98]">
              <Video className="h-4 w-4" />
              视频通话
            </button>
          </div>

          <div className="flex min-w-[250px] flex-1 items-center gap-2">
            <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="输入通话 ID" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm font-bold tracking-wider text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
            <button type="button" disabled={!joinCode.trim()} onClick={joinCall} className="flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-300">
              加入
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {renderTranslationPreferenceControl('ml-auto shrink-0 bg-slate-50')}
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
          <p className="text-slate-500">复制通话 ID 发给对方，对方可通过 Knowly App 或网页端加入。</p>
          <button type="button" className="shrink-0 rounded-md bg-blue-50 px-2.5 py-1 font-bold text-blue-700 transition hover:bg-blue-100">
            企业多人通话请联系销售
          </button>
        </div>
      </section>
    );
  }

  function renderContactsPanel() {
    return (
      <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-4">
          <div>
            <h2 className="text-sm font-black text-slate-950">联系人与最近通话</h2>
            <p className="mt-0.5 text-xs text-slate-500">选择联系人，在右侧查看或发起通话。</p>
          </div>
          <button type="button" onClick={() => setIsAddContactOpen((open) => !open)} className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-blue-600 transition hover:bg-blue-50">
            <UserPlus className="h-4 w-4" />
            添加
          </button>
        </div>

        {isAddContactOpen && (
          <div className="border-b border-blue-100 bg-blue-50 p-3">
            <label className="block text-xs font-bold text-blue-700">对方 ID</label>
            <div className="mt-2 flex gap-2">
              <input value={contactIdInput} onChange={(event) => setContactIdInput(event.target.value.toUpperCase())} placeholder="KLY-5208" className="h-10 min-w-0 flex-1 rounded-lg border border-blue-100 bg-white px-3 font-mono text-sm font-bold outline-none focus:border-blue-300" />
              <button type="button" onClick={autoAddContact} disabled={!contactIdInput.trim()} className="h-10 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white disabled:bg-blue-300">添加</button>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-[minmax(150px,1fr)_58px_66px_104px] border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-black text-slate-500">
            <span>联系人</span>
            <span>来源</span>
            <span>最近</span>
            <span className="text-right">操作</span>
          </div>
          {displayedContacts.map((contact) => {
            const active = selectedContact?.id === contact.id;
            const appContact = contact.source !== 'web';
            return (
              <div
                key={contact.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedContactId(contact.id)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedContactId(contact.id); } }}
                className={cn(
                  'grid w-full cursor-pointer grid-cols-[minmax(150px,1fr)_58px_66px_104px] items-center gap-2 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-100',
                  active && 'bg-blue-50/70',
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  {renderContactAvatar(contact)}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-slate-950">{contact.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{contact.contactCode || '网页通话'}</span>
                  </span>
                </span>
                <span className={cn('inline-flex h-7 w-fit items-center rounded-full px-2 text-[11px] font-bold', appContact ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                  {appContact ? 'App' : '网页'}
                </span>
                <span className="truncate text-xs font-semibold text-slate-500">{contact.lastCall}</span>
                <span className="flex justify-end gap-1">
                  {hasHistory(contact) && (
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); openContactHistory(contact); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm transition hover:bg-blue-50 hover:text-blue-600"
                      aria-label={`${contact.name} 的通话历史`}
                    >
                      <History className="h-4 w-4" />
                    </button>
                  )}
                  {appContact && (
                    <>
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); openEditContact(contact); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm transition hover:bg-blue-50 hover:text-blue-600"
                        aria-label={`编辑 ${contact.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); setPendingCallContactId(contact.id); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm transition hover:bg-blue-50 hover:text-blue-600"
                        aria-label={`呼叫 ${contact.name}`}
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  function renderEmptySessionPanel() {
    return (
      <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <div>
            <h2 className="text-sm font-black text-slate-950">当前会话</h2>
            <p className="mt-0.5 text-xs text-slate-500">选择联系人或输入 ID 发起通话</p>
          </div>
          <StatusPill running={false} paused={false} />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_280px] gap-5 p-5">
          <div className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div>
              <p className="text-xs font-black text-slate-500">已选联系人</p>
              {selectedContact ? (
                <div className="mt-4 flex items-start gap-4">
                  {renderContactAvatar(selectedContact)}
                  <div className="min-w-0">
                    <h3 className="truncate text-2xl font-black text-slate-950">{selectedContact.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{getContactMeta(selectedContact)}</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500">
                      {selectedContact.source === 'web' ? '这是网页端访客记录，建议复制通话 ID 或链接邀请对方重新加入。' : '可直接发起语音通话，或从顶部切换为视频通话。'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-12 text-center">
                  <Phone className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-lg font-black text-slate-950">选择联系人或输入 ID 发起通话</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {selectedContact?.source !== 'web' && (
                <button type="button" onClick={() => setPendingCallContactId(selectedContact.id)} className="flex h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.98]">
                  <Phone className="h-4 w-4" />
                  呼叫联系人
                </button>
              )}
              {selectedContact && hasHistory(selectedContact) && (
                <button type="button" onClick={() => openContactHistory(selectedContact)} className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50">
                  <History className="h-4 w-4" />
                  通话历史
                </button>
              )}
              <button type="button" onClick={() => copyToClipboard(INVITE_CODE, 'id')} className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50">
                {copied === 'id' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                复制通话 ID
              </button>
            </div>
          </div>

          <aside className="flex min-h-0 flex-col gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-950">通话准备</h3>
              </div>
              <div className="space-y-3 text-xs font-semibold text-slate-600">
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> 双语字幕将在通话中自动生成</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {preferences.autoGenerateSummary ? '结束后生成纪要' : '结束后可手动整理纪要'}</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> 当前仅支持双人通话</p>
              </div>
            </div>
            {endedSummary && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-black text-amber-950">最近纪要</p>
                <p className="mt-2 text-xs leading-relaxed text-amber-800">{endedSummary.title}</p>
              </div>
            )}
          </aside>
        </div>
      </section>
    );
  }

  function renderEditContactDialog() {
    if (!editingContactId) return null;
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-6">
        <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-950">编辑联系人</h3>
            <button type="button" onClick={() => setEditingContactId('')} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="关闭">
              <X className="h-4 w-4" />
            </button>
          </div>
          <input value={editingContactName} onChange={(event) => setEditingContactName(event.target.value)} className="mt-4 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
          <button type="button" onClick={saveContactName} className="mt-3 h-11 w-full rounded-lg bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800">保存</button>
        </div>
      </div>
    );
  }

  function renderPendingCallDialog() {
    if (!pendingCallContact) return null;
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-6">
        <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-950">发起通话</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">要与 {pendingCallContact.name} 通话吗？请选择语音通话或视频通话。</p>
            </div>
            <button type="button" onClick={() => setPendingCallContactId('')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100" aria-label="关闭">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => startContactCall(pendingCallContact, 'voice')} className="flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-bold text-white transition hover:bg-slate-800">
              <Phone className="h-4 w-4" />
              语音通话
            </button>
            <button type="button" onClick={() => startContactCall(pendingCallContact, 'video')} className="flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50">
              <Video className="h-4 w-4" />
              视频通话
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderHistoryDialog() {
    if (!historyContact) return null;
    return (
      <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/40 p-6">
        <div className="flex max-h-[min(88vh,760px)] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 p-5">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-black text-slate-950">{historyContact.name} 的通话历史</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">纪要、原文与译文记录</p>
            </div>
            <button type="button" onClick={closeContactHistory} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200" aria-label="关闭">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5">
            {historySessions.length > 0 ? (
              <div className="space-y-3">
                {historySessions.map((session) => {
                  const isOpen = expandedHistoryId === session.id;
                  return (
                    <article key={session.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <button
                        type="button"
                        onClick={() => setExpandedHistoryId((current) => current === session.id ? '' : session.id)}
                        aria-expanded={isOpen}
                        className="w-full px-4 py-3 text-left transition hover:bg-slate-50"
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block text-sm font-black text-slate-950">{session.title}</span>
                            <span className="mt-1 block text-xs font-semibold text-slate-500">{session.time} · {session.transcript.length} 条原文记录</span>
                          </span>
                          <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
                        </span>
                        <span className="mt-3 block text-sm leading-6 text-slate-600">{session.summary}</span>
                      </button>

                      {isOpen && (
                        <div className="space-y-3 border-t border-slate-100 bg-slate-50 p-3">
                          <section className="rounded-lg bg-white p-3">
                            <h4 className="text-xs font-bold text-slate-500">纪要</h4>
                            <p className="mt-2 text-sm leading-6 text-slate-800">{session.summary}</p>
                          </section>

                          {session.transcript.map((turn, index) => {
                            const key = historyTurnKey(session.id, index);
                            const translatedText = historyCorrections[key] ?? turn.translated;
                            const isEditing = editingHistoryKey === key;

                            return (
                              <section key={key} className="rounded-lg bg-white p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="min-w-0 truncate text-xs font-bold text-slate-500">{turn.speaker}</p>
                                  <p className="shrink-0 text-[11px] font-semibold text-slate-400">#{index + 1}</p>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-800">原文：{turn.source}</p>

                                {isEditing ? (
                                  <div className="mt-2 space-y-2 rounded-lg bg-blue-50 p-2">
                                    <textarea
                                      value={historyTranslationDraft}
                                      onChange={(event) => setHistoryTranslationDraft(event.target.value)}
                                      className="min-h-24 w-full resize-none rounded-lg border border-blue-100 bg-white p-3 text-sm leading-6 text-blue-900 outline-none focus:ring-2 focus:ring-blue-200"
                                      autoFocus
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button type="button" onClick={cancelHistoryCorrection} className="h-9 rounded-lg px-3 text-xs font-bold text-slate-500 transition hover:bg-white">
                                        取消
                                      </button>
                                      <button type="button" onClick={() => saveHistoryCorrection(session.id, index)} className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white transition hover:bg-blue-700">
                                        保存订正
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-2 rounded-lg bg-blue-50 p-3 text-sm leading-6 text-blue-800">
                                    <p>译文：{translatedText}</p>
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                      <p className="text-[11px] font-bold text-emerald-600">{rememberedHistoryKey === key ? '已写入记忆' : ''}</p>
                                      <button type="button" onClick={() => startHistoryCorrection(session.id, index, translatedText)} className="h-8 rounded-lg px-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100">
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
                })}
              </div>
            ) : (
              <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-500">
                暂无通话历史，发起通话后会在这里沉淀纪要、原文和译文记录。
              </section>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderCompactContactRow(contact: (typeof displayedContacts)[number], showLastCall = true) {
    return (
      <div key={contact.id} className="flex items-center justify-between gap-5">
        <button
          type="button"
          onClick={() => {
            setSelectedContactId(contact.id);
            if (isAllContactsOpen) setIsAllContactsOpen(false);
          }}
          className="flex min-w-0 items-center gap-4 text-left"
        >
          {renderContactAvatar(contact)}
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-base font-black text-slate-950">{contact.name}</span>
              {contact.source !== 'web' && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => { event.preventDefault(); event.stopPropagation(); openEditContact(contact); }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      openEditContact(contact);
                    }
                  }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                  aria-label={`编辑 ${contact.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate font-mono text-sm font-semibold text-slate-500">{contact.contactCode || '网页通话'}</span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1.5">
          {showLastCall && <span className="mr-2 text-sm font-semibold text-slate-500">{contact.lastCall}</span>}
          {hasHistory(contact) && (
            <button type="button" onClick={() => openContactHistory(contact)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600" aria-label={`${contact.name} 的通话历史`}>
              <History className="h-4 w-4" />
            </button>
          )}
          {contact.source !== 'web' && (
            <button type="button" onClick={() => setPendingCallContactId(contact.id)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600" aria-label={`呼叫 ${contact.name}`}>
              <Phone className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderAllContactsDialog() {
    if (!isAllContactsOpen) return null;
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-6">
        <div className="flex max-h-[min(82vh,680px)] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 p-5">
            <div>
              <h3 className="text-lg font-black text-slate-950">全部联系人</h3>
              <p className="mt-1 text-sm text-slate-500">选择联系人、查看历史或发起通话。</p>
            </div>
            <button type="button" onClick={() => setIsAllContactsOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200" aria-label="关闭">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <div className="space-y-5">
              {displayedContacts.map((contact) => renderCompactContactRow(contact, true))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderWorkspacePanel(sessionPanel: ReactNode) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        {renderTopCallBar()}
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(420px,0.46fr)_minmax(0,1fr)] gap-4">
          {renderContactsPanel()}
          {sessionPanel}
        </div>
        {renderEditContactDialog()}
        {renderPendingCallDialog()}
        {renderHistoryDialog()}
        {renderAllContactsDialog()}
      </div>
    );
  }

  function renderHomePanel() {
    return (
      <div className="flex h-full min-h-0 overflow-y-auto px-6 py-6">
        <div className="flex min-h-full w-full">
        <div className="m-auto w-full max-w-[1160px] py-2">
          <section className="rounded-lg border border-slate-200 bg-white px-[clamp(1.5rem,3vw,2.5rem)] py-[clamp(1.5rem,3vh,2.5rem)] shadow-lg shadow-blue-100/45">
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-blue-50/50 px-5 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-sm font-bold text-slate-600">我的通话 ID</span>
                <span className="font-mono text-2xl font-black tracking-wider text-slate-950">{INVITE_CODE}</span>
                <button type="button" onClick={() => copyToClipboard(INVITE_CODE, 'id')} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-white hover:text-slate-950" aria-label="复制通话 ID">
                  {copied === 'id' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {renderTranslationPreferenceControl('shrink-0')}
            </div>

            <div className="mt-[clamp(1.75rem,5vh,3.5rem)] flex flex-wrap items-center justify-center gap-[clamp(1rem,2.2vw,2rem)]">
              <button type="button" onClick={() => openLobby('voice')} className="flex h-14 min-w-48 items-center justify-center gap-3 rounded-lg bg-slate-950 px-7 text-base font-bold text-white transition hover:bg-slate-800 active:scale-[0.98] xl:h-16 xl:min-w-52 xl:px-8 xl:text-lg">
                <Phone className="h-6 w-6" />
                语音通话
              </button>
              <button type="button" onClick={() => openLobby('video')} className="flex h-14 min-w-48 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-7 text-base font-bold text-slate-900 transition hover:bg-slate-50 active:scale-[0.98] xl:h-16 xl:min-w-52 xl:px-8 xl:text-lg">
                <Video className="h-6 w-6" />
                视频通话
              </button>
              <div className="flex h-14 min-w-[320px] flex-1 overflow-hidden rounded-lg border border-slate-200 bg-blue-50/50 xl:h-16 xl:min-w-[370px]">
                <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="输入通话 ID" className="h-full min-w-0 flex-1 bg-transparent px-5 font-mono text-base font-bold tracking-wider text-slate-900 outline-none placeholder:text-slate-400" />
                <button type="button" disabled={!joinCode.trim()} onClick={joinCall} className="flex h-full w-32 items-center justify-center gap-2 bg-blue-600 text-base font-bold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-300">
                  加入
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="my-[clamp(1.75rem,4vh,2.5rem)] border-t border-slate-200" />

            <div className="grid grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] gap-[clamp(1.5rem,3vw,2.5rem)]">
              <section className="min-w-0">
                <div className="mb-[clamp(1rem,2.5vh,1.75rem)] flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-950">联系人与最近通话</h2>
                    <button type="button" onClick={() => setIsAllContactsOpen(true)} className="mt-1 text-xs font-bold text-blue-600 transition hover:text-blue-700">
                      全部联系人
                    </button>
                  </div>
                  <button type="button" onClick={() => setIsAddContactOpen((open) => !open)} className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-blue-600 transition hover:bg-blue-50">
                    <UserPlus className="h-4 w-4" />
                    添加
                  </button>
                </div>

                {isAddContactOpen && (
                  <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <label className="block text-xs font-bold text-blue-700">对方 ID</label>
                    <div className="mt-2 flex gap-2">
                      <input value={contactIdInput} onChange={(event) => setContactIdInput(event.target.value.toUpperCase())} placeholder="KLY-5208" className="h-10 min-w-0 flex-1 rounded-lg border border-blue-100 bg-white px-3 font-mono text-sm font-bold outline-none focus:border-blue-300" />
                      <button type="button" onClick={autoAddContact} disabled={!contactIdInput.trim()} className="h-10 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white disabled:bg-blue-300">添加</button>
                    </div>
                  </div>
                )}

                <div className="space-y-[clamp(1rem,2.4vh,1.75rem)]">
                  {displayedContacts.slice(0, 2).map((contact) => renderCompactContactRow(contact, true))}
                </div>
              </section>

              <aside className="self-center rounded-lg border border-slate-200 bg-blue-50/55 p-[clamp(1.25rem,2.6vw,2rem)]">
                <div className="mb-[clamp(1.25rem,3vh,2rem)] flex items-center gap-4">
                  <Languages className="h-8 w-8 text-blue-600" />
                  <h3 className="text-xl font-black text-slate-950 xl:text-2xl">AI 辅助已就绪</h3>
                </div>
                <div className="space-y-[clamp(1rem,2.5vh,1.5rem)] text-sm font-semibold text-slate-700">
                  <p className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> 双语字幕将在通话中自动生成</p>
                  <p className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> {preferences.autoGenerateSummary ? '结束后生成纪要' : '结束后可手动整理纪要'}</p>
                  <p className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> 当前仅支持双人通话</p>
                </div>
              </aside>
            </div>
          </section>

          <div className="mt-7 flex items-center justify-between gap-4 text-sm">
            <p className="text-slate-500">复制通话 ID 发给对方，对方可通过 Knowly App 或网页端加入。</p>
            <button type="button" className="shrink-0 font-bold text-blue-600 transition hover:text-blue-700">
              企业多人通话请联系销售
            </button>
          </div>

          {renderEditContactDialog()}
          {renderPendingCallDialog()}
          {renderHistoryDialog()}
          {renderAllContactsDialog()}
        </div>
        </div>
      </div>
    );
  }

  function renderLobbyPanel() {
    const code = draft?.code ?? INVITE_CODE;
    const contact = displayedContacts.find((item) => item.id === draft?.contactId);
    const title = contact ? `呼叫 ${contact.name}` : draft?.mode === 'join' ? '加入通话' : draft?.mode === 'voice' ? '发起语音通话' : '发起视频通话';
    const meetingLink = `https://knowly.app/meet/${code}`;
    return (
      <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_360px] gap-5">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-5">
            <button type="button" onClick={backToHome} className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4" />
              返回
            </button>
            <StatusPill running={lobbyJoined} paused={false} />
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_300px] gap-5 p-5">
            <div className="flex min-h-0 flex-col justify-center rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                {draft?.mode === 'voice' ? <Phone className="h-9 w-9" /> : <Video className="h-9 w-9" />}
              </div>
              <h2 className="mt-5 text-2xl font-black text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">将会议 ID 或会议链接发给对方，对方可下载 Knowly App，或直接通过网页端加入。</p>
              <p className="mt-5 font-mono text-5xl font-black tracking-wider text-slate-950">{code}</p>
              <div className="mx-auto mt-5 grid w-full max-w-md grid-cols-2 gap-3">
                <button type="button" onClick={() => copyToClipboard(code, 'id')} className="flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-900 transition hover:bg-slate-50">
                  {copied === 'id' ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  复制 ID
                </button>
                <button type="button" onClick={() => copyToClipboard(meetingLink, 'link')} className="flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800">
                  {copied === 'link' ? <Check className="h-4 w-4 text-emerald-300" /> : <Link2 className="h-4 w-4" />}
                  复制链接
                </button>
              </div>
            </div>

            <aside className="flex min-h-0 flex-col gap-4">
              <button type="button" onClick={() => setAppQrOpen(true)} className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/50">
                <Smartphone className="h-6 w-6 text-blue-600" />
                <p className="mt-3 text-sm font-black text-slate-950">下载 APP</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">点击查看二维码，下载后输入会议 ID。</p>
              </button>
              <button type="button" onClick={() => copyToClipboard(meetingLink, 'link')} className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50">
                <Globe2 className="h-6 w-6 text-emerald-600" />
                <p className="mt-3 text-sm font-black text-slate-950">网页端加入</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{copied === 'link' ? '网页链接已复制。' : '点击复制网页会议链接。'}</p>
              </button>
            </aside>
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', lobbyJoined ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
              {lobbyJoined ? <Check className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
            <div>
              <p className="text-sm font-black text-slate-950">{lobbyJoined ? '对方已加入' : '等待对方加入会议'}</p>
              <p className="mt-0.5 text-xs text-slate-500">{lobbyJoined ? '即将自动开始通话' : '复制会议 ID 或链接发送给对方'}</p>
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className={cn('h-full rounded-full bg-blue-600 transition-all duration-700', lobbyJoined ? 'w-full' : 'w-2/5')} />
          </div>
          <p className="mt-5 text-xs leading-relaxed text-slate-500">对方加入后会先展示提醒，再自动进入通话。</p>
        </aside>

        {appQrOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-6">
            <div className="w-full max-w-sm rounded-lg bg-white p-5 text-center shadow-2xl">
              <button type="button" onClick={() => setAppQrOpen(false)} className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100" aria-label="关闭">
                <X className="h-4 w-4" />
              </button>
              <img src={appDownloadQrUrl} alt="Knowly APP 下载二维码" className="mx-auto h-44 w-44 rounded-lg border border-slate-200 object-contain p-2" />
              <h3 className="mt-4 text-lg font-black text-slate-950">扫码下载 Knowly APP</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">下载后输入会议 ID {code}，即可加入本次会议。</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderRoomPanel() {
    if (!activeCall) return null;
    return (
      <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_340px] gap-5">
        <section className="relative min-h-0 overflow-hidden rounded-lg bg-black text-white">
          <img src={remoteProfile.image} alt={`${remoteName} 的视频画面`} className={cn('absolute inset-0 h-full w-full object-cover transition', cameraOn ? 'opacity-100' : 'opacity-35 grayscale')} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/18 to-black/90" />

          <header className="absolute left-0 right-0 top-0 z-30 flex items-start justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setShowExitConfirm(true)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-black/35 text-white backdrop-blur-md transition hover:bg-white/15" aria-label="结束通话">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="rounded-lg border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <p className="text-sm font-black">{remoteName}</p>
                </div>
                <p className="mt-0.5 text-xs text-white/65">{remoteProfile.role} · {remoteProfile.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-white/10 bg-black/35 px-3 py-2 font-mono text-xs font-bold backdrop-blur-md">{formatDuration(elapsed)}</span>
              <div className="relative">
                <button type="button" onClick={() => setCaptionMenuOpen((open) => !open)} className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-black/35 px-3 text-xs font-bold backdrop-blur-md transition hover:bg-white/15">
                  <Languages className="h-3.5 w-3.5" />
                  {selectedCaptionMode.label}
                  <ChevronDown className={cn('h-3.5 w-3.5 transition', captionMenuOpen && 'rotate-180')} />
                </button>
                {captionMenuOpen && (
                  <div className="absolute right-0 top-11 z-40 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-2xl">
                    {CAPTION_MODES.map((mode) => (
                      <button key={mode.id} type="button" onClick={() => { setCaptionMode(mode.id); setCaptionMenuOpen(false); }} className="flex h-10 w-full items-center justify-between px-3 text-left text-xs font-bold transition hover:bg-slate-50">
                        {mode.label}
                        {captionMode === mode.id && <Check className="h-3.5 w-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          <aside className="absolute left-5 top-24 z-20 w-80 rounded-lg border border-white/10 bg-black/45 p-4 backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-black text-blue-100">AI 同传助理</p>
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200">{visibleTurns.length}/{activeCall.turns.length}</span>
            </div>
            <p className="line-clamp-2 text-xs leading-relaxed text-white/75">{currentTurn?.suggestedAction ?? '持续识别双方发言，并整理通话纪要。'}</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${progress}%` }} /></div>
          </aside>

          <div className="absolute right-5 top-24 z-20 h-36 w-24 overflow-hidden rounded-lg border-2 border-white/20 bg-slate-950 shadow-2xl">
            {cameraOn ? (
              <div className="flex h-full flex-col justify-between bg-gradient-to-br from-slate-700 via-slate-900 to-blue-950 p-2">
                <Wifi className="ml-auto h-3.5 w-3.5 text-emerald-300" />
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-lg font-black">我</div>
                <div className="flex h-5 items-end justify-center gap-1">{[0, 1, 2, 3].map((bar) => <span key={bar} className="knowly-audio-bar w-1 rounded-full bg-emerald-300" style={{ animationDelay: `${bar * 120}ms` }} />)}</div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-950 px-2 text-center">
                <VideoOff className="h-6 w-6 text-white/65" />
                <span className="text-[10px] font-bold text-white/70">摄像头已关闭</span>
              </div>
            )}
          </div>

          {showCaptions && (
            <section className="knowly-caption-mask absolute bottom-24 left-0 right-0 z-20 flex max-h-72 flex-col justify-end gap-3 overflow-hidden px-8 pb-3">
              {visibleTurns.slice(-4).map(renderCaption)}
            </section>
          )}

          <footer className="absolute bottom-0 left-0 right-0 z-30 flex justify-center px-5 pb-5 pt-6">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/45 p-2 shadow-2xl backdrop-blur-xl">
              <button type="button" onClick={() => setMuted((current) => !current)} className={cn('flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95', muted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/18')} aria-label={muted ? '打开麦克风' : '关闭麦克风'}>
                {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <button type="button" onClick={() => setShowCaptions((current) => !current)} className={cn('flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95', showCaptions ? 'bg-white/10 text-white hover:bg-white/18' : 'bg-slate-700 text-white/65')} aria-label={showCaptions ? '隐藏字幕' : '显示字幕'}>
                <Captions className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => setShowExitConfirm(true)} className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-950/45 transition hover:bg-red-400 active:scale-95" aria-label="结束通话">
                <PhoneOff className="h-6 w-6" />
              </button>
              <button type="button" onClick={() => setCameraOn((current) => !current)} className={cn('flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95', cameraOn ? 'bg-white/10 text-white hover:bg-white/18' : 'bg-slate-700 text-white/65')} aria-label={cameraOn ? '关闭摄像头' : '打开摄像头'}>
                {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>
            </div>
          </footer>
        </section>

        <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto pr-1">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              <h2 className="text-sm font-black text-slate-950">AI 纪要</h2>
            </div>
            <p className="text-base font-black text-slate-950">{summary.title}</p>
            <div className="mt-4 space-y-3">
              {summary.minutes.slice(0, 3).map((item) => (
                <div key={item} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

        </aside>

        {showExitConfirm && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/65 p-6 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg bg-white p-5 text-slate-950 shadow-2xl">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <PhoneOff className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black">结束本次通话？</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">系统会保存已生成的双语字幕，并整理为本地会议纪要。</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowExitConfirm(false)} className="h-11 flex-1 rounded-lg bg-slate-100 text-sm font-bold text-slate-800 transition hover:bg-slate-200">继续通话</button>
                <button type="button" onClick={finishCall} className="h-11 flex-1 rounded-lg bg-red-600 text-sm font-bold text-white transition hover:bg-red-700">结束并生成纪要</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderEndedPanel() {
    const finalSummary = endedSummary ?? summary;
    return (
      <div className="h-full min-h-0">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex h-14 items-center justify-between border-b border-slate-100 px-5">
            <h2 className="text-sm font-black text-slate-950">通话已结束</h2>
            <button type="button" onClick={backToHome} className="h-9 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white transition hover:bg-slate-800">返回通话首页</button>
          </div>
          <div className="p-5">
            <h3 className="text-2xl font-black text-slate-950">{finalSummary.title}</h3>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">字幕句数</p><p className="mt-1 text-2xl font-black text-slate-950">{visibleTurns.length}</p></div>
              <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">通话时长</p><p className="mt-1 text-2xl font-black text-slate-950">{formatDuration(elapsed)}</p></div>
            </div>
            <div className="mt-5 space-y-3">
              {finalSummary.minutes.map((minute) => <p key={minute} className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-semibold leading-relaxed text-slate-700">{minute}</p>)}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (stage === 'lobby') return renderWorkspacePanel(renderLobbyPanel());
  if (stage === 'room') return renderWorkspacePanel(renderRoomPanel());
  if (stage === 'ended') return renderWorkspacePanel(renderEndedPanel());

  return renderHomePanel();
}

function CaptionLineRow({ line, active }: { line: DesktopCaptionLine; active: boolean }) {
  const translations = line.translations?.length
    ? line.translations
    : line.translatedText
      ? [{ label: desktopTargetLanguageLabel(line.targetLanguage), translatedText: line.translatedText }]
      : [];

  return (
    <article className={cn(
      'rounded-lg border bg-white p-4 shadow-sm shadow-slate-200/50 transition',
      active ? 'border-blue-200 ring-2 ring-blue-100' : 'border-slate-200',
    )}
    >
      <div className="mb-2">
        <span className="inline-flex h-7 items-center rounded-full bg-slate-100 px-2.5 text-xs font-bold text-slate-700">{line.startedAt}</span>
      </div>
      {translations.length > 0 ? (
        <div className="space-y-2">
          {translations.map((translation, index) => (
            <div
              key={`${line.id}-${translation.label}-${index}`}
              className={cn(
                'rounded-lg border px-3 py-2',
                index === 0 ? 'border-blue-100 bg-blue-50' : 'border-emerald-100 bg-emerald-50/45',
              )}
            >
              <p className={cn('mb-1 text-[11px] font-black', index === 0 ? 'text-blue-600' : 'text-emerald-700')}>
                {captionTranslationTrackLabel(translation.label, index, translations.length)}
              </p>
              <p className={cn('leading-relaxed text-slate-950', index === 0 ? 'text-sm font-semibold' : 'text-xs font-semibold')}>{translation.translatedText}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm font-semibold leading-relaxed text-slate-500">未生成译文</p>
      )}
      <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
        <p className="mb-1 text-[11px] font-black text-slate-400">原文 · {captionSourceLanguageLabel(line.sourceLanguage)}</p>
        <p className="text-xs leading-relaxed text-slate-500">{line.originalText}</p>
      </div>
    </article>
  );
}

function LiveCaptionWorkspace({
  lines,
  streamState,
  overlaySettings,
  preferences,
  captionSessions,
  planLimitNotice,
  onStart,
  onPause,
  onResume,
  onStop,
  onDismissPlanLimit,
  onShowOverlay,
  onHideOverlay,
  onUpdateOverlaySettings,
  onUpdateCaptionSession,
  onOpenPreferences,
}: {
  lines: DesktopCaptionLine[];
  streamState: CaptionStreamState;
  overlaySettings: CaptionOverlaySettings;
  preferences: DesktopTranslationPreferences;
  captionSessions: DesktopCaptionSession[];
  planLimitNotice: boolean;
  onStart: (options: StartCaptionStreamOptions) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDismissPlanLimit: () => void;
  onShowOverlay: () => void;
  onHideOverlay: () => void;
  onUpdateOverlaySettings: (settings: Partial<CaptionOverlaySettings>) => void;
  onUpdateCaptionSession: (session: DesktopCaptionSession) => void;
  onOpenPreferences: () => void;
}) {
  const [sourceDevice, setSourceDevice] = useState(streamState.sourceDevice);
  const [sourceLanguage, setSourceLanguage] = useState<DesktopSourceLanguage>(preferences.sourceLanguage);
  const [targetLanguages, setTargetLanguages] = useState<DesktopTargetLanguage[]>(() => normalizeDesktopTargetLanguages(preferences.targetLanguages, preferences.targetLanguage));
  const [useTranslationPreferences, setUseTranslationPreferences] = useState(true);
  const [referenceFile, setReferenceFile] = useState<ReferenceFileState | null>(null);
  const [referenceFileError, setReferenceFileError] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [allCaptionSessionsOpen, setAllCaptionSessionsOpen] = useState(false);
  const [editingCaptionLineId, setEditingCaptionLineId] = useState('');
  const [captionTranslationDraft, setCaptionTranslationDraft] = useState('');
  const [rememberedCaptionLineId, setRememberedCaptionLineId] = useState('');
  const activeLine = lines[lines.length - 1];
  const safeCaptionSessions = captionSessions ?? [];
  const selectedSession = safeCaptionSessions.find((session) => session.id === selectedSessionId) ?? null;
  const sessionPreferenceSummary = useTranslationPreferences
    ? desktopCaptionSessionSummary(preferences, sourceLanguage, targetLanguages)
    : desktopCaptionTemporarySummary(sourceLanguage, targetLanguages);

  useEffect(() => {
    if (streamState.running || !useTranslationPreferences) return;
    setSourceLanguage(preferences.sourceLanguage);
    setTargetLanguages(normalizeDesktopTargetLanguages(preferences.targetLanguages, preferences.targetLanguage));
  }, [preferences.sourceLanguage, preferences.targetLanguage, preferences.targetLanguages, streamState.running, useTranslationPreferences]);

  function toggleUseTranslationPreferences() {
    const next = !useTranslationPreferences;
    setUseTranslationPreferences(next);
    if (next && !streamState.running) {
      setSourceLanguage(preferences.sourceLanguage);
      setTargetLanguages(normalizeDesktopTargetLanguages(preferences.targetLanguages, preferences.targetLanguage));
    }
  }

  function updateSourceLanguage(value: DesktopSourceLanguage) {
    setSourceLanguage(value);
    setUseTranslationPreferences(false);
  }

  function updateTargetLanguage(index: number, value: DesktopTargetLanguage) {
    setTargetLanguages((current) => {
      const next = normalizeDesktopTargetLanguages(current, preferences.targetLanguage);
      next[index] = value;
      return next.slice(0, 3);
    });
    setUseTranslationPreferences(false);
  }

  function addTargetLanguage() {
    setTargetLanguages((current) => {
      if (current.length >= 3) return current;
      const used = new Set(current);
      const nextLanguage = TARGET_LANGUAGES.find((item) => item.value !== 'none' && !used.has(item.value))?.value ?? 'none';
      return [...current, nextLanguage].slice(0, 3);
    });
    setUseTranslationPreferences(false);
  }

  function removeTargetLanguage(index: number) {
    if (index === 0) return;
    setTargetLanguages((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return normalizeDesktopTargetLanguages(next, preferences.targetLanguage);
    });
    setUseTranslationPreferences(false);
  }

  function handleReferenceFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!REFERENCE_FILE_EXTENSIONS.includes(extension as (typeof REFERENCE_FILE_EXTENSIONS)[number])) {
      setReferenceFileError('仅支持 txt、docx、pdf、xlsx 格式');
      return;
    }

    if (file.size > REFERENCE_FILE_LIMIT_BYTES) {
      setReferenceFileError('文件需小于 5MB');
      return;
    }

    setReferenceFile({
      name: file.name,
      size: file.size,
      extension,
      uploadedAt: new Date().toISOString(),
    });
    setReferenceFileError('');
  }

  function clearReferenceFile() {
    setReferenceFile(null);
    setReferenceFileError('');
  }

  function openCaptionSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    setEditingCaptionLineId('');
    setCaptionTranslationDraft('');
    setRememberedCaptionLineId('');
  }

  function closeCaptionSession() {
    setSelectedSessionId('');
    setEditingCaptionLineId('');
    setCaptionTranslationDraft('');
    setRememberedCaptionLineId('');
  }

  function startCaptionCorrection(line: DesktopCaptionLine) {
    setEditingCaptionLineId(line.id);
    setCaptionTranslationDraft(primaryCaptionTranslationText(line));
  }

  function cancelCaptionCorrection() {
    setEditingCaptionLineId('');
    setCaptionTranslationDraft('');
  }

  function saveCaptionCorrection(session: DesktopCaptionSession, lineId: string) {
    const correctedText = captionTranslationDraft.trim();
    if (!correctedText) return;

    const nextLines = session.lines.map((line) => (
      line.id === lineId ? { ...line, translatedText: correctedText } : line
    ));
    onUpdateCaptionSession({
      ...session,
      lines: nextLines,
      turns: captionLinesToTurns(nextLines),
    });
    setEditingCaptionLineId('');
    setCaptionTranslationDraft('');
    setRememberedCaptionLineId(lineId);
    window.setTimeout(() => setRememberedCaptionLineId((current) => current === lineId ? '' : current), 1600);
  }

  function renderCaptionHistorySection() {
    const latestSession = safeCaptionSessions[0];
    const visibleSessions = latestSession && !streamState.running
      ? safeCaptionSessions.slice(1, 3)
      : safeCaptionSessions.slice(0, 3);

    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-black text-slate-950">纪要与历史</h2>
          </div>
          {safeCaptionSessions.length > 0 && (
            <button
              type="button"
              onClick={() => setAllCaptionSessionsOpen(true)}
              className="h-8 rounded-lg px-2 text-xs font-black text-blue-700 transition hover:bg-blue-50"
            >
              全部
            </button>
          )}
        </div>

        {streamState.running && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
            <p className="text-sm font-black text-slate-950">本次同传</p>
            <p className="mt-1 text-xs font-semibold text-blue-700">结束后生成纪要并保存到历史</p>
          </div>
        )}

        {!streamState.running && latestSession && (
          <button
            type="button"
            onClick={() => openCaptionSession(latestSession.id)}
            className="w-full rounded-lg border border-blue-100 bg-blue-50 p-3 text-left transition hover:bg-blue-100/70"
          >
            <span className="block text-sm font-black text-slate-950">最近纪要</span>
            <span className="mt-1 block truncate text-xs font-semibold text-blue-700">{captionSessionTitle(latestSession)}</span>
            <span className="mt-2 block text-[11px] font-semibold text-slate-500">{formatSessionTime(latestSession.endedAt)}</span>
          </button>
        )}

        <div className="mt-3 space-y-2">
          {visibleSessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => openCaptionSession(session.id)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:bg-slate-50"
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-black text-slate-900">{captionSessionTitle(session)}</span>
                <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">{formatSessionTime(session.endedAt)}</span>
              </span>
            </button>
          ))}
        </div>

        {safeCaptionSessions.length === 0 && !streamState.running && (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs font-semibold leading-5 text-slate-500">暂无历史记录</p>
        )}
      </section>
    );
  }

  function renderAllCaptionSessionsDialog() {
    if (!allCaptionSessionsOpen) return null;

    return (
      <div className="fixed inset-0 z-[74] flex items-center justify-center bg-slate-950/40 p-6">
        <div className="flex max-h-[min(86vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 p-5">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-black text-slate-950">全部历史</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">同声传译结束后保存的纪要</p>
            </div>
            <button type="button" onClick={() => setAllCaptionSessionsOpen(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200" aria-label="关闭">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 overflow-y-auto p-4">
            {safeCaptionSessions.length > 0 ? (
              <div className="space-y-2">
                {safeCaptionSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => {
                      setAllCaptionSessionsOpen(false);
                      openCaptionSession(session.id);
                    }}
                    className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-950">{captionSessionTitle(session)}</span>
                      <span className="mt-1 block truncate text-xs font-semibold text-slate-500">{session.preferenceSummary}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-xs font-bold text-slate-500">{formatSessionTime(session.endedAt)}</span>
                      <span className="mt-1 block text-[11px] font-semibold text-slate-400">{formatSessionDuration(session.startedAt, session.endedAt)}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center text-xs font-semibold leading-5 text-slate-500">暂无历史记录</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderCaptionSessionDialog() {
    if (!selectedSession) return null;

    return (
      <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/40 p-6">
        <div className="flex max-h-[min(88vh,780px)] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 p-5">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-black text-slate-950">{captionSessionTitle(selectedSession)}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {formatSessionTime(selectedSession.endedAt)} · {formatSessionDuration(selectedSession.startedAt, selectedSession.endedAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={closeCaptionSession} className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200" aria-label="关闭">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[340px_minmax(0,1fr)] bg-slate-50">
            <aside className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white p-5">
              <section>
                <h4 className="text-xs font-black text-slate-500">摘要</h4>
                <div className="mt-3 space-y-2">
                  {captionSummaryMinutes(selectedSession.summary.minutes).map((minute) => (
                    <p key={minute} className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold leading-6 text-slate-700">{minute}</p>
                  ))}
                </div>
              </section>

            </aside>

            <section className="min-h-0 overflow-y-auto p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-950">转写记录</h4>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{selectedSession.preferenceSummary}</p>
                </div>
                <span className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-500">{selectedSession.sourceDevice}</span>
              </div>

              <div className="space-y-3">
                {selectedSession.lines.map((line) => {
                  const isEditing = editingCaptionLineId === line.id;
                  const speaker = line.speakerId === 'speaker-1' ? '说话人 1' : '说话人 2';

                  return (
                    <article key={line.id} className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-xs font-black text-slate-500">{speaker}</p>
                        <p className="shrink-0 font-mono text-[11px] font-semibold text-slate-400">{line.startedAt}</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-700">{line.originalText}</p>

                      {isEditing ? (
                        <div className="mt-3 space-y-2 rounded-lg bg-blue-50 p-2">
                          <textarea
                            value={captionTranslationDraft}
                            onChange={(event) => setCaptionTranslationDraft(event.target.value)}
                            className="min-h-24 w-full resize-none rounded-lg border border-blue-100 bg-white p-3 text-sm leading-6 text-blue-900 outline-none focus:ring-2 focus:ring-blue-200"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={cancelCaptionCorrection} className="h-9 rounded-lg px-3 text-xs font-bold text-slate-500 transition hover:bg-white">
                              取消
                            </button>
                            <button type="button" onClick={() => saveCaptionCorrection(selectedSession, line.id)} className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white transition hover:bg-blue-700">
                              保存订正
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2 rounded-lg bg-blue-50 p-3">
                          {(line.translations?.length ? line.translations : line.translatedText ? [{ label: desktopTargetLanguageLabel(line.targetLanguage), translatedText: line.translatedText }] : []).map((translation, index) => (
                            <div key={`${line.id}-history-${translation.label}-${index}`} className={cn(index > 0 && 'border-t border-blue-100 pt-2')}>
                              <p className="mb-1 text-[11px] font-black text-blue-500">
                                {captionTranslationTrackLabel(translation.label, index, line.translations?.length ?? 1)}
                              </p>
                              <p className="text-sm font-semibold leading-6 text-blue-800">{translation.translatedText}</p>
                            </div>
                          ))}
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p className="text-[11px] font-bold text-emerald-600">{rememberedCaptionLineId === line.id ? '已写入记忆' : ''}</p>
                            <button type="button" onClick={() => startCaptionCorrection(line)} className="h-8 rounded-lg px-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100">
                              订正
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_380px] gap-5">
      <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-3">
            <StatusPill running={streamState.running} paused={streamState.paused} />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <div className="flex h-10 min-w-0 max-w-[520px] items-center overflow-hidden rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:border-blue-200">
              <button
                type="button"
                onClick={toggleUseTranslationPreferences}
                aria-pressed={useTranslationPreferences}
                className="flex h-full shrink-0 items-center gap-2 border-r border-slate-200 px-3 transition hover:bg-slate-50"
              >
                <span className={cn('h-5 w-9 rounded-full p-0.5 transition', useTranslationPreferences ? 'bg-blue-500' : 'bg-slate-200')}>
                  <span className={cn('block h-4 w-4 rounded-full bg-white shadow-sm transition', useTranslationPreferences && 'translate-x-4')} />
                </span>
                <span className="whitespace-nowrap">使用翻译偏好</span>
              </button>
              <button type="button" onClick={onOpenPreferences} className="flex h-full min-w-0 items-center gap-2 px-3 transition hover:bg-slate-50">
                <Settings2 className="h-4 w-4 shrink-0" />
                <span className="truncate">{sessionPreferenceSummary}</span>
              </button>
            </div>
            {!streamState.running && (
              <button type="button" onClick={() => onStart({ sourceDevice, sourceLanguage, targetLanguage: activeDesktopTargetLanguages(targetLanguages, preferences.targetLanguage)[0] ?? 'none', targetLanguages })} className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[0.98]">
                <Play className="h-4 w-4" />
                开始
              </button>
            )}
            {streamState.running && !streamState.paused && (
              <button type="button" onClick={onPause} className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50 active:scale-[0.98]">
                <Pause className="h-4 w-4" />
                暂停
              </button>
            )}
            {streamState.running && streamState.paused && (
              <button type="button" onClick={onResume} className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.98]">
                <Play className="h-4 w-4" />
                继续
              </button>
            )}
            <IconButton label="停止字幕" onClick={onStop} disabled={!streamState.running}>
              <CircleStop className="h-4 w-4" />
            </IconButton>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-[180px_minmax(0,1fr)] gap-4 p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_260px] gap-4">
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-5 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.32),transparent_30%),radial-gradient(circle_at_75%_65%,rgba(59,130,246,0.3),transparent_33%)]" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white/80">
                    <Volume2 className="h-4 w-4" />
                    Live caption stream
                  </div>
                  <button type="button" onClick={overlaySettings.visible ? onHideOverlay : onShowOverlay} className="flex h-9 items-center gap-2 rounded-lg bg-white/12 px-3 text-xs font-bold text-white transition hover:bg-white/18 active:scale-[0.98]">
                    {overlaySettings.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {overlaySettings.visible ? '隐藏浮层' : '显示浮层'}
                  </button>
                </div>
                <div className="min-w-0">
                  {streamState.running ? (
                    <>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">大会码</p>
                      <p className="mt-1 font-mono text-4xl font-black tracking-wider text-white">{CAPTION_CONFERENCE_CODE}</p>
                      <p className="mt-2 text-sm text-white/65">手机端输入大会码，可同步观看字幕翻译</p>
                    </>
                  ) : (
                    <>
                      <p className="truncate text-2xl font-black">等待输入音频</p>
                      <p className="mt-2 truncate text-sm text-white/65">开始后会同步推送到屏幕浮层</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Radio className="h-5 w-5 text-blue-600" />
                <h2 className="text-sm font-black text-slate-950">音频输入</h2>
              </div>
              <select value={sourceDevice} onChange={(event) => setSourceDevice(event.target.value)} disabled={streamState.running} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:opacity-60">
                {AUDIO_DEVICES.map((device) => <option key={device.id} value={device.id}>{device.label}</option>)}
              </select>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{AUDIO_DEVICES.find((device) => device.id === sourceDevice)?.detail}</p>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto pr-1">
            <div className="space-y-3">
              {(lines.length ? lines : SIMULTANEOUS_CAPTIONS.map((caption, index) => makeFallbackCaptionLine(index, targetLanguages))).slice(-12).map((line, index, visibleLines) => {
                return <CaptionLineRow key={line.id} line={line} active={index === visibleLines.length - 1 && lines.length > 0} />;
              })}
            </div>
          </div>
        </div>
      </section>

      <aside className="flex min-h-0 flex-col gap-5 overflow-y-auto pr-1">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-slate-700" />
            <h2 className="text-sm font-black text-slate-950">同传设置</h2>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-500">源语言</span>
              <select value={sourceLanguage} onChange={(event) => updateSourceLanguage(event.target.value as DesktopSourceLanguage)} disabled={streamState.running} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:opacity-60">
                {SOURCE_LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <div className="space-y-2">
              {targetLanguages.map((language, index) => (
                <label key={`target-language-${index}`} className="block">
                  <span className="mb-2 block text-xs font-bold text-slate-500">目标语言{index + 1}</span>
                  <span className="flex gap-2">
                    <select value={language} onChange={(event) => updateTargetLanguage(index, event.target.value as DesktopTargetLanguage)} disabled={streamState.running} className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:opacity-60">
                      {TARGET_LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                    {index > 0 && (
                      <button type="button" onClick={() => removeTargetLanguage(index)} disabled={streamState.running} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50" aria-label={`移除目标语言${index + 1}`}>
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </span>
                </label>
              ))}

              {targetLanguages.length < 3 && (
                <button type="button" onClick={addTargetLanguage} disabled={streamState.running} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white text-sm font-bold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50">
                  <Plus className="h-4 w-4" />
                  添加目标语言
                </button>
              )}
            </div>
          </div>
        </section>

        {renderCaptionHistorySection()}

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <PanelRight className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-black text-slate-950">字幕浮层</h2>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>透明度</span>
                <span>{Math.round(overlaySettings.opacity * 100)}%</span>
              </span>
              <input type="range" min="0.55" max="1" step="0.05" value={overlaySettings.opacity} onChange={(event) => onUpdateOverlaySettings({ opacity: Number(event.target.value), visible: true })} className="w-full accent-slate-950" />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>字号</span>
                <span>{Math.round(overlaySettings.fontScale * 100)}%</span>
              </span>
              <input type="range" min="0.86" max="1.32" step="0.02" value={overlaySettings.fontScale} onChange={(event) => onUpdateOverlaySettings({ fontScale: Number(event.target.value), visible: true })} className="w-full accent-slate-950" />
            </label>
          </div>

          <div className="mt-5 space-y-2">
            <button type="button" onClick={() => onUpdateOverlaySettings({ scrollMode: !overlaySettings.scrollMode, visible: true })} className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 active:scale-[0.99]">
              滚动模式
              <span className={cn('h-5 w-9 rounded-full p-0.5 transition', overlaySettings.scrollMode ? 'bg-blue-500' : 'bg-slate-200')}><span className={cn('block h-4 w-4 rounded-full bg-white transition', overlaySettings.scrollMode && 'translate-x-4')} /></span>
            </button>
            <button type="button" onClick={() => onUpdateOverlaySettings({ showOriginal: !overlaySettings.showOriginal })} className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 active:scale-[0.99]">
              原文
              <span className={cn('h-5 w-9 rounded-full p-0.5 transition', overlaySettings.showOriginal ? 'bg-blue-500' : 'bg-slate-200')}><span className={cn('block h-4 w-4 rounded-full bg-white transition', overlaySettings.showOriginal && 'translate-x-4')} /></span>
            </button>
          </div>

          {overlaySettings.scrollMode && (
            <label className="mt-5 block">
              <span className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>展示句数</span>
                <span>{overlaySettings.visibleLineCount} 句</span>
              </span>
              <input
                type="range"
                min="2"
                max="5"
                step="1"
                value={overlaySettings.visibleLineCount}
                onChange={(event) => onUpdateOverlaySettings({ visibleLineCount: Number(event.target.value), visible: true })}
                className="w-full accent-slate-950"
              />
            </label>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-black text-slate-950">参考资料</h2>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700">Beta</span>
          </div>

          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center transition hover:border-blue-300 hover:bg-blue-50/60">
            <Upload className="h-5 w-5 text-slate-500" />
            <span className="mt-2 text-sm font-black text-slate-900">上传翻译参考</span>
            <span className="mt-1 text-xs leading-5 text-slate-500">txt / docx / pdf / xlsx · 5MB以内</span>
            <input
              type="file"
              accept=".txt,.docx,.pdf,.xlsx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={(event) => {
                handleReferenceFileChange(event.target.files);
                event.target.value = '';
              }}
            />
          </label>

          {referenceFileError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-700">{referenceFileError}</p>
          )}

          {referenceFile && (
            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{referenceFile.name}</p>
                  <p className="mt-1 text-xs font-semibold text-blue-700">{referenceFile.extension.toUpperCase()} · {formatFileSize(referenceFile.size)} · 已作为参考</p>
                </div>
                <button type="button" onClick={clearReferenceFile} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900" aria-label="移除参考资料">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </aside>

      {planLimitNotice && (
        <div className="fixed inset-0 z-[88] flex items-center justify-center bg-slate-950/45 p-6">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Crown className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-950">需要开通付费企业版</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">当前账号暂未开通字幕同传权限。请联系销售完成企业付费开通后，再开始字幕同传。</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={onDismissPlanLimit} className="h-11 rounded-lg bg-slate-100 text-sm font-bold text-slate-800 transition hover:bg-slate-200">
                我知道了
              </button>
              <button type="button" onClick={onDismissPlanLimit} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800">
                <Handshake className="h-4 w-4" />
                联系销售
              </button>
            </div>
          </div>
        </div>
      )}

      {renderCaptionSessionDialog()}
      {renderAllCaptionSessionsDialog()}
    </div>
  );
}

function TranslationPreferencesWorkspace({
  preferences,
  terms,
  customScenes,
  isCustomSceneEditorOpen,
  isTermEditorOpen,
  isTermLibraryOpen,
  editingTerm,
  customSceneName,
  customScenePrompt,
  termOriginalText,
  termTranslatedText,
  termInstruction,
  onUpdatePreferences,
  onOpenCustomSceneEditor,
  onCloseCustomSceneEditor,
  onSaveCustomScene,
  onOpenTermEditor,
  onOpenTermLibrary,
  onCloseTermEditor,
  onCloseTermLibrary,
  onSaveTerm,
  onCustomSceneNameChange,
  onCustomScenePromptChange,
  onTermOriginalTextChange,
  onTermTranslatedTextChange,
  onTermInstructionChange,
}: {
  preferences: DesktopTranslationPreferences;
  terms: TermEntry[];
  customScenes: DesktopCustomScene[];
  isCustomSceneEditorOpen: boolean;
  isTermEditorOpen: boolean;
  isTermLibraryOpen: boolean;
  editingTerm: TermEntry | null;
  customSceneName: string;
  customScenePrompt: string;
  termOriginalText: string;
  termTranslatedText: string;
  termInstruction: string;
  onUpdatePreferences: (patch: Partial<DesktopTranslationPreferences>) => void;
  onOpenCustomSceneEditor: () => void;
  onCloseCustomSceneEditor: () => void;
  onSaveCustomScene: () => void;
  onOpenTermEditor: (term?: TermEntry) => void;
  onOpenTermLibrary: () => void;
  onCloseTermEditor: () => void;
  onCloseTermLibrary: () => void;
  onSaveTerm: () => void;
  onCustomSceneNameChange: (value: string) => void;
  onCustomScenePromptChange: (value: string) => void;
  onTermOriginalTextChange: (value: string) => void;
  onTermTranslatedTextChange: (value: string) => void;
  onTermInstructionChange: (value: string) => void;
}) {
  const preferenceTargetLanguages = normalizeDesktopTargetLanguages(preferences.targetLanguages, preferences.targetLanguage);

  function updatePreferenceTargetLanguage(index: number, value: DesktopTargetLanguage) {
    const next = [...preferenceTargetLanguages];
    next[index] = value;
    const targetLanguages = normalizeDesktopTargetLanguages(next, preferences.targetLanguage);
    onUpdatePreferences({ targetLanguages, targetLanguage: activeDesktopTargetLanguages(targetLanguages, preferences.targetLanguage)[0] ?? 'none' });
  }

  function addPreferenceTargetLanguage() {
    if (preferenceTargetLanguages.length >= 3) return;
    const used = new Set(preferenceTargetLanguages);
    const nextLanguage = TARGET_LANGUAGES.find((item) => item.value !== 'none' && !used.has(item.value))?.value ?? 'none';
    const targetLanguages = [...preferenceTargetLanguages, nextLanguage].slice(0, 3);
    onUpdatePreferences({ targetLanguages, targetLanguage: activeDesktopTargetLanguages(targetLanguages, preferences.targetLanguage)[0] ?? 'none' });
  }

  function removePreferenceTargetLanguage(index: number) {
    if (index === 0) return;
    const targetLanguages = normalizeDesktopTargetLanguages(preferenceTargetLanguages.filter((_, itemIndex) => itemIndex !== index), preferences.targetLanguage);
    onUpdatePreferences({ targetLanguages, targetLanguage: activeDesktopTargetLanguages(targetLanguages, preferences.targetLanguage)[0] ?? 'none' });
  }

  return (
    <div className="flex h-full min-h-0 items-start justify-center overflow-y-auto px-8 pb-10 pt-8">
      <div className="grid w-full max-w-[1160px] grid-cols-[minmax(0,1fr)_minmax(380px,0.92fr)] gap-5">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-950">默认翻译设置</h2>
              <p className="mt-1 text-xs text-slate-500">这些设置会被 AI 通话和字幕同传共享。</p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Languages className="h-3.5 w-3.5 text-blue-600" />
                  默认源语言
                </span>
                <select value={preferences.sourceLanguage} onChange={(event) => onUpdatePreferences({ sourceLanguage: event.target.value as DesktopSourceLanguage })} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100">
                  {SOURCE_LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <div className="space-y-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Languages className="h-3.5 w-3.5 text-blue-600" />
                  默认目标语言
                </span>
                {preferenceTargetLanguages.map((language, index) => (
                  <div key={`preference-target-${index}`} className="flex gap-2">
                    <select value={language} onChange={(event) => updatePreferenceTargetLanguage(index, event.target.value as DesktopTargetLanguage)} className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100">
                      {TARGET_LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                    {index > 0 && (
                      <button type="button" onClick={() => removePreferenceTargetLanguage(index)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-red-600" aria-label={`移除默认目标语言${index + 1}`}>
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {preferenceTargetLanguages.length < 3 && (
                  <button type="button" onClick={addPreferenceTargetLanguage} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white text-sm font-bold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50">
                    <Plus className="h-4 w-4" />
                    添加默认目标语言
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-950">
                <ScrollText className="h-4 w-4 text-blue-600" />
                译文风格
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {FORMALITY_OPTIONS.map((option) => (
                  <button key={option.value} type="button" onClick={() => onUpdatePreferences({ translationFormality: option.value })} className={cn('rounded-lg border px-3 py-3 text-left transition', preferences.translationFormality === option.value ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}>
                    <span className="block text-sm font-bold">{option.label}</span>
                    <span className="mt-1 block text-xs leading-5 opacity-70">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-black text-slate-950">
                <Type className="h-4 w-4 text-blue-600" />
                显示与交互
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {SUBTITLE_SIZE_OPTIONS.map((option) => (
                  <button key={option.value} type="button" onClick={() => onUpdatePreferences({ subtitleSize: option.value })} className={cn('rounded-lg border px-3 py-3 text-center text-sm font-bold transition', preferences.subtitleSize === option.value ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}>
                    {option.label}
                  </button>
                ))}
              </div>
              <PreferenceSwitch label="显示原文" checked={preferences.showOriginalText} onChange={() => onUpdatePreferences({ showOriginalText: !preferences.showOriginalText })} />
              <PreferenceSwitch label="自动生成纪要" checked={preferences.autoGenerateSummary} onChange={() => onUpdatePreferences({ autoGenerateSummary: !preferences.autoGenerateSummary })} />
              <PreferenceSwitch label="使用我的术语库" checked={preferences.useTermsLibrary} onChange={() => onUpdatePreferences({ useTermsLibrary: !preferences.useTermsLibrary })} />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-950">对话场景与术语库</h2>
              <p className="mt-1 text-xs text-slate-500">和移动端保持同一套场景与术语。</p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <MessageSquareText className="h-3.5 w-3.5 text-blue-600" />
                对话场景
              </h3>
              <div className="flex flex-wrap gap-2">
                {SCENES.map((scene) => (
                  <button key={scene.id} type="button" onClick={() => onUpdatePreferences({ activeSceneId: scene.id })} className={cn('rounded-lg px-3 py-2 text-sm font-bold transition', preferences.activeSceneId === scene.id ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}>
                    {scene.name}
                  </button>
                ))}
                {customScenes.map((scene) => (
                  <button key={scene.id} type="button" onClick={() => onUpdatePreferences({ activeSceneId: scene.id })} className={cn('rounded-lg px-3 py-2 text-sm font-bold transition', preferences.activeSceneId === scene.id ? 'bg-slate-950 text-white' : 'border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100')}>
                    {scene.name}
                  </button>
                ))}
                <button type="button" onClick={onOpenCustomSceneEditor} className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50">自定义场景</button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                  我的术语库
                </h3>
                <button type="button" onClick={() => onUpdatePreferences({ useTermsLibrary: !preferences.useTermsLibrary })} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className={cn('h-5 w-9 rounded-full p-0.5 transition', preferences.useTermsLibrary ? 'bg-blue-500' : 'bg-slate-200')}><span className={cn('block h-4 w-4 rounded-full bg-white transition', preferences.useTermsLibrary && 'translate-x-4')} /></span>
                </button>
              </div>
              {preferences.useTermsLibrary && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={onOpenTermLibrary} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50">
                    <Plus className="h-3.5 w-3.5" />
                    自定义术语库
                  </button>
                  {terms.map((term) => (
                    <button key={term.id} type="button" onClick={() => onOpenTermEditor(term)} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100">
                      {term.zh}/{term.idText}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>
      </div>

      {isCustomSceneEditorOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-black text-slate-950">自定义场景</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">设置场景名称和提示词，AI 会按这个场景处理翻译。</p>
              </div>
              <button type="button" onClick={onCloseCustomSceneEditor} aria-label="关闭" className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="block text-xs font-bold text-slate-500">场景名称</span>
                <input value={customSceneName} onChange={(event) => onCustomSceneNameChange(event.target.value)} placeholder="例如：矿区接待客户" autoFocus className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 focus:bg-white" />
              </label>

              <label className="block space-y-2">
                <span className="block text-xs font-bold text-slate-500">场景提示词</span>
                <textarea value={customScenePrompt} onChange={(event) => onCustomScenePromptChange(event.target.value)} rows={6} placeholder="说明这个场景下应该如何翻译、哪些内容要保留、语气应该怎样处理" className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:bg-white" />
              </label>

              <button type="button" onClick={onSaveCustomScene} disabled={!customSceneName.trim() || !customScenePrompt.trim()} className="h-12 w-full rounded-lg bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400">
                保存场景
              </button>
            </div>
          </div>
        </div>
      )}

      {isTermLibraryOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="flex max-h-[min(88vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 p-5">
              <div className="min-w-0">
                <h2 className="text-lg font-black text-slate-950">自定义术语库</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">管理术语译法和 AI 使用该译法的场合。</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => onOpenTermEditor()} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700">
                  新增术语
                </button>
                <button type="button" onClick={onCloseTermLibrary} aria-label="关闭" className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="space-y-2">
                {terms.map((term) => (
                  <button key={term.id} type="button" onClick={() => onOpenTermEditor(term)} className="flex w-full items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-950">{term.zh}</span>
                      <span className="mt-0.5 block text-xs text-blue-700">{term.idText}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{term.note}</span>
                    </span>
                    <Pencil className="h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isTermEditorOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg max-h-[min(88vh,760px)] overflow-y-auto rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-black text-slate-950">{editingTerm ? '编辑术语' : '新增术语'}</h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">自定义原文、译文，以及 AI 使用该译法的场合。</p>
              </div>
              <button type="button" onClick={onCloseTermEditor} aria-label="关闭" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="block text-xs font-bold text-slate-500">原文</span>
                <input value={termOriginalText} onChange={(event) => onTermOriginalTextChange(event.target.value)} placeholder="例如：镍矿" autoFocus className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 focus:bg-white" />
              </label>

              <label className="block space-y-2">
                <span className="block text-xs font-bold text-slate-500">译文</span>
                <input value={termTranslatedText} onChange={(event) => onTermTranslatedTextChange(event.target.value)} placeholder="例如：bijih nikel" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 focus:bg-white" />
              </label>

              <label className="block space-y-2">
                <span className="block text-xs font-bold text-slate-500">翻译指示</span>
                <textarea value={termInstruction} onChange={(event) => onTermInstructionChange(event.target.value)} rows={4} placeholder="说明 AI 在何种场合下可以使用此术语翻译" className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:bg-white" />
                <span className="block text-xs leading-5 text-slate-400">翻译指示是告诉 AI 在何种场合下可以使用此术语翻译。</span>
              </label>

              <button type="button" onClick={onSaveTerm} disabled={!termOriginalText.trim() || !termTranslatedText.trim() || !termInstruction.trim()} className="h-12 w-full rounded-2xl bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400">
                保存术语
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PreferenceSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50">
      {label}
      <span className={cn('h-5 w-9 rounded-full p-0.5 transition', checked ? 'bg-blue-500' : 'bg-slate-200')}><span className={cn('block h-4 w-4 rounded-full bg-white transition', checked && 'translate-x-4')} /></span>
    </button>
  );
}

export function DesktopApp() {
  const [activeView, setActiveView] = useState<DesktopView>('captions');
  const [currentUser, setCurrentUser] = useState<DesktopMockUser | null>(readDesktopMockUser);
  const [planLimitNotice, setPlanLimitNotice] = useState(false);
  const [overlaySettings, setOverlaySettings] = useState<CaptionOverlaySettings>(DEFAULT_OVERLAY_SETTINGS);
  const [streamState, setStreamState] = useState<CaptionStreamState>(DEFAULT_CAPTION_STATE);
  const previousStreamStateRef = useRef<CaptionStreamState>(DEFAULT_CAPTION_STATE);
  const [captionLines, setCaptionLines] = useState<DesktopCaptionLine[]>([]);
  const [captionSessionStartedAt, setCaptionSessionStartedAt] = useState('');
  const [captionSessions, setCaptionSessions] = useState<DesktopCaptionSession[]>(() => readStoredValue(DESKTOP_CAPTION_SESSIONS_KEY, []));
  const [fallbackRunning, setFallbackRunning] = useState(false);
  const [translationPreferences, setTranslationPreferences] = useState<DesktopTranslationPreferences>(readDesktopPreferences);
  const enterpriseDemoPreferencesAppliedRef = useRef(false);
  const [desktopTerms, setDesktopTerms] = useState<TermEntry[]>(() => readStoredValue(DESKTOP_TERMS_KEY, DEFAULT_TERMS));
  const [desktopCustomScenes, setDesktopCustomScenes] = useState<DesktopCustomScene[]>(() => readStoredValue(DESKTOP_CUSTOM_SCENES_KEY, []));
  const [isCustomSceneEditorOpen, setIsCustomSceneEditorOpen] = useState(false);
  const [isTermEditorOpen, setIsTermEditorOpen] = useState(false);
  const [isTermLibraryOpen, setIsTermLibraryOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<TermEntry | null>(null);
  const [customSceneName, setCustomSceneName] = useState('矿区接待客户');
  const [customScenePrompt, setCustomScenePrompt] = useState(DEFAULT_CUSTOM_SCENE_PROMPT);
  const [termOriginalText, setTermOriginalText] = useState('');
  const [termTranslatedText, setTermTranslatedText] = useState('');
  const [termInstruction, setTermInstruction] = useState('');

  useEffect(() => {
    const api = window.knowlyDesktop;
    if (!api) return;

    void api.getOverlaySettings().then(setOverlaySettings);
    void api.getCaptionStreamState().then(setStreamState);

    const removeLineListener = api.onCaptionLine((line) => {
      setCaptionLines((current) => [...current, line].slice(-60));
    });
    const removeStateListener = api.onCaptionState(setStreamState);
    const removeOverlayListener = api.onOverlaySettings(setOverlaySettings);

    return () => {
      removeLineListener();
      removeStateListener();
      removeOverlayListener();
    };
  }, []);

  useEffect(() => {
    if (!fallbackRunning || window.knowlyDesktop) return;
    const timer = window.setInterval(() => {
      setCaptionLines((current) => {
        const line = makeFallbackCaptionLine(current.length, streamState.targetLanguages);
        setStreamState((state) => ({ ...state, lineCount: line.sequence }));
        return [...current, line].slice(-60);
      });
    }, 2400);
    return () => window.clearInterval(timer);
  }, [fallbackRunning, streamState.targetLanguages]);

  useEffect(() => {
    writeStoredValue(DESKTOP_PREFERENCES_KEY, translationPreferences);
  }, [translationPreferences]);

  useEffect(() => {
    if (enterpriseDemoPreferencesAppliedRef.current || currentUser?.plan !== 'enterprise') return;

    enterpriseDemoPreferencesAppliedRef.current = true;
    const demoPreferences = applyMultilingualCaptionDemoPreferences(translationPreferences);
    setTranslationPreferences(demoPreferences);
    updateOverlaySettings({ showOriginal: true, showTranslation: true });
  }, [currentUser?.plan, translationPreferences]);

  useEffect(() => {
    writeStoredValue(DESKTOP_TERMS_KEY, desktopTerms);
  }, [desktopTerms]);

  useEffect(() => {
    writeStoredValue(DESKTOP_CUSTOM_SCENES_KEY, desktopCustomScenes);
  }, [desktopCustomScenes]);

  useEffect(() => {
    writeStoredValue(DESKTOP_CAPTION_SESSIONS_KEY, captionSessions);
  }, [captionSessions]);

  useEffect(() => {
    const previousState = previousStreamStateRef.current;
    if (previousState.running && !streamState.running) {
      saveCaptionSessionFromLines(captionLines, previousState);
      setCaptionSessionStartedAt('');
    }
    previousStreamStateRef.current = streamState;
  }, [captionLines, streamState]);

  function updateOverlaySettings(settings: Partial<CaptionOverlaySettings>) {
    const api = window.knowlyDesktop;
    if (!api) {
      setOverlaySettings((current) => ({ ...current, ...settings }));
      return;
    }

    void api.setOverlaySettings(settings).then(setOverlaySettings);
  }

  function loginMockUser(user: DesktopMockUser) {
    if (user.plan === 'enterprise') {
      const demoPreferences = applyMultilingualCaptionDemoPreferences(translationPreferences);
      enterpriseDemoPreferencesAppliedRef.current = true;
      setTranslationPreferences(demoPreferences);
      writeStoredValue(DESKTOP_PREFERENCES_KEY, demoPreferences);
      updateOverlaySettings({ showOriginal: true, showTranslation: true });
    }
    setCurrentUser(user);
    setActiveView('captions');
    setPlanLimitNotice(false);
    setCaptionLines([]);
    writeStoredValue(DESKTOP_AUTH_USER_KEY, user);
  }

  function logoutMockUser() {
    if (streamState.running) {
      stopCaptionStream();
    }
    setFallbackRunning(false);
    setCurrentUser(null);
    setPlanLimitNotice(false);
    setCaptionLines([]);
    setCaptionSessionStartedAt('');
    enterpriseDemoPreferencesAppliedRef.current = false;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DESKTOP_AUTH_USER_KEY);
    }
  }

  function startCaptionStream(options: StartCaptionStreamOptions) {
    if (currentUser?.plan !== 'enterprise') {
      setPlanLimitNotice(true);
      return;
    }

    const startedAt = new Date().toISOString();
    setCaptionSessionStartedAt(startedAt);
    setCaptionLines([]);
    updateOverlaySettings({ showTranslation: true });
    const api = window.knowlyDesktop;
    if (!api) {
      setFallbackRunning(true);
      setStreamState({ ...options, running: true, paused: false, lineCount: 0, startedAt });
      setOverlaySettings((current) => ({ ...current, visible: true }));
      return;
    }

    void api.startCaptionMockStream(options).then(setStreamState);
  }

  function pauseCaptionStream() {
    const api = window.knowlyDesktop;
    if (!api) {
      setFallbackRunning(false);
      setStreamState((current) => ({ ...current, paused: true }));
      return;
    }
    void api.pauseCaptionMockStream().then(setStreamState);
  }

  function resumeCaptionStream() {
    const api = window.knowlyDesktop;
    if (!api) {
      setFallbackRunning(true);
      setStreamState((current) => ({ ...current, paused: false }));
      return;
    }
    void api.resumeCaptionMockStream().then(setStreamState);
  }

  function saveCaptionSessionFromLines(lines: DesktopCaptionLine[], state: CaptionStreamState) {
    if (lines.length === 0) return;

    const turns = captionLinesToTurns(lines);
    const summary = makeDesktopCaptionSummary(turns);
    const endedAt = new Date().toISOString();
    const startedAt = captionSessionStartedAt || state.startedAt || lines[0]?.receivedAt || endedAt;
    const sourceDeviceLabel = AUDIO_DEVICES.find((device) => device.id === state.sourceDevice)?.label ?? state.sourceDevice;
    const targetLanguages = normalizeDesktopTargetLanguages(state.targetLanguages, state.targetLanguage);
    const session: DesktopCaptionSession = {
      id: `desktop-caption-session-${Date.now()}`,
      title: summary.title,
      startedAt,
      endedAt,
      sourceDevice: sourceDeviceLabel,
      sourceLanguage: state.sourceLanguage,
      targetLanguage: state.targetLanguage,
      targetLanguages,
      preferenceSummary: desktopCaptionSessionSummary(translationPreferences, state.sourceLanguage, targetLanguages),
      lines,
      turns,
      summary,
    };

    setCaptionSessions((current) => [session, ...current].slice(0, 20));
  }

  function updateCaptionSession(session: DesktopCaptionSession) {
    setCaptionSessions((current) => current.map((item) => (item.id === session.id ? session : item)));
  }

  function stopCaptionStream() {
    const api = window.knowlyDesktop;
    if (!api) {
      setFallbackRunning(false);
      setStreamState((current) => ({ ...current, running: false, paused: false, startedAt: undefined }));
      setOverlaySettings((current) => ({ ...current, visible: false }));
      return;
    }
    void api.stopCaptionMockStream().then(setStreamState);
  }

  function updateTranslationPreferences(patch: Partial<DesktopTranslationPreferences>) {
    const next = { ...translationPreferences, ...patch };
    const overlayPatch: Partial<CaptionOverlaySettings> = {};

    if (patch.subtitleSize) {
      Object.assign(overlayPatch, subtitleSizeToOverlayDefaults(next.subtitleSize));
    }

    if (typeof patch.showOriginalText === 'boolean') {
      overlayPatch.showOriginal = next.showOriginalText;
    }

    setTranslationPreferences(next);

    if (Object.keys(overlayPatch).length > 0 && !streamState.running) {
      updateOverlaySettings(overlayPatch);
    }
  }

  function openCustomSceneEditor() {
    setCustomSceneName((current) => current || '矿区接待客户');
    setCustomScenePrompt((current) => current || DEFAULT_CUSTOM_SCENE_PROMPT);
    setIsCustomSceneEditorOpen(true);
  }

  function closeCustomSceneEditor() {
    setIsCustomSceneEditorOpen(false);
  }

  function saveCustomScene() {
    const name = customSceneName.trim();
    const prompt = customScenePrompt.trim();
    if (!name || !prompt) return;

    const scene: DesktopCustomScene = {
      id: `desktop-custom-scene-${Date.now()}`,
      name,
      prompt,
    };
    setDesktopCustomScenes((current) => [scene, ...current.filter((item) => item.name !== name)]);
    setTranslationPreferences((current) => ({ ...current, activeSceneId: scene.id }));
    setIsCustomSceneEditorOpen(false);
  }

  function openTermEditor(term?: TermEntry) {
    setEditingTerm(term ?? null);
    setTermOriginalText(term?.zh ?? '');
    setTermTranslatedText(term?.idText ?? '');
    setTermInstruction(term?.note ?? '');
    setIsTermEditorOpen(true);
  }

  function openTermLibrary() {
    setIsTermLibraryOpen(true);
  }

  function closeTermEditor() {
    setIsTermEditorOpen(false);
    setEditingTerm(null);
    setTermOriginalText('');
    setTermTranslatedText('');
    setTermInstruction('');
  }

  function closeTermLibrary() {
    setIsTermLibraryOpen(false);
  }

  function saveTermEditor() {
    const zh = termOriginalText.trim();
    const idText = termTranslatedText.trim();
    const note = termInstruction.trim();
    if (!zh || !idText || !note) return;

    if (!editingTerm) {
      setDesktopTerms((current) => [
        {
          id: `desktop-term-${Date.now()}`,
          zh,
          idText,
          category: '自定义',
          note,
          source: 'user',
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);
      closeTermEditor();
      return;
    }

    setDesktopTerms((current) =>
      current.map((term) =>
        term.id === editingTerm.id
          ? { ...term, zh, idText, note, source: term.source === 'default' ? 'user' : term.source }
          : term,
      ),
    );
    closeTermEditor();
  }

  function showOverlay() {
    const api = window.knowlyDesktop;
    if (!api) {
      setOverlaySettings((current) => ({ ...current, visible: true }));
      return;
    }
    void api.showOverlay().then(setOverlaySettings);
  }

  function hideOverlay() {
    const api = window.knowlyDesktop;
    if (!api) {
      setOverlaySettings((current) => ({ ...current, visible: false }));
      return;
    }
    void api.hideOverlay().then(setOverlaySettings);
  }

  if (!currentUser) {
    return <DesktopLoginScreen onLogin={loginMockUser} />;
  }

  return (
    <DesktopShell activeView={activeView} currentUser={currentUser} onChangeView={setActiveView} onLogout={logoutMockUser}>
      {activeView === 'call' ? (
        <AiCallWorkspace
          preferences={translationPreferences}
          onOpenPreferences={() => setActiveView('preferences')}
        />
      ) : activeView === 'captions' ? (
        <LiveCaptionWorkspace
          lines={captionLines}
          streamState={streamState}
          overlaySettings={overlaySettings}
          preferences={translationPreferences}
          captionSessions={captionSessions}
          planLimitNotice={planLimitNotice}
          onStart={startCaptionStream}
          onPause={pauseCaptionStream}
          onResume={resumeCaptionStream}
          onStop={stopCaptionStream}
          onDismissPlanLimit={() => setPlanLimitNotice(false)}
          onShowOverlay={showOverlay}
          onHideOverlay={hideOverlay}
          onUpdateOverlaySettings={updateOverlaySettings}
          onUpdateCaptionSession={updateCaptionSession}
          onOpenPreferences={() => setActiveView('preferences')}
        />
      ) : (
        <TranslationPreferencesWorkspace
          preferences={translationPreferences}
          terms={desktopTerms}
          customScenes={desktopCustomScenes}
          isCustomSceneEditorOpen={isCustomSceneEditorOpen}
          isTermEditorOpen={isTermEditorOpen}
          isTermLibraryOpen={isTermLibraryOpen}
          editingTerm={editingTerm}
          customSceneName={customSceneName}
          customScenePrompt={customScenePrompt}
          termOriginalText={termOriginalText}
          termTranslatedText={termTranslatedText}
          termInstruction={termInstruction}
          onUpdatePreferences={updateTranslationPreferences}
          onOpenCustomSceneEditor={openCustomSceneEditor}
          onCloseCustomSceneEditor={closeCustomSceneEditor}
          onSaveCustomScene={saveCustomScene}
          onOpenTermEditor={openTermEditor}
          onOpenTermLibrary={openTermLibrary}
          onCloseTermEditor={closeTermEditor}
          onCloseTermLibrary={closeTermLibrary}
          onSaveTerm={saveTermEditor}
          onCustomSceneNameChange={setCustomSceneName}
          onCustomScenePromptChange={setCustomScenePrompt}
          onTermOriginalTextChange={setTermOriginalText}
          onTermTranslatedTextChange={setTermTranslatedText}
          onTermInstructionChange={setTermInstruction}
        />
      )}
    </DesktopShell>
  );
}
