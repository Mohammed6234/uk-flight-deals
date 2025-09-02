import { supabasePublic } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default async function Home() {
  const { data: deals } = await supabasePublic
    .from('deals')
    .select('*')
    .eq('is_published', true)
    .order('price_gbp', { ascending: true })
    .limit(50);

  return (
    <main>
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/80 to-transparent dark:from-indigo-950/40 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8">
          <div className="flex flex-col gap-4 max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">Find the best UK flight deals</h1>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Sub-£300 long-haul and standout short-haul from UK airports.
              Curated and delivered straight to your inbox.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/subscribe"><Button size="lg">Get email alerts</Button></Link>
              <a href="#deals"><Button variant="secondary" size="lg">Browse latest</Button></a>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Badge tone="info">Real deals</Badge>
              <span>·</span>
              <span>Updated daily</span>
              <span>·</span>
              <span>No spam</span>
            </div>
          </div>
        </div>
      </section>

      <section id="deals" className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-semibold">Latest deals</h2>
          <p className="text-sm text-gray-500">{deals?.length ?? 0} found</p>
        </div>

        {!deals?.length ? (
          <Card>
            <CardHeader>
              <h3 className="text-base font-medium">No deals yet</h3>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 dark:text-gray-400">
              Check back soon or subscribe to get notified when new deals drop.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals?.map((d) => (
              <Card key={d.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-gray-500">{d.origin_airport} → {d.destination_airport}</div>
                      <div className="mt-1 text-2xl font-semibold tracking-tight">£{d.price_gbp}</div>
                    </div>
                    <Badge tone="info" className="whitespace-nowrap">{d.trip_type ?? 'return'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {d.airline || 'Airline TBC'}{d.outbound_dates ? ` · ${d.outbound_dates}` : ''}
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={d.link} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="secondary">View deal</Button>
                    </a>
                    <Link href="/subscribe">
                      <Button size="sm" variant="ghost">Get alerts</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
