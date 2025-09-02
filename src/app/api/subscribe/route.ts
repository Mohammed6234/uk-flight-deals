// src/app/api/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

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

    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error;
    console.error('SUBSCRIBE_HANDLER_FAILED:', err);
    return NextResponse.json({ error: err.message ?? 'error' }, { status: 500 });
  }
}
