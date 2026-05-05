'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Message, ServiceSession, SessionUser } from '@/lib/model/types';
import type { PendingTableRequestView as PendingTableRequest } from '@/lib/adapters/pending-table-request.types';
import type { TableView as Table } from '@/lib/adapters/table-view.types';
import type { User } from '@supabase/supabase-js';
import { BottomTabs } from '@/components/layout/BottomTabs';
import {
  Sidebar,
  type WaiterNavSection,
} from '@/components/layout/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { RequestCard } from '@/components/requests/RequestCard';
import { TableCard } from '@/components/tables/TableCard';
import { FinalizeSessionModal } from '@/components/waiter/FinalizeSessionModal';
import { WaiterHelpPanel } from '@/components/waiter/WaiterHelpPanel';

export interface WaiterDashboardViewProps {
  user: User | null;
  /** Sesiones activas del restaurante (evita race al tomar mesa vs. `tables` filtradas). */
  restaurantSessions?: ServiceSession[];
  tables: Table[];
  /** Nombre legible por `session_id` para solicitudes de mesas que aún no están en `tables`. */
  pendingSessionLabels?: Record<string, string>;
  pendingRequests: PendingTableRequest[];
  activeTable: string | null;
  messages: Message[];
  text: string;
  onTextChange: (value: string) => void;
  unread: Record<string, number>;
  onLogout: () => void;
  onTakeTable: (tableId: string) => void | Promise<void>;
  onOpenChat: (tableId: string) => void | Promise<void>;
  onSendMessage: () => void;
  typingIndicator?: string | null;
  chatSessionUsers?: SessionUser[];
  onFinalizeSession?: () => Promise<void>;
  finalizeSessionBusy?: boolean;
  waiterToastMessage?: string | null;
}

