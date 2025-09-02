// src/app/api/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import nodemailer from 'nodemailer';
import { buildUnsubLink } from '@/lib/email';

export const runtime = 'nodejs';

interface Subscriber {
  email: string;
  plan?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = (body?.email ?? '').toLowerCase().trim(); // 👈 const, not let

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Simple runtime check to reject obvious invalid emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Use .returns<Subscriber[]>() to avoid `any`
    const { error } = await supabaseService
      .from('subscribers')
      .upsert<Subscriber>({ email, plan: 'free' }, { onConflict: 'email' });

    if (error) {
      console.error('SUBSCRIBE_ERROR:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fire-and-forget welcome email (does not block success)
    (async () => {
      try {
        const host = process.env.SMTP_HOST;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const port = Number(process.env.SMTP_PORT || 465);
        const secure = String(process.env.SMTP_SECURE || 'true') === 'true';

        if (host && user && pass) {
          const transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
          } as any);

          const fromName = process.env.ALERTS_FROM_NAME || 'UK Flight Deals';
          const fromEmail = process.env.ALERTS_FROM_EMAIL || user;
          const from = `${fromName} <${fromEmail}>`;
          const subject = '🎉 Welcome aboard — deal alerts activated';
          const unsub = buildUnsubLink(email);
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
          const html = `
            <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111">
              <h2 style=\"margin:0 0 8px\">🚀 You’re in!</h2>
              <p style=\"margin:0 0 12px;color:#475569\">We’ll ping you when wallet‑friendly UK flight deals land. No fluff, just the good stuff.</p>
              <p style=\"margin:12px 0\">
                <a href=\"${baseUrl}/\" style=\"display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px\">Browse latest deals</a>
              </p>
              <p style=\"font-size:12px;color:#64748b;margin-top:20px\">
                Prefer a quiet inbox? <a href=\"${unsub}\" style=\"color:#334155\">Unsubscribe</a> anytime.
              </p>
            </div>
          `;
          await transporter.sendMail({ from, to: email, subject, html });
        }
      } catch (err) {
        console.error('WELCOME_EMAIL_FAILED', err);
      }
    })();

    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error;
    console.error('SUBSCRIBE_HANDLER_FAILED:', err);
    return NextResponse.json({ error: err.message ?? 'error' }, { status: 500 });
  }
}
