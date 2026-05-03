'use client';

export type WaiterNavSection = 'home' | 'chat' | 'help';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  active: WaiterNavSection;
  onNavigate: (section: WaiterNavSection) => void;
  onLogout: () => void;
  appName?: string;
}

const navItems: {
  id: WaiterNavSection;
  label: string;
  emoji: string;
}[] = [
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'chat', label: 'Chat', emoji: '💬' },
  { id: 'help', label: 'Ayuda', emoji: '❓' },
];

const futureItems: { label: string; emoji: string }[] = [
  { label: 'Perfil', emoji: '👤' },
  { label: 'Historial del día', emoji: '📋' },
];

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  active,
  onNavigate,
  onLogout,
  appName = 'Restaurant',
}: SidebarProps) {
  return (
    <aside
      className={`relative hidden min-h-[100dvh] shrink-0 flex-col border-r border-[#E5E7EB] bg-[#FFFFFF] shadow-sm transition-[width] duration-200 md:flex ${
        collapsed ? 'w-[4.5rem]' : 'w-60'
      }`}
    >
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] px-3 py-4">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-[#E5E7EB] bg-[#F4F6F8] text-[#1F2937] transition hover:bg-[#E9EEF2]"
          aria-expanded={!collapsed}
          aria-label="Menú"
        >
          <span className="block h-0.5 w-4 rounded-full bg-[#1F2937]" />
          <span className="block h-0.5 w-4 rounded-full bg-[#1F2937]" />
          <span className="block h-0.5 w-4 rounded-full bg-[#1F2937]" />
        </button>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#229ED9]">{appName}</p>
            <p className="truncate text-xs font-medium text-[#6B7280]">
              Panel Mesero
            </p>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Principal">
        {navItems.map((item) => {
          const isActive = active === item.id;
          const visibilityClass = item.id === 'chat' ? 'md:hidden' : 'block';
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center rounded-xl py-2.5 text-sm font-medium transition ${
                collapsed ? 'justify-center px-0' : 'gap-3 px-3 text-left'
              } ${
                isActive
                  ? 'bg-[#E3F2FD] text-[#229ED9]'
                  : 'text-[#1F2937] hover:bg-[#F4F6F8]'
              } ${visibilityClass}`}
            >
              <span className="text-lg leading-none" aria-hidden>
                {item.emoji}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {!collapsed && (
          <p className="mt-4 px-3 text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
            Próximamente
          </p>
        )}
        {futureItems.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled
            className={`flex w-full items-center rounded-xl py-2.5 text-sm font-medium text-[#9CA3AF] opacity-60 ${
              collapsed
                ? 'justify-center px-0'
                : 'gap-3 px-3 text-left'
            }`}
          >
            <span className="text-lg leading-none grayscale" aria-hidden>
              {item.emoji}
            </span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="border-t border-[#E5E7EB] p-2">
        <button
          type="button"
          onClick={onLogout}
          className={`w-full rounded-xl border border-[#E5E7EB] bg-[#F4F6F8] py-2.5 text-sm font-semibold text-[#1F2937] transition hover:bg-[#E9EEF2] ${
            collapsed ? 'px-0 text-center' : 'px-3 text-left'
          }`}
        >
          {collapsed ? '⏻' : 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  );
}
