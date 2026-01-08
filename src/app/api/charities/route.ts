import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// GET /api/charities - List all charities
export async function GET() {
  try {
    const charities = await prisma.charity.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        walletAddress: true,
        totalReceived: true,
        createdAt: true,
        _count: {
          select: { donations: true },
        },
      },
    });

    return NextResponse.json(charities);
  } catch (e) {
    return errorResponse(String(e));
  }
}

// POST /api/charities - Create a new charity with auto-generated wallet
export async function POST(request: NextRequest) {
  try {
    const apiHelper = await import('@/app/tool/apiHelper.js') as any;
    const body = await request.json();
    const { name, description } = body;

    if (!name || !description) {
      return errorResponse('name and description are required');
    }

    // Create a new wallet for the charity (using createTreasury which creates a simple funded wallet)
    const walletResult = await apiHelper.createTreasury();
    if (!walletResult.success) {
      return errorResponse('Failed to create wallet for charity');
    }

    const charity = await prisma.charity.create({
      data: {
        name,
        description,
        walletAddress: walletResult.data.address,
        walletSeed: walletResult.data.seed,
      },
    });

    return NextResponse.json({
      ok: true,
      charity: {
        id: charity.id,
        name: charity.name,
        description: charity.description,
        walletAddress: charity.walletAddress,
        totalReceived: charity.totalReceived,
        createdAt: charity.createdAt,
      },
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