export function WaiterDashboardView({
  user,
  restaurantSessions = [],
  tables,
  pendingSessionLabels = {},
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
  typingIndicator = null,
  chatSessionUsers = [],
  onFinalizeSession,
  finalizeSessionBusy = false,
  waiterToastMessage = null,
}: WaiterDashboardViewProps) {
  const [nav, setNav] = useState<WaiterNavSection>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [vh, setVh] = useState(0);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [takeTableLoading, setTakeTableLoading] = useState(false);

  useEffect(() => {
    const updateHeight = () => {
      setVh(window.visualViewport?.height || window.innerHeight);
    };

    updateHeight();
    window.visualViewport?.addEventListener('resize', updateHeight);
    window.addEventListener('resize', updateHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight);
      window.removeEventListener('resize', updateHeight);
    };
  }, []);
  const totalUnread = useMemo(() => {
    if (!user?.id) return 0;

    return tables.reduce((total, table) => {
      const isAssignedToCurrentUser = table.assigned_to === user.id;
      const isActiveTable = table.id === activeTable;

      if (!isAssignedToCurrentUser || isActiveTable) return total;
      return total + (unread[table.id] ?? 0);
    }, 0);
  }, [activeTable, tables, unread, user?.id]);

  const handleTakeTable = useCallback(
    async (tableId: string) => {
      setTakeTableLoading(true);
      try {
        await onTakeTable(tableId);
        setNav('chat');
      } finally {
        setTakeTableLoading(false);
      }
    },
    [onTakeTable]
  );

  const handleOpenChat = useCallback(
    async (tableId: string) => {
      await onOpenChat(tableId);
      setNav('chat');
    },
    [onOpenChat]
  );

  const handleMobileSecondaryAction = useCallback(() => {
    // Placeholder for upcoming mobile secondary routes/actions.
    setIsMenuOpen(false);
  }, []);

  const handleMobileLogout = useCallback(() => {
    setIsMenuOpen(false);
    onLogout();
  }, [onLogout]);

  /** Una card por mesa (ya agregado en el viewmodel). */
  const requestQueue = pendingRequests;

  /** Mesas asignadas al mesero actual (el viewmodel ya no envía otras sesiones). */
  const mesasList = useMemo(() => {
    return [...tables].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [tables]);

  const unreadForTable = useCallback(
    (tableId: string, assignedTo: string | null | undefined) => {
      if (!user?.id || assignedTo !== user.id) return 0;
      return unread[tableId] ?? 0;
    },
    [unread, user?.id]
  );

  const activeTableDisplayName = useMemo(() => {
    if (!activeTable) return null;
    return tables.find((t) => t.id === activeTable)?.name ?? null;
  }, [activeTable, tables]);

  /** Sin mesa activa → volver a inicio (móvil). Al finalizar desde mesero o cliente. */
  useEffect(() => {
    if (!activeTable) {
      setNav((prev) => (prev === 'chat' ? 'home' : prev));
      setFinalizeModalOpen(false);
      return;
    }
    const sessionStillActive = restaurantSessions.some((s) => s.id === activeTable);
    if (!sessionStillActive) {
      setNav('home');
      setFinalizeModalOpen(false);
    }
  }, [activeTable, restaurantSessions]);

  const listsPanel = (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-[#F4F6F8] p-4 md:w-[min(100%,24rem)] md:max-w-[26rem] md:shrink-0 md:border-r md:border-[#E5E7EB] md:bg-[#FFFFFF] lg:p-5">
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Solicitudes
        </h2>
        <div className="space-y-3">
          {requestQueue.length === 0 && (
            <p className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFBFC] px-4 py-8 text-center text-sm text-[#6B7280]">
              Sin solicitudes pendientes
            </p>
          )}
          {requestQueue.map((r) => {
            const tableLabel =
              tables.find((t) => t.id === r.table_id)?.name ??
              pendingSessionLabels[r.table_id] ??
              r.table_id;
            return (
              <RequestCard
                key={r.table_id}
                request={r}
                tableLabel={tableLabel}
                onTakeTable={handleTakeTable}
              />
            );
          })}
        </div>
      </section>

      <section className="pb-2">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Mesas
        </h2>
        <div className="space-y-2">
          {mesasList.length === 0 && (
            <p className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFBFC] px-4 py-8 text-center text-sm text-[#6B7280]">
              No hay mesas en sala
            </p>
          )}
          {mesasList.map((t) => (
            <TableCard
              key={t.id}
              table={t}
              currentUserId={user?.id}
              unreadCount={unreadForTable(t.id, t.assigned_to)}
              isChatActive={activeTable === t.id}
              onOpenChat={handleOpenChat}
            />
          ))}
        </div>
      </section>
    </div>
  );

  const chatPanel = (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden px-0 pb-0 pt-0 md:p-4">
      {activeTable && onFinalizeSession ? (
        <div className="shrink-0 border-b border-[#E5E7EB] bg-white px-3 py-2 md:rounded-t-xl md:border md:border-b-0 md:border-[#E5E7EB]">
          <button
            type="button"
            onClick={() => setFinalizeModalOpen(true)}
            disabled={finalizeSessionBusy}
            className="w-full rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-sm font-semibold text-[#B91C1C] shadow-sm transition hover:bg-[#FEE2E2] disabled:opacity-50"
          >
            Finalizar atención
          </button>
        </div>
      ) : null}
      <ChatWindow
        activeTableId={activeTable}
        activeTableName={activeTableDisplayName}
        messages={messages}
        currentUserType="waiter"
        draft={text}
        onDraftChange={onTextChange}
        onSend={onSendMessage}
        typingIndicator={typingIndicator}
        sessionUsers={chatSessionUsers}
      />
      <FinalizeSessionModal
        open={finalizeModalOpen}
        tableName={activeTableDisplayName}
        sessionUsers={chatSessionUsers}
        confirming={finalizeSessionBusy}
        onCancel={() => setFinalizeModalOpen(false)}
        onConfirm={async () => {
          try {
            await onFinalizeSession?.();
            setFinalizeModalOpen(false);
          } catch {
            /* permanece abierto para reintentar */
          }
        }}
      />
    </div>
  );

  return (
    <div
      className="relative flex h-screen overflow-hidden bg-[#F4F6F8] text-[#1F2937]"
      aria-busy={takeTableLoading}
    >
      {takeTableLoading ? (
        <div
          className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-white/85 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-labelledby="take-table-loading-title"
        >
          <div
            className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#E3F2FD] border-t-[#229ED9]"
            aria-hidden
          />
          <p
            id="take-table-loading-title"
            className="mt-5 max-w-xs text-center text-sm font-semibold text-[#1F2937]"
          >
            Tomando mesa…
          </p>
          <p className="mt-1 max-w-xs text-center text-xs text-[#6B7280]">
            Un momento
          </p>
        </div>
      ) : null}
      {waiterToastMessage ? (
        <div
          className="pointer-events-none fixed bottom-20 left-1/2 z-[1300] max-w-sm -translate-x-1/2 rounded-xl border border-[#BBF7D0] bg-[#DCFCE7] px-4 py-2.5 text-center text-sm font-medium text-[#166534] shadow-lg md:bottom-8"
          role="status"
        >
          {waiterToastMessage}
        </div>
      ) : null}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
        active={nav}
        onNavigate={setNav}
        onLogout={onLogout}
      />

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="fixed left-4 top-4 z-[1100] flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] text-[#1F2937] shadow-sm transition hover:bg-[#F4F6F8] md:hidden"
          aria-label={isMenuOpen ? 'Cerrar menú secundario' : 'Abrir menú secundario'}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-secondary-drawer"
        >
          <span className="text-xl leading-none" aria-hidden>
            {isMenuOpen ? '✕' : '☰'}
          </span>
        </button>

        <header className="flex items-center justify-center border-b border-[#E5E7EB] bg-[#FFFFFF] px-4 py-3 shadow-sm md:hidden">
          <div className="pl-10">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
              Panel Mesero
            </p>
            <h1 className="text-base font-bold text-[#229ED9]">Restaurant</h1>
          </div>
        </header>

        <main className="flex h-full min-h-0 flex-1 flex-col overflow-hidden pb-[4.5rem] md:pb-0">
          {nav === 'help' ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6">
              <WaiterHelpPanel />
            </div>
          ) : (
            <>
              {/* Mobile: single pane */}
              <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden md:hidden">
                {nav === 'home' && listsPanel}
                {nav === 'chat' && (
                  <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                    {chatPanel}
                  </div>
                )}
              </div>

              {/* Desktop: split */}
              <div className="hidden h-full min-h-0 flex-1 overflow-hidden md:flex">
                {listsPanel}
                {chatPanel}
              </div>
            </>
          )}
        </main>
      </div>

      <div
        className={`fixed inset-0 bg-black/40 z-[900] transition-opacity md:hidden ${
          isMenuOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden={!isMenuOpen}
      />
      <aside
        id="mobile-secondary-drawer"
        className={`fixed left-0 top-0 w-72 z-[1000] flex transform flex-col overflow-hidden bg-white shadow-lg transition-transform duration-300 md:hidden ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ height: vh }}
        aria-hidden={!isMenuOpen}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex-1 space-y-2 overflow-y-auto p-4 pt-16">
            <p className="px-3 pt-1 text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">
              Próximamente
            </p>
            <button
              type="button"
              onClick={handleMobileSecondaryAction}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#1F2937] transition hover:bg-[#F4F6F8]"
            >
              <span className="text-lg leading-none" aria-hidden>
                👤
              </span>
              <span>Perfil</span>
            </button>
            <button
              type="button"
              onClick={handleMobileSecondaryAction}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#1F2937] transition hover:bg-[#F4F6F8]"
            >
              <span className="text-lg leading-none" aria-hidden>
                📋
              </span>
              <span>Historial del día</span>
            </button>
          </div>

          <div className="border-t border-[#E5E7EB] bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={handleMobileLogout}
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#F4F6F8] px-3 py-2.5 text-left text-sm font-semibold text-[#1F2937] transition hover:bg-[#E9EEF2]"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <BottomTabs active={nav} onChange={setNav} chatUnreadCount={totalUnread} />
    </div>
  );
}
