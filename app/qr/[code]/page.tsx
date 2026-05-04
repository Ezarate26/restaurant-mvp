'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { resolveQrCode } from '@/lib/model/qr-entries.repository';
import { TableChatView } from '@/components/table/TableChatView';
import { SessionUsersList } from '@/components/session/SessionUsersList';
import { CustomerPreorderView } from '@/components/customer/CustomerPreorderView';
import { useCustomerChatViewModel } from '@/lib/viewmodels/useCustomerChatViewModel';
import { shouldPromptOptionalProfile } from '@/lib/utils/session-user-profile';

export default function QrEntryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = (params.code as string) ?? '';
  const lang = searchParams.get('lang');

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
      setPreferredSessionId(resolved.sessionId ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (resolveError) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F4F6F8] px-6 text-center">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-8 shadow-sm">
          <p className="text-base font-semibold text-[#1F2937]">{resolveError}</p>
          <p className="mt-2 text-sm text-[#6B7280]">
            Pide a un mesero que te dé el código correcto.
          </p>
        </div>
      </div>
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
      servicePointId={servicePointId}
      preferredSessionId={preferredSessionId}
      initialLanguageHint={lang}
    />
  );
}

function CustomerChatBound({
  servicePointId,
  preferredSessionId,
  initialLanguageHint,
}: {
  servicePointId: string;
  preferredSessionId: string | null;
  initialLanguageHint: string | null;
}) {
  const [optionalProfileEditorOpen, setOptionalProfileEditorOpen] =
    useState(false);
  const vm = useCustomerChatViewModel({
    servicePointId,
    preferredSessionId,
    initialLanguageHint,
  });

  if (vm.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F4F6F8] text-sm text-[#6B7280]">
        Preparando tu visita…
      </div>
    );
  }

  if (vm.error && !vm.session) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F4F6F8] px-6 text-center">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-8 shadow-sm">
          <p className="text-base font-semibold text-[#1F2937]">{vm.error}</p>
        </div>
      </div>
    );
  }

  if (!vm.chatActive) {
    return (
      <>
        {vm.error && (
          <div
            className="fixed inset-x-0 top-0 z-10 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900"
            role="alert"
          >
            {vm.error}
          </div>
        )}
        <CustomerPreorderView
          placeName={vm.headerLabel}
          selectedLanguage={vm.selectedLanguage}
          onSelectLanguage={vm.selectLanguage}
          onOrderNow={() => void vm.confirmEnterChat()}
          isConfirming={vm.isConfirmingChat}
          languageControlsDisabled={!vm.sessionUser}
          profileDisplayName={vm.profileDraft.displayName}
          profileUsername={vm.profileDraft.username}
          profileEmail={vm.profileDraft.email}
          onProfileDisplayNameChange={(value) => {
            vm.setProfileDraft((prev) => ({ ...prev, displayName: value }));
            vm.setProfileNotice(null);
          }}
          onProfileUsernameChange={(value) => {
            vm.setProfileDraft((prev) => ({ ...prev, username: value }));
            vm.setProfileNotice(null);
          }}
          onProfileEmailChange={(value) => {
            vm.setProfileDraft((prev) => ({ ...prev, email: value }));
            vm.setProfileNotice(null);
          }}
          profileNotice={vm.profileNotice}
        />
      </>
    );
  }

  const profilePromptActive = shouldPromptOptionalProfile(vm.sessionUser);

  return (
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
      currentSessionUserId={vm.sessionUser?.id ?? null}
      lastReadAt={vm.lastReadAt}
      typingIndicator={vm.typingIndicator}
      onMessagesScroll={vm.handleMessagesScroll}
      profilePromptActive={profilePromptActive}
      optionalProfileEditorOpen={optionalProfileEditorOpen}
      onOptionalProfileEditorOpenChange={setOptionalProfileEditorOpen}
      profileDisplayName={vm.profileDraft.displayName}
      profileUsername={vm.profileDraft.username}
      profileEmail={vm.profileDraft.email}
      onProfileDisplayNameChange={(value) => {
        vm.setProfileDraft((prev) => ({ ...prev, displayName: value }));
        vm.setProfileNotice(null);
      }}
      onProfileUsernameChange={(value) => {
        vm.setProfileDraft((prev) => ({ ...prev, username: value }));
        vm.setProfileNotice(null);
      }}
      onProfileEmailChange={(value) => {
        vm.setProfileDraft((prev) => ({ ...prev, email: value }));
        vm.setProfileNotice(null);
      }}
      profileNotice={vm.profileNotice}
      onSaveProfile={() => void vm.saveOptionalProfile()}
      sessionUsers={vm.sessionUsers}
      usersSlot={
        <SessionUsersList
          sessionUsers={vm.sessionUsers}
          currentUserIdentifier={vm.sessionUser?.user_identifier ?? null}
        />
      }
    />
  );
}
