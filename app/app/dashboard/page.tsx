import { redirect } from 'next/navigation';
import { AUTH_HOME_PATH } from '@/lib/constants/routes';

export default function DashboardRedirectPage() {
  redirect(AUTH_HOME_PATH);
}
