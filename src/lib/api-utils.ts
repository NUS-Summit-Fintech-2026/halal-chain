import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

// Type for apiHelper response
interface ApiHelperResponse {
  success: boolean;
  data?: {
    address: string;
    seed: string;
    [key: string]: any;
  };
  error?: string;
}

// Get bearer token from request headers
export function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  return token;
}

// Get user from bearer token (email-based auth for hackathon)
export async function getUser(request: NextRequest) {
  const email = getBearerToken(request);
  if (!email) return null;

  const user = await prisma.user.findUnique({ where: { email } });
  return user;
}

// Require user middleware helper
export async function requireUser(request: NextRequest) {
  const user = await getUser(request);
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: 'Authorization: Bearer <email> required' },
        { status: 401 }
      ),
    };
  }
  return { user, error: null };
}

// Ensure issuer wallet exists
export async function ensureIssuerWallet() {
  // Dynamic import to avoid issues with CommonJS module
  const apiHelper = await import('@/app/tool/apiHelper.js') as any;

  let issuer = await (prisma as any).wallet.findUnique({ where: { role: 'ISSUER' } });
  if (issuer) return issuer;

  const r: ApiHelperResponse = await apiHelper.createIssuer();
  if (!r?.success || !r.data) {
    throw new Error(`createIssuer failed: ${r?.error ?? 'unknown error'}`);
  }

  issuer = await (prisma as any).wallet.create({
    data: {
      role: 'ISSUER',
      address: r.data.address,
      seed: r.data.seed,
    },
  });

  return issuer;
}

// Ensure treasury wallet exists
export async function ensureTreasuryWallet() {
  const apiHelper = await import('@/app/tool/apiHelper.js') as any;

  let treasury = await (prisma as any).wallet.findUnique({ where: { role: 'TREASURY' } });
  if (treasury) return treasury;

  const r: ApiHelperResponse = await apiHelper.createTreasury();
  if (!r?.success || !r.data) {
    throw new Error(`createTreasury failed: ${r?.error ?? 'unknown error'}`);
  }

  treasury = await (prisma as any).wallet.create({
    data: {
      role: 'TREASURY',
      address: r.data.address,
      seed: r.data.seed,
    },
  });

  return treasury;
}

// Standard API response helpers
export function successResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}
