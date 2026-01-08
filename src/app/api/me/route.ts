import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api-utils';

// GET /api/me - Get current user
export async function GET(request: NextRequest) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      did: user.did,
      email: user.email,
      walletAddress: user.walletAddress,
    },
  });
}
