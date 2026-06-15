export type TabType = 'translate' | 'calls' | 'subscription' | 'profile';

export type AppScreen =
  | {
      type: 'face-session';
      sceneId: string;
      industryId: string;
      concise: boolean;
    }
  | {
      type: 'session-summary';
      sessionId: string;
    }
  | {
      type: 'photo-translate';
      sceneId: string;
      industryId: string;
      photoPreviewUrl?: string;
      photoName?: string;
    }
  | {
      type: 'simultaneous';
      sceneId: string;
      industryId: string;
    }
  | {
      type: 'call-lobby';
      mode: 'video' | 'voice' | 'join' | 'contact';
      code?: string;
      contactId?: string;
    }
  | {
      type: 'call-room';
      callId: string;
      mode: 'video' | 'voice';
      code: string;
      contactId?: string;
    }
  | {
      type: 'assistant-task';
      taskId: string;
      prompt?: string;
    }
  | {
      type: 'profile-detail';
      detail: 'industry' | 'scenes' | 'terms' | 'general' | 'privacy' | 'help';
    }
  | {
      type: 'scene-editor';
    }
  | {
      type: 'subscription';
    };

export interface ScenePrompt {
  id: string;
  name: string;
  icon: string;
  description: string;
  openingLines?: string[];
  keywordHints?: string[];
  summaryTemplate?: string;
}

export interface IndustryContext {
  id: string;
  name: string;
  description: string;
}

export interface BusinessProfile {
  industryId: string;
  companyRole: string;
  conciseMode: boolean;
}

export type LanguageCode = 'zh' | 'id' | 'en' | 'ja';
export type SourceLanguageCode = 'auto' | LanguageCode;
export type SimultaneousDirection = 'id-to-zh' | 'zh-to-id' | 'auto';
export type TranslationFormality = 'plain' | 'business' | 'formal';
export type SubtitleSize = 'compact' | 'standard' | 'large';
export type HistoryLimit = 10 | 20 | 50;

export interface GeneralSettings {
  sourceLanguage: SourceLanguageCode;
  targetLanguage: LanguageCode;
  simultaneousDirection: SimultaneousDirection;
  translationFormality: TranslationFormality;
  subtitleSize: SubtitleSize;
  showOriginalText: boolean;
  autoGenerateSummary: boolean;
  showHistory: boolean;
  historyLimit: HistoryLimit;
}

export interface TermEntry {
  id: string;
  zh: string;
  idText: string;
  category: string;
  note: string;
  source: 'default' | 'user' | 'session';
  createdAt: string;
}

export type ConversationSpeaker = 'me' | 'counterpart';

export interface ConversationTurn {
  id: string;
  speaker: ConversationSpeaker;
  sourceLanguage: 'zh' | 'id';
  targetLanguage: 'zh' | 'id';
  sourceText: string;
  translatedText: string;
  terms: string[];
  suggestedAction?: string;
}

export interface SessionSummary {
  title: string;
  minutes: string[];
  todos: string[];
  terms: string[];
}

export interface PhotoTranslationHistory {
  originalImageUrl: string;
  translatedImageUrl: string;
  sourceType: string;
}

export interface TranslationSession {
  id: string;
  sceneId: string;
  industryId: string;
  concise: boolean;
  startedAt: string;
  endedAt: string;
  turns: ConversationTurn[];
  summary: SessionSummary;
  favoriteTurnIds: string[];
  speakerNames?: Partial<Record<ConversationSpeaker, string>>;
  photoTranslation?: PhotoTranslationHistory;
}

export interface TranslationMemoryEntry {
  id: string;
  sourceLanguage: ConversationTurn['sourceLanguage'];
  targetLanguage: ConversationTurn['targetLanguage'];
  sourceText: string;
  originalTranslatedText: string;
  correctedText: string;
  createdAt: string;
  updatedAt: string;
}

export type SimultaneousSpeakerId = 'speaker-1' | 'speaker-2';

export interface SimultaneousCaption {
  id: string;
  speakerId: SimultaneousSpeakerId;
  sourceLanguage: 'zh' | 'id';
  targetLanguage: 'zh' | 'id';
  originalText: string;
  translatedText: string;
  startedAt: string;
  confidence: number;
  keywords: string[];
}

export interface CallSession {
  id: string;
  mode: 'video' | 'voice';
  inviteCode: string;
  contactId?: string;
  participants: string[];
  startedAt: string;
  turns: ConversationTurn[];
  summary?: SessionSummary;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
