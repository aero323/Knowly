import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  action?: ReactNode;
  below?: ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, action, below }: ScreenHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
      <div className="h-16 px-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回"
          className="w-11 h-11 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
        {action}
      </div>
      {below && <div className="px-4 pb-3">{below}</div>}
    </header>
  );
}
