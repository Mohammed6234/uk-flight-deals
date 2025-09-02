// src/app/api/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabaseService } from '@/lib/supabase';

// Force Node runtime (SMTP requires Node, not Edge)
export const runtime = 'nodejs';

const required = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
};

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get('dry') === '1' || req.headers.get('x-dry-run') === '1';
    const welcomeFlag = url.searchParams.get('welcome') === '1';

    // Optional auth: if NOTIFY_SECRET is set, require Bearer token
    const notifySecret = process.env.NOTIFY_SECRET;
    if (notifySecret) {
      const auth = req.headers.get('authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      if (token !== notifySecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json().catch(() => ({}));
    const dealId = body?.dealId as string | undefined;
    const welcome = Boolean(body?.welcome) || welcomeFlag;
    if (!dealId && !welcome) {
      return NextResponse.json({ error: 'Provide dealId or set welcome: true' }, { status: 400 });
    }

    // SMTP env
    const SMTP_HOST = required('SMTP_HOST');
    const SMTP_USER = required('SMTP_USER');
    const SMTP_PASS = required('SMTP_PASS');
    const SMTP_FROM = required('SMTP_FROM');
    const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
    const SMTP_SECURE = String(process.env.SMTP_SECURE || 'true') === 'true';

    // Deal (if requested)
    let deal: any | null = null;
    if (dealId) {
      const { data, error } = await supabaseService
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single();
      deal = data;
      if (error || !deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Subscribers
    const { data: subs, error: subsErr } = await supabaseService
      .from('subscribers')
      .select('email');
    if (subsErr) return NextResponse.json({ error: subsErr.message }, { status: 500 });
    const recipients: string[] = (subs ?? [])
      .map((s: any) => s?.email)
      .filter((e: any) => typeof e === 'string' && e.includes('@'));
    if (recipients.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, note: 'no subscribers' });
    }

    // Compose
    const subject = welcome
      ? `Welcome to UK Flight Deals`
      : `£${deal.price_gbp} ${deal.origin_airport} → ${deal.destination_airport} (${deal.trip_type ?? 'return'})`;
    const html = welcome
      ? `
        <h2>🎉 Welcome to UK Flight Deals</h2>
        <p>You’ll receive curated UK flight deals as they drop.</p>
        <p>Meanwhile, browse the latest here: <a href="/">Open site</a></p>
        <hr/>
        <p style="font-size:12px;color:#666">You can unsubscribe anytime via the link in our emails.</p>
      `
      : `
        <h2>🔥 New UK flight deal</h2>
        <p><strong>Route:</strong> ${deal.origin_airport} → ${deal.destination_airport}</p>
        <p><strong>Price:</strong> £${deal.price_gbp}${deal.airline ? ` · ${deal.airline}` : ''}</p>
        <p><strong>Dates:</strong> ${deal.outbound_dates ?? 'Flexible / multiple'}</p>
        <p><a href="${deal.link}">Open deal</a></p>
        <hr/>
        <p style="font-size:12px;color:#666">You’re receiving this because you subscribed to UK Flight Deals.</p>
      `;

    if (dryRun) {
      return NextResponse.json({ ok: true, dryRun: true, from: SMTP_FROM, subject, wouldSendTo: recipients.length });
    }

    // Transport (Gmail SMTP)
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      pool: true,
      maxConnections: Number(process.env.SMTP_MAX_CONN || 3),
    } as any);

    let sent = 0;
    const failures: Array<{ to: string; error: string }> = [];
    for (const to of recipients) {
      try {
        await transport.sendMail({ from: SMTP_FROM, to, subject, html });
        sent += 1;
      } catch (e: any) {
        failures.push({ to, error: e?.message ?? 'send failed' });
      }
    }

    return NextResponse.json({ ok: true, sent, failures });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'error' }, { status: 500 });
  }
}
