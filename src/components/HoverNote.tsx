import { useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface HoverNoteProps {
  note: string;
  children: ReactNode;
  className?: string;
  triggerOnContainer?: boolean;
}

interface TooltipPosition {
  left: number;
  top: number;
  placement: 'above' | 'below';
}

export function HoverNote({ note, children, className, triggerOnContainer = false }: HoverNoteProps) {
  const noteId = useId();
  const badgeRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  function showNote() {
    const rect = badgeRef.current?.getBoundingClientRect();
    if (rect) {
      const hasRoomAbove = rect.top > 220;
      setPosition({
        left: Math.min(rect.right, window.innerWidth - 12),
        top: hasRoomAbove ? rect.top - 8 : rect.bottom + 8,
        placement: hasRoomAbove ? 'above' : 'below',
      });
    }
    setIsOpen(true);
  }

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={triggerOnContainer ? showNote : undefined}
      onMouseLeave={triggerOnContainer ? () => setIsOpen(false) : undefined}
    >
      {children}
      <button
        ref={badgeRef}
        type="button"
        aria-label="查看研发标注"
        aria-describedby={isOpen ? noteId : undefined}
        onMouseEnter={showNote}
        onMouseLeave={triggerOnContainer ? undefined : () => setIsOpen(false)}
        onFocus={showNote}
        onBlur={() => setIsOpen(false)}
        onClick={showNote}
        className="absolute -right-2 -top-2 z-20 h-6 min-w-6 rounded-full border-2 border-white bg-amber-500 px-1.5 text-[11px] font-bold leading-none text-white shadow-lg shadow-amber-900/20 outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        注
      </button>
      {isOpen && position && createPortal(
        <div
          id={noteId}
          role="tooltip"
          className="fixed z-[9999] max-h-[60vh] w-[min(520px,calc(100vw-24px))] overflow-y-auto rounded-2xl border border-amber-200 bg-white p-4 text-left text-xs leading-relaxed text-slate-700 shadow-2xl shadow-slate-900/20"
          style={{
            left: position.left,
            top: position.top,
            transform: position.placement === 'above' ? 'translate(-100%, -100%)' : 'translate(-100%, 0)',
          }}
        >
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-amber-600">Prompt 标注</div>
          <div className="whitespace-pre-line">{note}</div>
        </div>,
        document.body,
      )}
    </div>
  );
}
