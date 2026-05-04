'use client';

import { WaiterDashboardView } from '@/components/waiter/WaiterDashboardView';
import { useWaiterDashboardViewModel } from '@/lib/viewmodels/useWaiterDashboardViewModel';

export default function WaiterPage() {
  const vm = useWaiterDashboardViewModel();

  return (
    <WaiterDashboardView
      user={vm.user}
      tables={vm.tables}
      pendingRequests={vm.pendingRequests}
      activeTable={vm.activeTable}
      messages={vm.messages}
      text={vm.text}
      onTextChange={(v) => {
        vm.setText(v);
        vm.notifyTyping();
      }}
      typingIndicator={vm.typingIndicator}
      unread={vm.unread}
      onLogout={vm.handleLogout}
      onTakeTable={vm.takeTable}
      onOpenChat={vm.openChat}
      onSendMessage={vm.sendMessage}
      chatSessionUsers={vm.chatSessionUsers}
    />
  );
}
