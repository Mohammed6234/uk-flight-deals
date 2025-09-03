import { supabasePublic } from '@/lib/supabase';
import Link from 'next/link';
import { airportDisplay, imagePathForIata } from '@/lib/airports';

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
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <section className="text-center space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Find brilliant UK flight deals</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Choose your departure airport to see the cheapest months and routes — fast, simple, no fluff.</p>
      </section>

      {bestDeal && (
        <section className="rounded-2xl overflow-hidden border">
          <div className="p-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-xs uppercase tracking-wide text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">Top deal today</span>
            <span className="font-semibold">£{bestDeal.price_gbp}</span>
            <span>· {bestDeal.origin_airport} → {bestDeal.destination_airport}</span>
            <span>· {(bestDeal.trip_type ?? 'return')}</span>
            {bestDeal.outbound_dates && <span>· {bestDeal.outbound_dates}</span>}
            <a href={bestDeal.link ?? '#'} target="_blank" rel="noreferrer" className="ml-auto underline">Open deal</a>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium mb-3">Airports</h2>
        {unique.length === 0 ? (
          <p className="text-sm text-gray-600">No deals at the moment — check back soon or <Link href="/subscribe" className="underline">get alerts</Link>.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unique.map((origin) => {
              const title = airportDisplay(origin);
              const img = imagePathForIata(origin);
              return (
                <li key={origin} className="rounded-xl overflow-hidden border group">
                  <Link href={`/airports/${origin}`} className="block">
                    <div className="relative h-40 w-full bg-black/5">
                      <img src={img} alt={title} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 text-white drop-shadow-sm flex items-center justify-between">
                        <div>
                          <div className="text-lg font-semibold">{title}</div>
                          <div className="text-xs opacity-90">{origin}</div>
                        </div>
                        <div className="text-xs opacity-90 underline">View deals</div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
