'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { resolveQrCode } from '@/lib/model/qr-entries.repository';
import { TableChatView } from '@/components/table/TableChatView';
import { SessionUsersList } from '@/components/session/SessionUsersList';
import { CustomerPreorderView } from '@/components/customer/CustomerPreorderView';
import { CustomerLoginModal } from '@/components/customer/CustomerLoginModal';
import { useCustomerChatViewModel } from '@/lib/viewmodels/useCustomerChatViewModel';

type StatusBannerProps = {
  kind: 'error' | 'success';
  message: string;
};

function StatusBanner({ kind, message }: StatusBannerProps) {
  const base =
    kind === 'error'
      ? 'fixed inset-x-0 top-0 z-10 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900'
      : 'fixed inset-x-0 top-0 z-[90] border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-900';
  const role = kind === 'error' ? 'alert' : 'status';
  return (
    <div className={base} role={role}>
      {message}
    </div>
  );
}

function CenterNotice({ message, detail }: { message: string; detail?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#F4F6F8] px-6 text-center">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-8 shadow-sm">
        <p className="text-base font-semibold text-[#1F2937]">{message}</p>
        {detail && <p className="mt-2 text-sm text-[#6B7280]">{detail}</p>}
      </div>
    </div>
  );
}

export default function QrEntryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = (params.code as string) ?? '';
  const lang = searchParams.get('lang');
  const autoOpenChatAfterLoad = searchParams.get('open_chat') === '1';

  const [servicePointId, setServicePointId] = useState<string | null>(null);
  const [preferredSessionId, setPreferredSessionId] = useState<string | null>(
    null
  );
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResolveError(null);
    setServicePointId(null);
    setPreferredSessionId(null);
    void (async () => {
      const resolved = await resolveQrCode(supabase, code);
      if (cancelled) return;
      if (!resolved) {
        setResolveError('Código QR no válido');
        return;
      }
      setServicePointId(resolved.servicePoint.id);
      setPreferredSessionId(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (resolveError) {
    return (
      <CenterNotice
        message={resolveError}
        detail="Pide a un mesero que te dé el código correcto."
      />
    );
  }

  if (!servicePointId) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F4F6F8] text-sm text-[#6B7280]">
        Resolviendo punto de servicio…
      </div>
    );
  }

  return (
    <CustomerChatBound
      qrCode={code}
      servicePointId={servicePointId}
      preferredSessionId={preferredSessionId}
      initialLanguageHint={lang}
      autoOpenChatAfterLoad={autoOpenChatAfterLoad}
    />
  );
}

function CustomerChatBound({
  qrCode,
  servicePointId,
  preferredSessionId,
  initialLanguageHint,
  autoOpenChatAfterLoad = false,
}: {
  qrCode: string;
  servicePointId: string;
  preferredSessionId: string | null;
  initialLanguageHint: string | null;
  autoOpenChatAfterLoad?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customerLoginOpen, setCustomerLoginOpen] = useState(false);
  const autoOpenLoginAfterLoad = searchParams.get('open_login') === '1';
  const loginEmail = searchParams.get('login_email')?.trim() ?? '';
  const loginIntroMessage =
    (autoOpenLoginAfterLoad && 'Cuenta creada correctamente. Inicia sesión para continuar.') ||
    null;

  const createAccountHref = (() => {
    const q = new URLSearchParams();
    q.set('return_point', servicePointId);
    q.set('return_qr', qrCode);
    if (preferredSessionId?.trim()) {
      q.set('return_session', preferredSessionId.trim());
    }
    return `/complete-profile?${q.toString()}`;
  })();

  const clearCustomerUrlAfterSessionEnd = useCallback(() => {
    const l = searchParams.get('lang');
    const base = `/qr/${encodeURIComponent(qrCode)}`;
    router.replace(
      l ? `${base}?lang=${encodeURIComponent(l)}` : base
    );
  }, [router, qrCode, searchParams]);

  const vm = useCustomerChatViewModel({
    servicePointId,
    preferredSessionId,
    initialLanguageHint,
    autoOpenChatAfterLoad,
    clearCustomerUrlAfterSessionEnd,
  });

  if (vm.isLoading) {
    return (
      <CenterNotice message="Preparando tu visita…" />
    );
  }

  if (vm.error && !vm.point) {
    return <CenterNotice message={vm.error} />;
  }

  if (!vm.chatActive) {
    return (
      <>
        {vm.error && <StatusBanner kind="error" message={vm.error} />}
        {vm.profileNotice && <StatusBanner kind="success" message={vm.profileNotice} />}
        <CustomerPreorderView
          placeName={vm.headerLabel}
          selectedLanguage={vm.selectedLanguage}
          onSelectLanguage={vm.selectLanguage}
          onOrderNow={() => void vm.confirmEnterChat()}
          isConfirming={vm.isConfirmingChat}
          languageControlsDisabled={!vm.point}
          createAccountHref={createAccountHref}
          onSubmitLogin={(email, password) =>
            vm.loginCustomerAccount(email, password)
          }
          loginSubmitBusy={vm.loginBusy}
          autoOpenLogin={autoOpenLoginAfterLoad}
          loginInitialEmail={loginEmail}
          loginIntroMessage={loginIntroMessage}
        />
      </>
    );
  }

  return (
    <>
      {vm.profileNotice && <StatusBanner kind="success" message={vm.profileNotice} />}
      <TableChatView
        tableId={vm.session?.id ?? servicePointId}
        headerLabel={vm.headerLabel}
        messages={vm.messages}
        message={vm.text}
        onMessageChange={(v) => {
          vm.setText(v);
          vm.notifyTyping();
        }}
        onSend={vm.sendMessage}
        onCallWaiter={vm.callWaiter}
        composerDisabled={vm.chatComposerDisabled}
        closureBanner={vm.closureBanner}
        onLeaveChat={vm.closeSessionForEveryone}
        leaveChatBusy={vm.leaveChatBusy}
        showStartNewSession={vm.showStartNewSession}
        newSessionBusy={vm.newSessionBusy}
        onStartNewSession={() => void vm.startNewSessionAfterClose()}
        currentSessionUserId={vm.sessionUser?.id ?? null}
        viewerLanguage={vm.sessionUser?.language ?? vm.selectedLanguage ?? 'es'}
        lastReadAt={vm.lastReadAt}
        typingIndicator={vm.typingIndicator}
        onMessagesScroll={vm.handleMessagesScroll}
        sessionUsers={vm.sessionUsers}
        waiterIncomingBubbleLabel={vm.assignedStaffHeader}
        usersSlot={
          <SessionUsersList
            sessionUsers={vm.sessionUsers}
            currentSessionUserId={vm.sessionUser?.id ?? null}
          />
        }
      />
      <CustomerLoginModal
        open={customerLoginOpen}
        onOpenChange={(open) => {
          setCustomerLoginOpen(open);
        }}
        introMessage={null}
        busy={vm.loginBusy}
        onSubmit={(email, password) =>
          vm.loginCustomerAccount(email, password)
        }
      />
    </>
  );
}
