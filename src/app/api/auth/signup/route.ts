import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// POST /api/auth/signup - Register new user with auto-generated wallet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return errorResponse('Email is required');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse('User already exists. Please sign in.');
    }

    // Create a new wallet for the user (basic funded wallet)
    const apiHelper = await import('@/app/tool/apiHelper.js') as any;
    const walletResult = await apiHelper.createTreasury();

    if (!walletResult.success) {
      return errorResponse(`Failed to create wallet: ${walletResult.error || 'Unknown error'}`);
    }

    // Create user with wallet
    const user = await prisma.user.create({
      data: {
        email,
        walletAddress: walletResult.data.address,
        walletSeed: walletResult.data.seed,
      },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
      },
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
