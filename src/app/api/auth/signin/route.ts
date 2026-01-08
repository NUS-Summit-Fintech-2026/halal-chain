import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// POST /api/auth/signin - Sign in with email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return errorResponse('Email is required');
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse('User not found. Please sign up first.', 404);
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        did: user.did,
        email: user.email,
        walletAddress: user.walletAddress,
      },
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
