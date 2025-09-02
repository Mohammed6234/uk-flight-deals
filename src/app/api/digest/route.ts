// Weekly digest email for Free users
// Suggested Vercel Cron: 0 9 * * MON
// https://vercel.com/docs/cron-jobs

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { supabaseService } from '@/lib/supabase';
import { buildUnsubLink } from '@/lib/email';

export const runtime = 'nodejs';

const reqd = (k: string): string => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env: ${k}`);
  return v;
};

interface DealItem {
  id: string;
  origin_airport: string;
  destination_airport: string;
  price_gbp: number;
  outbound_dates: string | null;
  link: string | null;
}

interface Subscriber { email: string | null }

export async function POST() {
  // Basic disable/ratelimit switch
  if ((process.env.DIGEST_DISABLED || '').toLowerCase() === 'true') {
    return NextResponse.json({ ok: true, sent: 0, disabled: true });
  }

  // Compute 7-day window
  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Load recent deals
  const { data: deals, error: dealsErr } = await supabaseService
    .from('deals')
    .select('id, origin_airport, destination_airport, price_gbp, outbound_dates, link, found_at')
    .eq('is_published', true)
    .gte('found_at', sevenDaysAgoIso)
    .order('price_gbp', { ascending: true })
    .limit(10)
    .returns<(DealItem & { found_at: string })[]>();

  if (dealsErr) {
    return NextResponse.json({ error: dealsErr.message }, { status: 500 });
  }

  const top = (deals ?? []).slice(0, 10);
  if (top.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, note: 'no deals in last 7 days' });
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

  // SMTP transporter (reuse config pattern from notify)
  const transportOptions: SMTPTransport.Options = {
    host: reqd('SMTP_HOST'),
    port: Number(reqd('SMTP_PORT')),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: {
      user: reqd('SMTP_USER'),
      pass: reqd('SMTP_PASS'),
    },
  };
  const transporter = nodemailer.createTransport(transportOptions);

  const fromName = process.env.ALERTS_FROM_NAME || 'UK Flight Deals';
  const fromEmail = process.env.ALERTS_FROM_EMAIL || process.env.SMTP_USER!;
  const from = `${fromName} <${fromEmail}>`;

  const subject = '📬 Your weekly UK Flight Deals';

  let sent = 0;
  const failures: Array<{ to: string; error: string }> = [];
  for (const to of recipients) {
    try {
      const unsub = buildUnsubLink(to);
      const itemsWithUtm = top
        .map((d) => {
          let href = '#';
          if (d.link) {
            try {
              const u = new URL(d.link);
              u.searchParams.set('utm_source', 'email');
              u.searchParams.set('utm_medium', 'alert');
              u.searchParams.set('utm_campaign', d.id);
              href = u.toString();
            } catch {}
          }
          const dates = d.outbound_dates ? ` · ${d.outbound_dates}` : '';
          const linkPart = href !== '#' ? ` · <a href="${href}">Open</a>` : '';
          return `<li><strong>£${d.price_gbp}</strong> — ${d.origin_airport} → ${d.destination_airport}${dates}${linkPart}</li>`;
        })
        .join('');

      const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111">
          <h2 style="margin:0 0 8px">✉️ Weekly UK Flight Deals</h2>
          <p style="margin:0 0 12px;color:#475569">Ten wallet‑pleasers from the last 7 days — hand‑picked, no fluff, maximum wanderlust.</p>
          <ol style="margin:0 0 12px 20px;padding:0">${itemsWithUtm}</ol>
          <p style="margin:12px 0;color:#475569">Prices move fast — if one winks at you, snag it before it takes off.</p>
          <p style="font-size:12px;color:#64748b;margin-top:20px">
            You’re receiving this because you subscribed to UK Flight Deals.
            <a href="${unsub}" style="margin-left:8px;color:#334155">Unsubscribe</a>
          </p>
        </div>
      `;
      await transporter.sendMail({ from, to, subject, html });
      sent += 1;
    } catch (e) {
      const err = e as Error;
      failures.push({ to, error: err.message });
    }
  }

  return NextResponse.json({ ok: true, sent, failures });
}
