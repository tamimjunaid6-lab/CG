import { desc } from 'drizzle-orm';
import { users } from '@/db/schema';
import { getDb } from '@/lib/db';
import { signLicenseToken, verifyAdminRequest } from '@/lib/auth';
import { json, options, readJson } from '@/lib/http';
export const runtime = 'nodejs';
export function OPTIONS(request: Request) { return options(request); }
function clientUser(row: typeof users.$inferSelect) { return { username: row.username, email: row.email, licenseKey: row.licenseKey, deviceId: row.deviceId, validFrom: row.validFrom, validTill: row.validTill, status: row.status }; }
export async function GET(request: Request) {
  if (!verifyAdminRequest(request)) return json(request, { error: 'Invalid or expired admin token' }, 401);
  try { return json(request, { users: (await getDb().select().from(users).orderBy(desc(users.validFrom))).map(clientUser) }); }
  catch (error) { console.error('List users failed:', error instanceof Error ? error.message : 'unknown error'); return json(request, { error: 'Unable to load users' }, 500); }
}
export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) return json(request, { error: 'Invalid or expired admin token' }, 401);
  try {
    const body = await readJson(request);
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email = body.email == null || body.email === '' ? null : String(body.email).trim();
    const validityDays = Number(body.validityDays);
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(username)) return json(request, { error: 'Username must be 1-64 letters, numbers, underscores, or hyphens' }, 400);
    if (email !== null && (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return json(request, { error: 'Email is invalid' }, 400);
    if (!Number.isInteger(validityDays) || validityDays < 1 || validityDays > 36500) return json(request, { error: 'Validity days must be a positive whole number' }, 400);
    const validFrom = new Date();
    const validTill = new Date(validFrom.getTime() + validityDays * 86400000);
    const licenseKey = signLicenseToken(username, validTill);
    const inserted = await getDb().insert(users).values({ username, email, licenseKey, deviceId: null, validFrom, validTill }).returning();
    return json(request, { licenseKey, validFrom: inserted[0].validFrom, validTill: inserted[0].validTill }, 201);
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') return json(request, { error: 'Username or license already exists' }, 409);
    console.error('Create user failed:', error instanceof Error ? error.message : 'unknown error');
    return json(request, { error: 'Unable to create license' }, 500);
  }
}
