import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const raw = (url.searchParams.get('email') || '').trim().toLowerCase();

  if (raw) {
    // Best-effort delete; redirect regardless of outcome
    await supabaseService.from('subscribers').delete().eq('email', raw);
  }

  const redirectUrl = new URL('/subscribe?unsubscribed=1', url.origin);
  return NextResponse.redirect(redirectUrl, 302);
}

