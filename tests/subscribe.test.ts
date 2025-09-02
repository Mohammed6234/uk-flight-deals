import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase service client used in the route
const upsertMock = vi.fn(async () => ({ error: null }));

vi.mock('@/lib/supabase', () => {
  const service = {
    from: (table: string) => {
      if (table === 'subscribers') {
        return {
          upsert: upsertMock,
        } as any;
      }
      return { upsert: async () => ({ error: null }) } as any;
    },
  };
  return { supabaseService: service };
});

// Import after mocks
import { POST } from '@/app/api/subscribe/route';

function makeReq(body: any) {
  return {
    json: async () => body,
  } as any;
}

describe('subscribe API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid email', async () => {
    const res = await POST(makeReq({ email: 'not-an-email' }));
    expect(res.status).toBe(400);
    const json = await (res as any).json();
    expect(json.error).toMatch(/invalid email/i);
  });

  it('upserts valid email (lowercased/trimmed)', async () => {
    const res = await POST(makeReq({ email: '  Test@Example.com  ' }));
    expect(res.status).toBe(200);
    const json = await (res as any).json();
    expect(json.ok).toBe(true);
    expect(upsertMock).toHaveBeenCalledTimes(1);
    const args = upsertMock.mock.calls[0][0];
    expect(args).toEqual({ email: 'test@example.com' });
  });
});

