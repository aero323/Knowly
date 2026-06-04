import { Languages, Phone, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TabType } from '@/types';

interface BottomNavProps {
  currentTab: TabType;
  onChange: (tab: TabType) => void;
}

export function BottomNav({ currentTab, onChange }: BottomNavProps) {
  const tabs = [
    { id: 'translate', icon: Languages, label: '翻译' },
    { id: 'calls', icon: Phone, label: 'AI通话' },
    { id: 'agent', icon: Bot, label: 'AI助理' },
    { id: 'profile', icon: User, label: '我的' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around max-w-md mx-auto px-2 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Icon 
                className={cn(
                  "w-6 h-6",
                  isActive ? "fill-blue-50 stroke-blue-600" : "stroke-current"
                )} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? "text-blue-600" : "text-gray-500"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
