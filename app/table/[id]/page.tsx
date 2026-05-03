'use client';

import { useParams } from 'next/navigation';
import { TableChatView } from '@/components/table/TableChatView';
import { useTableChatViewModel } from '@/lib/viewmodels/useTableChatViewModel';

export default function TablePage() {
  const params = useParams();
  const tableId = params.id as string;
  const vm = useTableChatViewModel(tableId);

  return (
    <TableChatView
      tableId={tableId}
      messages={vm.messages}
      message={vm.message}
      onMessageChange={vm.setMessage}
      onSend={vm.sendMessage}
      onCallWaiter={vm.callWaiter}
    />
  );
}
