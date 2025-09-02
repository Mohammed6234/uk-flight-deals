import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let email = (body?.email ?? '').toString().trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    // Optional: simple runtime check (keeps DB clean even if you remove the CHECK)
    const simpleEmailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!simpleEmailRe.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { error } = await supabaseService
      .from('subscribers')
      .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true });

    if (error) {
      console.error('SUBSCRIBE_ERROR:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('SUBSCRIBE_HANDLER_FAILED:', e);
    return NextResponse.json({ error: e.message ?? 'error' }, { status: 500 });
  }
}
