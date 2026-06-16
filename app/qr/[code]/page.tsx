import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ code: string }>;
};

export default async function QrLegacyRedirect({ params }: PageProps) {
  const { code } = await params;
  redirect(`/join/${encodeURIComponent(code)}`);
}
