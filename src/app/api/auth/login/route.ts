import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// POST /api/auth/login - Login or register user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, walletAddress, walletSeed } = body;

    if (!email || !walletAddress || !walletSeed) {
      return errorResponse('email, walletAddress, walletSeed are required');
    }

    const user = await (prisma as any).user.upsert({
      where: { email },
      update: { walletAddress, walletSeed },
      create: { email, walletAddress, walletSeed },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    return errorResponse(String(e));
  }
}
