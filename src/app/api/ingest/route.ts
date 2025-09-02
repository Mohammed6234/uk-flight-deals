import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import crypto from 'crypto';
import { supabaseService } from '@/lib/supabase';
import type { Deal } from '@/types';

export const runtime = 'nodejs';

interface ExtractedDeal {
  origin_airport: string;
  destination_airport: string;
  price_gbp: number;
  airline?: string | null;
  trip_type?: string | null;
  outbound_dates?: string | null;
  link: string;
}

function isIata3(s: string): boolean {
  return /^[A-Za-z]{3}$/.test(s);
}

function sha1(input: string): string {
  return crypto.createHash('sha1').update(input).digest('hex');
}

export async function POST(_req: NextRequest) {
  try {
    const sources = [
      'https://www.secretflying.com/uk-deals/',
      'https://www.fly4free.com/flight-deals/uk/',
    ];

    const htmls = await Promise.all(
      sources.map(async (url) => {
        const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
        const text = await res.text();
        return { url, html: text.slice(0, 200_000) };
      })
    );

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    const prompt = `You are given some HTML excerpts from public flight deal listings for UK departures.\nExtract a concise JSON object with an array under key 
"deals"; each item has fields:\n- origin_airport (IATA, 3 letters)\n- destination_airport (IATA, 3 letters)\n- price_gbp (integer)\n- airline (optional)\n- trip_type ('return' or 'one-way', default 'return')\n- outbound_dates (short human string like "Nov 10–20" or "Jan–Feb")\n- link (direct deeplink to the deal/post page)\nRules:\n- Only include UK origin airports.\n- Normalize IATA codes to uppercase.\n- Output compact JSON only (no comments).`;

    const parts = htmls
      .map((h) => `SOURCE_URL: ${h.url}\nHTML:\n${h.html}`)
      .join('\n\n---\n\n');

    // Use Chat Completions with JSON mode for broad compatibility
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: parts },
      ],
    });

    const text = completion.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(text) as { deals?: ExtractedDeal[] };
    const items = Array.isArray(parsed.deals) ? parsed.deals : [];

    let inserted = 0;
    for (const d of items) {
      const origin = (d.origin_airport ?? '').toUpperCase().trim();
      const dest = (d.destination_airport ?? '').toUpperCase().trim();
      const price = Number(d.price_gbp);
      const link = (d.link ?? '').trim();

      if (!isIata3(origin) || !isIata3(dest) || !Number.isFinite(price) || !link) continue;

      const dealRow: Deal = {
        origin_airport: origin,
        destination_airport: dest,
        price_gbp: Math.round(price),
        airline: d.airline ?? null,
        trip_type: (d.trip_type ?? 'return') as Deal['trip_type'],
        outbound_dates: d.outbound_dates ?? null,
        link,
        source: sources.find((s) => link.includes(new URL(s).hostname)) ?? 'openai-extract',
        is_published: true,
      };

      // Upsert primarily on link. If link isn't unique in your DB, consider adding a unique index.
      const { error } = await supabaseService
        .from('deals')
        .upsert(dealRow, { onConflict: 'link', ignoreDuplicates: false });

      if (!error) inserted += 1;
    }

    return NextResponse.json({ ok: true, inserted });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
