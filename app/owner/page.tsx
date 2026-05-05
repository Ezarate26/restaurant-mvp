'use client';

import { OwnerDashboardView } from '@/components/owner/OwnerDashboardView';
import { useOwnerDashboardViewModel } from '@/lib/viewmodels/useOwnerDashboardViewModel';

export default function OwnerPage() {
  const vm = useOwnerDashboardViewModel();

  if (!vm.user || !vm.restaurantId) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F4F6F8] text-sm text-[#6B7280]">
        Cargando panel…
      </div>
    );
  }

  return (
    <OwnerDashboardView
      user={vm.user}
      restaurant={vm.restaurant}
      servicePoints={vm.servicePoints}
      sessions={vm.sessions}
      dashboardSessions={vm.dashboardSessions}
      serviceRequests={vm.serviceRequests}
      sessionUsers={vm.sessionUsers}
      sessionUsersBySession={vm.sessionUsersBySession}
      pendingBySession={vm.pendingBySession}
      profilesById={vm.profilesById}
      pointsById={vm.pointsById}
      lastMessageBySession={vm.lastMessageBySession}
      onLogout={vm.handleLogout}
    />
  );
}
