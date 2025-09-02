import { supabasePublic } from '@/lib/supabase';
import { extractMonths, MonthAbbrev } from '@/lib/months';
import Link from 'next/link';

export default async function AirportMonths({ params }: { params: { origin: string } }) {
  const origin = params.origin.toUpperCase();
  const { data: deals } = await supabasePublic
    .from('deals')
    .select('outbound_dates')
    .eq('is_published', true)
    .eq('origin_airport', origin);

  const months = new Set<MonthAbbrev>();
  for (const d of deals ?? []) {
    extractMonths(d.outbound_dates as string | null).forEach((m) => months.add(m));
  }

  const arr = Array.from(months);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{origin} — Months with Deals</h1>
      {arr.length === 0 ? (
        <p>No months detected yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {arr.map((m) => (
            <li key={m}>
              <Link href={`/airports/${origin}/${m}`} className="border rounded px-3 py-1">
                {m}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

