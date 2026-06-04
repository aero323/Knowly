import {
  ASSISTANT_TASKS,
  PHOTO_TRANSLATION,
  SCENE_SCRIPTS,
  SIMULTANEOUS_CAPTIONS,
  makeAssistantResponse,
  makeSummary,
} from '@/data/mockData';
import type {
  AssistantMessage,
  ConversationTurn,
  SessionSummary,
  SimultaneousCaption,
} from '@/types';

export interface TranslationRequest {
  sceneId: string;
  speaker: ConversationTurn['speaker'];
  turnIndex: number;
}

export interface PhotoTranslateResult {
  title: string;
  sourceType: string;
  original: string[];
  translated: string[];
  terms: string[];
}

export interface KnowlyService {
  nextConversationTurn(request: TranslationRequest): Promise<ConversationTurn>;
  createSummary(turns: ConversationTurn[]): Promise<SessionSummary>;
  translatePhoto(): Promise<PhotoTranslateResult>;
  simultaneousLines(): Promise<SimultaneousCaption[]>;
  assistantMessages(taskId: string, historyCount: number): Promise<AssistantMessage[]>;
}

function delay<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

export const mockKnowlyService: KnowlyService = {
  nextConversationTurn({ sceneId, speaker, turnIndex }) {
    const script = SCENE_SCRIPTS[sceneId] ?? SCENE_SCRIPTS.general;
    const base = script[turnIndex % script.length];
    const directionTurn = speaker === base.speaker
      ? base
      : script.find((turn) => turn.speaker === speaker) ?? base;

    return delay({
      ...directionTurn,
      id: `${directionTurn.id}-${turnIndex}-${Date.now()}`,
    });
  },
  createSummary(turns) {
    return delay(makeSummary(turns), 220);
  },
  translatePhoto() {
    return delay(PHOTO_TRANSLATION, 260);
  },
  simultaneousLines() {
    return delay(SIMULTANEOUS_CAPTIONS, 200);
  },
  assistantMessages(taskId, historyCount) {
    const isKnownTask = ASSISTANT_TASKS.some((task) => task.id === taskId);
    return delay(makeAssistantResponse(isKnownTask ? taskId : 'minutes', historyCount), 240);
  },
};
