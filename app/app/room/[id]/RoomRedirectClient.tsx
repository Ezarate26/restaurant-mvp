'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

function AppRoomRedirect() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    const target = `/c/${params.id}${qs ? `?${qs}` : ''}`;
    router.replace(target);
  }, [params.id, router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] text-sm text-[var(--app-muted)]">
      Redirigiendo a la sala…
    </div>
  );
}

export default AppRoomRedirect;
