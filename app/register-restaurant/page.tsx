import { redirect } from 'next/navigation';

export default function RegisterRestaurantLegacyRedirect() {
  redirect('/create');
}
