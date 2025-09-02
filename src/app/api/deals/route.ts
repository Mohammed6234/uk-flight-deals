import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase';

export const runtime = 'nodejs';

export interface DealListItem {
  id: string;
  origin_airport: string;
  destination_airport: string;
  price_gbp: number;
  outbound_dates: string | null;
}

export async function GET() {
  const { data, error } = await supabasePublic
    .from('deals')
    .select('id, origin_airport, destination_airport, price_gbp, outbound_dates')
    .eq('is_published', true)
    .order('found_at', { ascending: false })
    .limit(50)
    .returns<DealListItem[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

