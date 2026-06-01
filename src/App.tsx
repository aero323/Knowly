import { useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { TranslateView } from '@/views/TranslateView';
import { CallsView } from '@/views/CallsView';
import { AgentView } from '@/views/AgentView';
import { ProfileView } from '@/views/ProfileView';
import type { TabType } from '@/types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('translate');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen relative shadow-2xl flex flex-col overflow-hidden">
        
        {/* Main Content Area */}
        <main 
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
        >
          {currentTab === 'translate' && <TranslateView />}
          {currentTab === 'calls' && <CallsView />}
          {currentTab === 'agent' && <AgentView />}
          {currentTab === 'profile' && <ProfileView />}
        </main>

        <BottomNav currentTab={currentTab} onChange={setCurrentTab} />
      </div>
    </div>
  );
}
