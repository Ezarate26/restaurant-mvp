'use client';

import type { WaiterNavSection } from '@/components/layout/Sidebar';

export interface BottomTabsProps {
  active: WaiterNavSection;
  onChange: (section: WaiterNavSection) => void;
  chatUnreadCount?: number;
}

const tabs: { id: WaiterNavSection; label: string; emoji: string }[] = [
  { id: 'home', label: 'Solicitudes', emoji: '🏠' },
  { id: 'chat', label: 'Chat', emoji: '💬' },
  { id: 'help', label: 'Ayuda', emoji: '❓' },
];

export function BottomTabs({
  active,
  onChange,
  chatUnreadCount = 0,
}: BottomTabsProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E5E7EB] bg-[#FFFFFF] pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(15,23,42,0.06)] md:hidden"
      aria-label="Navegación móvil"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 pt-1">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition ${
                isActive
                  ? 'text-[#229ED9]'
                  : 'text-[#6B7280] hover:bg-[#F4F6F8]'
              }`}
            >
              {tab.id === 'home' && chatUnreadCount > 0 && (
                <span className="absolute right-0 top-0 rounded-full bg-red-500 px-2 text-xs text-white">
                  {chatUnreadCount}
                </span>
              )}
              <span className="relative text-xl leading-none" aria-hidden>
                {tab.emoji}
              </span>
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
