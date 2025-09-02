import { supabasePublic } from '@/lib/supabase';
import Link from 'next/link';

export default async function Airports() {
  await supabasePublic
    .from('deals')
    .select('origin_airport', { count: 'exact', head: true })
    .eq('is_published', true);

  const { data: origins } = await supabasePublic
    .from('deals')
    .select('origin_airport')
    .eq('is_published', true)
    .order('origin_airport', { ascending: true });

  const unique = Array.from(new Set((origins ?? []).map((d) => d.origin_airport))).map((origin) => ({
    origin_airport: origin as string,
  }));

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">UK Airports with Deals</h1>
      <ul className="grid sm:grid-cols-2 gap-3">
        {unique.map(({ origin_airport }) => (
          <li key={origin_airport} className="border rounded p-3">
            <Link href={`/airports/${origin_airport}`} className="font-medium underline">
              {origin_airport}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

