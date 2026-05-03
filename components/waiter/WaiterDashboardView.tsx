'use client';

import { useCallback, useState } from 'react';
import type { Message, Table } from '@/lib/model/types';
import type { User } from '@supabase/supabase-js';
import { BottomTabs } from '@/components/layout/BottomTabs';
import {
  Sidebar,
  type WaiterNavSection,
} from '@/components/layout/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { RequestCard } from '@/components/requests/RequestCard';
import { TableCard } from '@/components/tables/TableCard';
import { WaiterHelpPanel } from '@/components/waiter/WaiterHelpPanel';

export interface WaiterDashboardViewProps {
  user: User | null;
  tables: Table[];
  pendingRequests: Message[];
  activeTable: string | null;
  messages: Message[];
  text: string;
  onTextChange: (value: string) => void;
  unread: Record<string, number>;
  onLogout: () => void;
  onTakeTable: (tableId: string) => void;
  onOpenChat: (tableId: string) => void;
  onSendMessage: () => void;
}

export function WaiterDashboardView({
  user,
  tables,
  pendingRequests,
  activeTable,
  messages,
  text,
  onTextChange,
  unread,
  onLogout,
  onTakeTable,
  onOpenChat,
  onSendMessage,
}: WaiterDashboardViewProps) {
  const [nav, setNav] = useState<WaiterNavSection>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleTakeTable = useCallback(
    (tableId: string) => {
      onTakeTable(tableId);
      setNav('chat');
    },
    [onTakeTable]
  );

  const handleOpenChat = useCallback(
    (tableId: string) => {
      onOpenChat(tableId);
      setNav('chat');
    },
    [onOpenChat]
  );

  const listsPanel = (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-[#F4F6F8] p-4 md:w-[min(100%,24rem)] md:max-w-[26rem] md:shrink-0 md:border-r md:border-[#E5E7EB] md:bg-[#FFFFFF] lg:p-5">
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Solicitudes
        </h2>
        <div className="space-y-3">
          {pendingRequests.length === 0 && (
            <p className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFBFC] px-4 py-8 text-center text-sm text-[#6B7280]">
              Sin solicitudes pendientes
            </p>
          )}
          {pendingRequests.map((r) => (
            <RequestCard key={r.id} request={r} onTakeTable={handleTakeTable} />
          ))}
        </div>
      </section>

      <section className="pb-2">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Mesas
        </h2>
        <div className="space-y-2">
          {tables.map((t) => (
            <TableCard
              key={t.id}
              table={t}
              currentUserId={user?.id}
              unreadCount={unread[t.id] ?? 0}
              isChatActive={activeTable === t.id}
              onOpenChat={handleOpenChat}
            />
          ))}
        </div>
      </section>
    </div>
  );

  const chatPanel = (
    <div className="flex h-full min-h-0 flex-1 flex-col px-0 pb-0 pt-0 md:min-h-0 md:p-4">
      <ChatWindow
        activeTableId={activeTable}
        messages={messages}
        draft={text}
        onDraftChange={onTextChange}
        onSend={onSendMessage}
      />
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] bg-[#F4F6F8] text-[#1F2937]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
        active={nav}
        onNavigate={setNav}
        onLogout={onLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#FFFFFF] px-4 py-3 shadow-sm md:hidden">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
              Panel Mesero
            </p>
            <h1 className="text-base font-bold text-[#229ED9]">Restaurant</h1>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-[#E5E7EB] bg-[#F4F6F8] px-3 py-2 text-xs font-semibold text-[#1F2937] transition hover:bg-[#E9EEF2]"
          >
            Salir
          </button>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[4.5rem] md:pb-0">
          {nav === 'help' ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
              <WaiterHelpPanel />
            </div>
          ) : (
            <>
              {/* Mobile: single pane */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
                {nav === 'home' && listsPanel}
                {nav === 'chat' && (
                  <div className="flex min-h-0 flex-1 flex-col">{chatPanel}</div>
                )}
              </div>

              {/* Desktop: split */}
              <div className="hidden min-h-0 flex-1 md:flex">
                {listsPanel}
                {chatPanel}
              </div>
            </>
          )}
        </main>
      </div>

      <BottomTabs active={nav} onChange={setNav} />
    </div>
  );
}
