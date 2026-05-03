import { supabase } from './supabase';

export const assignOrder = async (
  orderId: string,
  restaurantId: string
) => {
  // 1. traer meseros del restaurante
  const { data: waiters } = await supabase
    .from('profiles')
    .select('*')
    .eq('restaurant_id', restaurantId);

  // 2. órdenes activas
  const { data: activeOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('status', 'assigned');

  const busyIds = activeOrders?.map(o => o.assigned_to) || [];

  // 3. encontrar libre
  const freeWaiter = waiters?.find(
    w => !busyIds.includes(w.id)
  );

  if (!freeWaiter) return false;

  // 4. asignar orden
  await supabase
    .from('orders')
    .update({
      assigned_to: freeWaiter.id,
      status: 'assigned',
    })
    .eq('id', orderId);

  return true;
};