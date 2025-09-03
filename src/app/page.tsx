import { supabasePublic } from '@/lib/supabase';
import Link from 'next/link';

export default async function Home() {
  // Best single deal (cheapest published)
  const { data: bestDeal } = await supabasePublic
    .from('deals')
    .select('id, origin_airport, destination_airport, price_gbp, airline, trip_type, outbound_dates, link')
    .eq('is_published', true)
    .order('price_gbp', { ascending: true })
    .limit(1)
    .single();

  // Airports list (unique origins)
  await supabasePublic
    .from('deals')
    .select('origin_airport', { count: 'exact', head: true })
    .eq('is_published', true);

  const { data: origins } = await supabasePublic
    .from('deals')
    .select('origin_airport')
    .eq('is_published', true)
    .order('origin_airport', { ascending: true });

  const unique = Array.from(new Set((origins ?? []).map((d) => d.origin_airport))).filter(Boolean) as string[];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">UK Airports with Deals</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Pick your departure airport to explore months and destinations.</p>
      </section>

      {bestDeal && (
        <section className="border rounded-xl p-4 bg-white/50 dark:bg-black/30">
          <h2 className="text-lg font-medium mb-2">Top deal today</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">£{bestDeal.price_gbp}</span>
            <span>· {bestDeal.origin_airport} → {bestDeal.destination_airport}</span>
            <span>· {(bestDeal.trip_type ?? 'return')}</span>
            {bestDeal.outbound_dates && <span>· {bestDeal.outbound_dates}</span>}
            <a href={bestDeal.link ?? '#'} target="_blank" rel="noreferrer" className="underline ml-auto">Open deal</a>
          </div>
        </section>
      )}

      <section>
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {unique.map((origin) => (
            <li key={origin} className="border rounded p-3">
              <Link href={`/airports/${origin}`} className="font-medium underline">
                {origin}
              </Link>
            </li>
          ))}
          {unique.length === 0 && <li className="text-sm text-gray-600">No airports yet – check back soon.</li>}
        </ul>
      </section>
    </main>
  );
}
