export type TabType = 'translate' | 'calls' | 'agent' | 'profile';

export interface ScenePrompt {
  id: string;
  name: string;
  icon: string;
}

export interface IndustryContext {
  id: string;
  name: string;
}
