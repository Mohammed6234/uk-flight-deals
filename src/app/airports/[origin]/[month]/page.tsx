import { supabasePublic } from '@/lib/supabase';
import { destinationBlurb } from '@/lib/destinations';
import { imagePathForIata } from '@/lib/airports';

export default async function DealsByMonth({ params }: { params: { origin: string; month: string } }) {
  const origin = params.origin.toUpperCase();
  const month = params.month;

  const { data: deals } = await supabasePublic
    .from('deals')
    .select('id, destination_airport, price_gbp, airline, trip_type, outbound_dates, link')
    .eq('is_published', true)
    .eq('origin_airport', origin)
    .ilike('outbound_dates', `%${month}%`)
    .order('price_gbp', { ascending: true });

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        {origin} · {month}
      </h1>
      {(deals ?? []).map((d) => {
        const img = imagePathForIata(d.destination_airport as string);
        const blurb = destinationBlurb(d.destination_airport as string);
        return (
          <article key={d.id} className="border rounded overflow-hidden">
            <img src={img} alt={d.destination_airport as string} className="w-full h-56 object-cover" />
            <div className="p-4">
              <h2 className="text-lg font-semibold">
                {origin} → {d.destination_airport} · £{d.price_gbp}
              </h2>
              <p className="text-sm text-gray-600">
                {(d.airline as string | null) ?? 'Airline TBC'} · {(d.trip_type as string | null) ?? 'return'} · {(d.outbound_dates as string | null) ?? 'flexible'}
              </p>
              <p className="mt-2 text-sm">{blurb}</p>
              <a href={d.link as string} target="_blank" rel="noreferrer" className="inline-block mt-3 underline">
                Open deal
              </a>
            </div>
          </article>
        );
      })}
      {(!deals || deals.length === 0) && <p>No deals found for {month}.</p>}
    </main>
  );
}
