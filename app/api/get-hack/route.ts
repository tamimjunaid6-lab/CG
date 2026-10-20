import { and, eq, isNull } from 'drizzle-orm';
import { users } from '@/db/schema';
import { getDb } from '@/lib/db';
import { corsHeaders, readJson } from '@/lib/http';
import payload from '@/lib/payload';

export const runtime = 'nodejs';

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;
const requestsByIp = new Map<string, number[]>();

function publicJson(request: Request, body: unknown, status = 200) {
  const headers = new Headers(corsHeaders(request));
  headers.set('Access-Control-Allow-Origin', '*');
  return Response.json(body, { status, headers });
}

function clientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recentRequests = (requestsByIp.get(ip) || []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  recentRequests.push(now);
  requestsByIp.set(ip, recentRequests);
  return recentRequests.length > RATE_LIMIT;
}

export function OPTIONS(request: Request) {
  const headers = new Headers(corsHeaders(request));
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(null, { status: 204, headers });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return publicJson(request, { error: 'Too many requests' }, 429);
  }

  try {
    const body = await readJson(request);
    const license = typeof body.license === 'string' ? body.license.trim() : '';
    const deviceId = typeof body.deviceId === 'string' ? body.deviceId.trim() : '';
    if (!license || license.length > 4096 || !deviceId || deviceId.length > 255) {
      return publicJson(request, { error: 'License and device ID are required' }, 400);
    }

    const matches = await getDb().select().from(users).where(eq(users.licenseKey, license)).limit(1);
    if (!matches.length) return publicJson(request, { error: 'Invalid license' }, 401);

    const user = matches[0];
    if (user.status !== 'active' || user.validTill.getTime() <= Date.now()) {
      return publicJson(request, { error: 'Expired' }, 403);
    }
    if (user.deviceId && user.deviceId !== deviceId) {
      return publicJson(request, { error: 'License is assigned to another device' }, 409);
    }
    if (!user.deviceId) {
      const assigned = await getDb()
        .update(users)
        .set({ deviceId })
        .where(and(eq(users.username, user.username), isNull(users.deviceId)))
        .returning({ deviceId: users.deviceId });
      if (!assigned.length) {
        return publicJson(request, { error: 'Device assignment conflict' }, 409);
      }
    }

    return publicJson(request, {
      status: 'success',
      payload
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      return publicJson(request, { error: 'Device is already assigned to another license' }, 409);
    }
    console.error('License payload request failed:', error instanceof Error ? error.message : 'unknown error');
    return publicJson(request, { error: 'Unable to validate license' }, 500);
  }
}
