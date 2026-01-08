import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';
import { generateDID } from '@/lib/did';

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

    // Generate DID for the user
    const did = generateDID('user', walletResult.data.address);

    // Create user with wallet and DID
    const user = await prisma.user.create({
      data: {
        did,
        email,
        walletAddress: walletResult.data.address,
        walletSeed: walletResult.data.seed,
      },
    });

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
