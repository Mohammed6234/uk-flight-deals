import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export const runtime = 'nodejs';

interface CreateDealBody {
  origin_airport: string;
  destination_airport: string;
  price_gbp: number;
  link: string;
  airline?: string;
  outbound_dates?: string;
  trip_type?: string;
}

function isValidUrl(u: string): boolean {
  try {
    // URL must include protocol
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CreateDealBody>;

    const origin_airport = (body.origin_airport || '').trim().toUpperCase();
    const destination_airport = (body.destination_airport || '').trim().toUpperCase();
    const price_gbp_num = typeof body.price_gbp === 'number' ? body.price_gbp : Number(body.price_gbp);
    const link = (body.link || '').trim();

    if (!origin_airport) return NextResponse.json({ error: 'origin_airport required' }, { status: 400 });
    if (!destination_airport) return NextResponse.json({ error: 'destination_airport required' }, { status: 400 });
    if (!Number.isFinite(price_gbp_num) || price_gbp_num <= 0) {
      return NextResponse.json({ error: 'price_gbp must be a positive number' }, { status: 400 });
    }
    if (!isValidUrl(link)) return NextResponse.json({ error: 'link must be a valid http(s) URL' }, { status: 400 });

    const insert = {
      origin_airport,
      destination_airport,
      price_gbp: price_gbp_num,
      link,
      airline: body.airline?.trim() || null,
      outbound_dates: body.outbound_dates?.trim() || null,
      trip_type: body.trip_type?.trim() || null,
      is_published: true,
    } as const;

    const { data, error } = await supabaseService
      .from('deals')
      .insert(insert)
      .select('id')
      .single<{ id: string }>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message ?? 'error' }, { status: 500 });
  }
}

