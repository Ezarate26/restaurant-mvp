import { Suspense } from 'react';
import AppRoomRedirect from '@/app/app/room/[id]/RoomRedirectClient';

export default function AppRoomAliasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] text-sm text-[var(--app-muted)]">
          Redirigiendo…
        </div>
      }
    >
      <AppRoomRedirect />
    </Suspense>
  );
}
