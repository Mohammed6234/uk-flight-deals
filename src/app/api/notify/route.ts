// src/app/api/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabaseService } from '@/lib/supabase';

export const runtime = 'nodejs';

const reqd = (k: string): string => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env: ${k}`);
  return v;
};

// Shape of a subscriber row we expect from Supabase
interface Subscriber {
  email: string | null;
}

// Shape of a deal row we expect from Supabase
interface Deal {
  id: string;
  origin_airport: string;
  destination_airport: string;
  price_gbp: number;
  airline?: string | null;
  trip_type?: string | null;
  outbound_dates?: string | null;
  link?: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const { dealId } = (await req.json()) as { dealId?: string };
    if (!dealId) {
      return NextResponse.json({ error: 'dealId required' }, { status: 400 });
    }

    // Load deal
    const { data: deal, error: dealErr } = await supabaseService
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single<Deal>();

    if (dealErr || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Load subscribers
    const { data: subs, error: subsErr } = await supabaseService
      .from('subscribers')
      .select('email')
      .returns<Subscriber[]>();

    if (subsErr) {
      return NextResponse.json({ error: subsErr.message }, { status: 500 });
    }

    const recipients = (subs ?? [])
      .map((s) => s.email)
      .filter((e): e is string => typeof e === 'string' && e.includes('@'));

    if (recipients.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: reqd('SMTP_HOST'),
      port: Number(reqd('SMTP_PORT')),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: reqd('SMTP_USER'),
        pass: reqd('SMTP_PASS'),
      },
    });

    const fromName = process.env.ALERTS_FROM_NAME || 'UK Flight Deals';
    const fromEmail = process.env.ALERTS_FROM_EMAIL || process.env.SMTP_USER!;
    const from = `${fromName} <${fromEmail}>`;

    const subject = `£${deal.price_gbp} ${deal.origin_airport} → ${deal.destination_airport} (${deal.trip_type ?? 'return'})`;
    const html = `
      <h2>🔥 New UK flight deal</h2>
      <p><strong>Route:</strong> ${deal.origin_airport} → ${deal.destination_airport}</p>
      <p><strong>Price:</strong> £${deal.price_gbp}${deal.airline ? ` · ${deal.airline}` : ''}</p>
      <p><strong>Dates:</strong> ${deal.outbound_dates ?? 'Flexible / multiple'}</p>
      <p><a href="${deal.link ?? '#'}">Open deal</a></p>
    `;

    let sent = 0;
    const failures: Array<{ to: string; error: string }> = [];

    for (const to of recipients) {
      try {
        await transporter.sendMail({ from, to, subject, html });
        sent++;
      } catch (e) {
        const err = e as Error;
        failures.push({ to, error: err.message });
      }
    }

    return NextResponse.json({ ok: true, sent, failures });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message ?? 'error' }, { status: 500 });
  }
}
