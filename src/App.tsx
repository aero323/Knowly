import { useEffect, useMemo, useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { DEFAULT_PROFILE, DEFAULT_TERMS, INDUSTRIES, MOCK_PHOTO_TRANSLATION_SESSION, SCENES } from '@/data/mockData';
import { readStoredValue, writeStoredValue } from '@/lib/storage';
import { upsertTranslationMemory } from '@/lib/translationMemory';
import { mockKnowlyService } from '@/services/knowlyService';
import { CallsView } from '@/views/CallsView';
import { ProfileView } from '@/views/ProfileView';
import { SubscriptionView } from '@/views/SubscriptionView';
import { TranslateView } from '@/views/TranslateView';
import { AssistantTaskScreen } from '@/screens/AssistantTaskScreen';
import { CallLobbyScreen, CallRoomScreen } from '@/screens/CallScreens';
import { FaceSessionScreen } from '@/screens/FaceSessionScreen';
import { PhotoTranslateScreen } from '@/screens/PhotoTranslateScreen';
import { ProfileDetailScreen } from '@/screens/ProfileDetailScreen';
import { SceneEditorScreen } from '@/screens/SceneEditorScreen';
import { SimultaneousScreen } from '@/screens/SimultaneousScreen';
import { SubscriptionScreen } from '@/screens/SubscriptionScreen';
import { SummaryScreen } from '@/screens/SummaryScreen';
import type { AppScreen, BusinessProfile, CallSession, GeneralSettings, IndustryContext, ScenePrompt, TabType, TermEntry, TranslationMemoryEntry, TranslationSession } from '@/types';

const HISTORY_KEY = 'knowly.translationHistory.v1';
const TRANSLATION_MEMORY_KEY = 'knowly.translationMemory.v1';
const TERMS_KEY = 'knowly.terms.v1';
const PROFILE_KEY = 'knowly.profile.v1';
const GENERAL_SETTINGS_KEY = 'knowly.generalSettings.v1';
const GENERAL_SETTINGS_LANGUAGE_SELECT_KEY = 'knowly.generalSettings.languageSelect.v2';
const VISIBLE_SCENES_KEY = 'knowly.visibleSceneIds.v1';
const CUSTOM_SCENES_KEY = 'knowly.customScenes.v1';
const CUSTOM_INDUSTRIES_KEY = 'knowly.customIndustries.v1';
const DEFAULT_VISIBLE_SCENE_IDS = SCENES.map((scene) => scene.id);
const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  sourceLanguage: 'auto',
  targetLanguage: 'id',
  simultaneousDirection: 'id-to-zh',
  translationFormality: 'business',
  subtitleSize: 'standard',
  showOriginalText: true,
  autoGenerateSummary: true,
  showHistory: true,
  historyLimit: 20,
};
const SOURCE_LANGUAGE_VALUES = ['auto', 'zh', 'id', 'en', 'ja'];
const TARGET_LANGUAGE_VALUES = ['zh', 'id', 'en', 'ja'];

function isSourceLanguage(value: unknown): value is GeneralSettings['sourceLanguage'] {
  return typeof value === 'string' && SOURCE_LANGUAGE_VALUES.includes(value);
}

function isTargetLanguage(value: unknown): value is GeneralSettings['targetLanguage'] {
  return typeof value === 'string' && TARGET_LANGUAGE_VALUES.includes(value);
}

function readGeneralSettings() {
  const storedSettings = readStoredValue<Partial<GeneralSettings> | null>(GENERAL_SETTINGS_KEY, null);
  const hasLanguageSelectMigration = readStoredValue(GENERAL_SETTINGS_LANGUAGE_SELECT_KEY, false);

  if (!storedSettings) return DEFAULT_GENERAL_SETTINGS;

  return {
    ...DEFAULT_GENERAL_SETTINGS,
    ...storedSettings,
    sourceLanguage: hasLanguageSelectMigration && isSourceLanguage(storedSettings.sourceLanguage)
      ? storedSettings.sourceLanguage
      : 'auto',
    targetLanguage: isTargetLanguage(storedSettings.targetLanguage) ? storedSettings.targetLanguage : DEFAULT_GENERAL_SETTINGS.targetLanguage,
  };
}

