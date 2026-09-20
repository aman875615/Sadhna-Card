import { redirect } from 'next/navigation';

export default async function BrahmachariReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const from = sp.from || '2026-09-01';
  const to = sp.to || '2026-09-15';

  redirect(`/reports?userId=${id}&from=${from}&to=${to}`);
}
