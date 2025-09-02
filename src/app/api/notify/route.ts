// src/app/api/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabaseService } from '@/lib/supabase';
import { buildUnsubLink } from '@/lib/email';

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
  last_notified_at?: string | null;
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

    // Rate-limit: skip if last notified within past 15 minutes
    if (deal.last_notified_at) {
      const last = new Date(deal.last_notified_at).getTime();
      const fifteenMinMs = 15 * 60 * 1000;
      if (!Number.isNaN(last) && Date.now() - last < fifteenMinMs) {
        return NextResponse.json({ ok: true, sent: 0, note: 'rate-limited' });
      }
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

    const subject = `🔥 £${deal.price_gbp} ${deal.origin_airport} → ${deal.destination_airport} (${deal.trip_type ?? 'return'})`;

    let sent = 0;
    const failures: Array<{ to: string; error: string }> = [];

    for (const to of recipients) {
      try {
        const unsub = buildUnsubLink(to);
        let dealUrl = '#';
        if (deal.link) {
          try {
            const u = new URL(deal.link);
            u.searchParams.set('utm_source', 'email');
            u.searchParams.set('utm_medium', 'alert');
            u.searchParams.set('utm_campaign', deal.id);
            dealUrl = u.toString();
          } catch {}
        }
        const html = `
          <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111">
            <h2 style="margin:0 0 8px">✈️ New deal just landed</h2>
            <p style="margin:0 0 12px;color:#475569">Blink and you’ll miss it — here’s a tasty fare before it flies away.</p>
            <ul style="padding-left:16px;margin:0 0 12px">
              <li><strong>Route:</strong> ${deal.origin_airport} → ${deal.destination_airport}</li>
              <li><strong>Price:</strong> £${deal.price_gbp}${deal.airline ? ` · ${deal.airline}` : ''}</li>
              <li><strong>Dates:</strong> ${deal.outbound_dates ?? 'Flexible / multiple'}</li>
            </ul>
            <p style="margin:12px 0">
              <a href="${dealUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px">View deal</a>
            </p>
            <p style="font-size:12px;color:#64748b;margin-top:20px">
              You’re receiving this because you subscribed to UK Flight Deals.
              <a href="${unsub}" style="margin-left:8px;color:#334155">Unsubscribe</a>
            </p>
          </div>
        `;
        await transporter.sendMail({ from, to, subject, html });
        sent++;
      } catch (e) {
        const err = e as Error;
        failures.push({ to, error: err.message });
      }
    }

    // If at least one message was sent, update last_notified_at
    if (sent > 0) {
      try {
        await supabaseService.from('deals').update({ last_notified_at: new Date().toISOString() }).eq('id', deal.id);
      } catch {
        // ignore update errors
      }
    }

    return NextResponse.json({ ok: true, sent, failures });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message ?? 'error' }, { status: 500 });
  }
}
