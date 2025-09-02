import { describe, it, expect, beforeEach, vi } from 'vitest';

// Provide environment variables for the route
const DEAL_ID = '2fc72f8a-eda8-465f-8cbd-f8105b357953';

// Mock nodemailer
const sendMail = vi.fn(async () => ({ messageId: 'mocked' }));
vi.mock('nodemailer', () => {
  return {
    default: {
      createTransport: vi.fn(() => ({ sendMail })),
    },
  } as any;
});

// Mock Supabase service client used in the route
vi.mock('@/lib/supabase', () => {
  const service = {
    from: (table: string) => {
      if (table === 'deals') {
        return {
          select: () => ({
            eq: (_field: string, _value: string) => ({
              single: async () => ({
                data: {
                  id: DEAL_ID,
                  price_gbp: 199,
                  origin_airport: 'LHR',
                  destination_airport: 'JFK',
                  trip_type: 'return',
                  link: 'https://example.com/deal',
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'subscribers') {
        return {
          select: async () => ({
            data: [{ email: 'a@example.com' }, { email: 'b@example.com' }],
            error: null,
          }),
        };
      }
      return { select: async () => ({ data: [], error: null }) } as any;
    },
  };
  return { supabaseService: service };
});

// Import after mocks
import { POST } from '@/app/api/notify/route';

function makeReq(url: string, body: any, headers: Record<string, string> = {}) {
  const h = new Headers(headers);
  return {
    url,
    headers: h,
    json: async () => body,
  } as any;
}

describe('notify API', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_key';
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';
    process.env.SMTP_USER = 'user@gmail.com';
    process.env.SMTP_PASS = 'app_password';
    process.env.SMTP_FROM = 'UK Flight Deals <user@gmail.com>';
    delete process.env.NOTIFY_SECRET;
    delete process.env.NOTIFY_CONCURRENCY;
    sendMail.mockClear();
  });

  it('returns dry run count without sending', async () => {
    const req = makeReq(
      'http://localhost:3000/api/notify?dry=1',
      { dealId: DEAL_ID },
      { 'content-type': 'application/json' }
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.dryRun).toBe(true);
    expect(json.wouldSendTo).toBe(2);
  });

  it('sends emails live when not dry-run', async () => {
    const req = makeReq(
      'http://localhost:3000/api/notify',
      { dealId: DEAL_ID },
      { 'content-type': 'application/json' }
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.sent).toBe(2);
    expect(Array.isArray(json.failures)).toBe(true);
    expect(json.failures.length).toBe(0);
  });

  it('requires dealId or welcome', async () => {
    const req = makeReq('http://localhost:3000/api/notify?dry=1', {}, {});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Provide dealId/i);
  });

  it('enforces NOTIFY_SECRET when set', async () => {
    process.env.NOTIFY_SECRET = 'supersecret';

    const reqNoAuth = makeReq(
      'http://localhost:3000/api/notify?dry=1',
      { dealId: DEAL_ID },
      {}
    );
    const resNoAuth = await POST(reqNoAuth);
    expect(resNoAuth.status).toBe(401);

    const reqAuth = makeReq('http://localhost:3000/api/notify?dry=1', { dealId: DEAL_ID }, { Authorization: 'Bearer supersecret' });
    const resAuth = await POST(reqAuth);
    expect(resAuth.status).toBe(200);
  });
});
