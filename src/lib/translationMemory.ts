import type { ConversationTurn, TranslationMemoryEntry } from '@/types';

export type TranslationMemoryDraft = Omit<TranslationMemoryEntry, 'id' | 'createdAt' | 'updatedAt'>;

function normalizeMemoryText(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function memoryKey(sourceLanguage: string, targetLanguage: string, sourceText: string) {
  return `${sourceLanguage}:${targetLanguage}:${normalizeMemoryText(sourceText)}`;
}

export function applyTranslationMemory(turn: ConversationTurn, memory: TranslationMemoryEntry[]) {
  const key = memoryKey(turn.sourceLanguage, turn.targetLanguage, turn.sourceText);
  const remembered = memory.find((item) => memoryKey(item.sourceLanguage, item.targetLanguage, item.sourceText) === key);

  if (!remembered) return turn;

  return {
    ...turn,
    translatedText: remembered.correctedText,
  };
}

export function upsertTranslationMemory(current: TranslationMemoryEntry[], draft: TranslationMemoryDraft) {
  const now = new Date().toISOString();
  const nextKey = memoryKey(draft.sourceLanguage, draft.targetLanguage, draft.sourceText);
  const existing = current.find((item) => memoryKey(item.sourceLanguage, item.targetLanguage, item.sourceText) === nextKey);

  if (existing) {
    return current.map((item) => (
      item.id === existing.id
        ? {
            ...item,
            ...draft,
            createdAt: item.createdAt,
            updatedAt: now,
          }
        : item
    ));
  }

  return [
    {
      id: `memory-${Date.now()}`,
      ...draft,
      createdAt: now,
      updatedAt: now,
    },
    ...current,
  ].slice(0, 100);
}
