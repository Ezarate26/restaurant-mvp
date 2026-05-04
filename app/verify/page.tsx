import { redirect } from 'next/navigation';

export default function VerifyLegacyPage() {
  redirect('/verify-email');
}