function readTranslationHistory() {
  const storedHistory = readStoredValue<TranslationSession[]>(HISTORY_KEY, []);
  if (storedHistory.some((session) => session.id === MOCK_PHOTO_TRANSLATION_SESSION.id)) return storedHistory;
  return [MOCK_PHOTO_TRANSLATION_SESSION, ...storedHistory];
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('translate');
  const [screenStack, setScreenStack] = useState<AppScreen[]>([]);
  const [translationHistory, setTranslationHistory] = useState<TranslationSession[]>(readTranslationHistory);
  const [translationMemory, setTranslationMemory] = useState<TranslationMemoryEntry[]>(() => readStoredValue(TRANSLATION_MEMORY_KEY, []));
  const [terms, setTerms] = useState<TermEntry[]>(() => readStoredValue(TERMS_KEY, DEFAULT_TERMS));
  const [profile, setProfile] = useState<BusinessProfile>(() => readStoredValue(PROFILE_KEY, DEFAULT_PROFILE));
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(readGeneralSettings);
  const [customScenes, setCustomScenes] = useState<ScenePrompt[]>(() => readStoredValue(CUSTOM_SCENES_KEY, []));
  const [customIndustries, setCustomIndustries] = useState<IndustryContext[]>(() => readStoredValue(CUSTOM_INDUSTRIES_KEY, []));
  const [visibleSceneIds, setVisibleSceneIds] = useState<string[]>(() => readStoredValue(VISIBLE_SCENES_KEY, DEFAULT_VISIBLE_SCENE_IDS));
  const [activeCalls, setActiveCalls] = useState<CallSession[]>([]);
  const [focusEnterprisePlan, setFocusEnterprisePlan] = useState(false);
  const service = useMemo(() => mockKnowlyService, []);
  const scenes = useMemo(() => [...SCENES, ...customScenes], [customScenes]);
  const industries = useMemo(() => [...INDUSTRIES, ...customIndustries], [customIndustries]);
  const activeScreen = screenStack[screenStack.length - 1];

  useEffect(() => {
    writeStoredValue(HISTORY_KEY, translationHistory);
  }, [translationHistory]);

  useEffect(() => {
    writeStoredValue(TRANSLATION_MEMORY_KEY, translationMemory);
  }, [translationMemory]);

  useEffect(() => {
    writeStoredValue(TERMS_KEY, terms);
  }, [terms]);

  useEffect(() => {
    writeStoredValue(PROFILE_KEY, profile);
  }, [profile]);

  useEffect(() => {
    writeStoredValue(GENERAL_SETTINGS_KEY, generalSettings);
    writeStoredValue(GENERAL_SETTINGS_LANGUAGE_SELECT_KEY, true);
  }, [generalSettings]);

  useEffect(() => {
    writeStoredValue(VISIBLE_SCENES_KEY, visibleSceneIds);
  }, [visibleSceneIds]);

  useEffect(() => {
    writeStoredValue(CUSTOM_SCENES_KEY, customScenes);
  }, [customScenes]);

  useEffect(() => {
    writeStoredValue(CUSTOM_INDUSTRIES_KEY, customIndustries);
  }, [customIndustries]);

  function pushScreen(screen: AppScreen) {
    setScreenStack((current) => [...current, screen]);
  }

  function popScreen() {
    setScreenStack((current) => current.slice(0, -1));
  }

  function updateTab(tab: TabType) {
    setCurrentTab(tab);
    setScreenStack([]);
  }

  function openEnterpriseSubscription() {
    setFocusEnterprisePlan(true);
    setCurrentTab('subscription');
    setScreenStack([]);
  }

  function addTerm(term: TermEntry) {
    setTerms((current) => {
      if (current.some((item) => item.zh === term.zh)) return current;
      return [term, ...current];
    });
  }

  function updateTerm(term: TermEntry) {
    setTerms((current) => current.map((item) => item.id === term.id ? term : item));
  }

  function toggleVisibleScene(sceneId: string) {
    setVisibleSceneIds((current) => {
      if (current.includes(sceneId)) return current.filter((id) => id !== sceneId);
      return [...current, sceneId];
    });
  }

  function saveCustomScene(scene: ScenePrompt) {
    setCustomScenes((current) => [scene, ...current]);
    setVisibleSceneIds((current) => current.includes(scene.id) ? current : [...current, scene.id]);
    setScreenStack((current) => current.slice(0, -1));
  }

  function saveCustomIndustry(industry: IndustryContext) {
    setCustomIndustries((current) => [industry, ...current.filter((item) => item.id !== industry.id)]);
  }

  function saveTranslationSession(session: TranslationSession) {
    setTranslationHistory((current) => [session, ...current.filter((item) => item.id !== session.id)]);
    setScreenStack((current) => [...current.slice(0, -1), { type: 'session-summary', sessionId: session.id }]);
  }

  function updateTranslationSession(session: TranslationSession) {
    setTranslationHistory((current) => current.map((item) => item.id === session.id ? session : item));
  }

  function rememberTranslationCorrection(memory: Omit<TranslationMemoryEntry, 'id' | 'createdAt' | 'updatedAt'>) {
    setTranslationMemory((current) => upsertTranslationMemory(current, memory));
  }

  function enterCallRoom(call: CallSession) {
    setActiveCalls((current) => [call, ...current.filter((item) => item.id !== call.id)]);
    setScreenStack((current) => [...current, { type: 'call-room', callId: call.id, mode: call.mode, code: call.inviteCode, contactId: call.contactId }]);
  }

  function endCall(call: CallSession) {
    setActiveCalls((current) => [call, ...current.filter((item) => item.id !== call.id)]);
    const session: TranslationSession = {
      id: `call-session-${Date.now()}`,
      sceneId: 'meeting',
      industryId: profile.industryId,
      concise: profile.conciseMode,
      startedAt: call.startedAt,
      endedAt: new Date().toISOString(),
      turns: call.turns,
      summary: call.summary ?? {
        title: '双语通话纪要',
        minutes: ['本次通话已生成双语字幕。'],
        todos: ['回看通话字幕并确认待办'],
        terms: Array.from(new Set(call.turns.flatMap((turn) => turn.terms))).slice(0, 6),
      },
      favoriteTurnIds: [],
    };
    setTranslationHistory((current) => [session, ...current]);
    setScreenStack((current) => [...current.slice(0, -1), { type: 'session-summary', sessionId: session.id }]);
  }

  function clearTranslationHistory() {
    setTranslationHistory([]);
  }

  function renderMainTab() {
    if (currentTab === 'translate') {
      return (
        <TranslateView
          conciseDefault={profile.conciseMode}
          profileIndustryId={profile.industryId}
          scenes={scenes}
          visibleSceneIds={visibleSceneIds}
          terms={terms}
          history={translationHistory}
          showHistory={generalSettings.showHistory}
          historyLimit={generalSettings.historyLimit}
          onOpenScreen={pushScreen}
        />
      );
    }
    if (currentTab === 'calls') return <CallsView onOpenScreen={pushScreen} onOpenEnterpriseSubscription={openEnterpriseSubscription} />;
    if (currentTab === 'subscription') return <SubscriptionView focusEnterprise={focusEnterprisePlan} onEnterpriseFocused={() => setFocusEnterprisePlan(false)} />;
    return (
      <ProfileView
        generalSettings={generalSettings}
        onOpenScreen={pushScreen}
        onUpdateGeneralSettings={setGeneralSettings}
        onClearHistory={clearTranslationHistory}
      />
    );
  }

  function renderScreen(screen: AppScreen) {
    if (screen.type === 'face-session') {
      return (
        <FaceSessionScreen
          sceneId={screen.sceneId}
          industryId={screen.industryId}
          concise={screen.concise}
          scenes={scenes}
          service={service}
          translationMemory={translationMemory}
          onBack={popScreen}
          onSaveSession={saveTranslationSession}
        />
      );
    }

    if (screen.type === 'session-summary') {
      return (
        <SummaryScreen
          session={translationHistory.find((session) => session.id === screen.sessionId)}
          onBack={popScreen}
          onUpdateSession={updateTranslationSession}
          onRememberCorrection={rememberTranslationCorrection}
        />
      );
    }

    if (screen.type === 'photo-translate') {
      return (
        <PhotoTranslateScreen
          service={service}
          initialPhotoPreviewUrl={screen.photoPreviewUrl}
          initialPhotoName={screen.photoName}
          onBack={popScreen}
          onAddTerm={addTerm}
        />
      );
    }

    if (screen.type === 'simultaneous') {
      return (
        <SimultaneousScreen
          sceneId={screen.sceneId}
          industryId={screen.industryId}
          concise={profile.conciseMode}
          service={service}
          onBack={popScreen}
          onSaveSession={saveTranslationSession}
        />
      );
    }

    if (screen.type === 'call-lobby') {
      return (
        <CallLobbyScreen
          mode={screen.mode}
          code={screen.code}
          contactId={screen.contactId}
          translationMemory={translationMemory}
          onBack={popScreen}
          onEnterRoom={enterCallRoom}
        />
      );
    }

    if (screen.type === 'call-room') {
      return (
        <CallRoomScreen
          call={activeCalls.find((call) => call.id === screen.callId) ?? {
            id: screen.callId,
            mode: screen.mode,
            inviteCode: screen.code,
            contactId: screen.contactId,
            participants: ['我', 'Budi'],
            startedAt: new Date().toISOString(),
            turns: [],
          }}
          translationMemory={translationMemory}
          onBack={popScreen}
          onEndCall={endCall}
        />
      );
    }

    if (screen.type === 'assistant-task') {
      return (
        <AssistantTaskScreen
          taskId={screen.taskId}
          prompt={screen.prompt}
          historyCount={translationHistory.length}
          service={service}
          onBack={popScreen}
        />
      );
    }

    if (screen.type === 'scene-editor') {
      return <SceneEditorScreen onBack={popScreen} onSaveScene={saveCustomScene} />;
    }

    if (screen.type === 'subscription') {
      return <SubscriptionScreen onBack={popScreen} />;
    }

    return (
      <ProfileDetailScreen
        detail={screen.detail}
        scenes={scenes}
        industries={industries}
        profile={profile}
        generalSettings={generalSettings}
        terms={terms}
        visibleSceneIds={visibleSceneIds}
        onBack={popScreen}
        onOpenScreen={pushScreen}
        onUpdateProfile={setProfile}
        onUpdateGeneralSettings={setGeneralSettings}
        onAddTerm={addTerm}
        onUpdateTerm={updateTerm}
        onClearHistory={clearTranslationHistory}
        onToggleVisibleScene={toggleVisibleScene}
        onSaveCustomIndustry={saveCustomIndustry}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900 flex justify-center overflow-x-hidden">
      <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ paddingBottom: activeScreen ? 0 : 'calc(4rem + env(safe-area-inset-bottom))' }}>
          {activeScreen ? renderScreen(activeScreen) : renderMainTab()}
        </main>

        {!activeScreen && <BottomNav currentTab={currentTab} onChange={updateTab} />}
      </div>
    </div>
  );
}
