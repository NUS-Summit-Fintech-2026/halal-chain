import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';
import { generateDID } from '@/lib/did';

// GET /api/charities - List all charities
export async function GET() {
  try {
    const charities = await (prisma as any).charity.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        did: true,
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

    // Create a new wallet for the charity with minimal XRP (20 XRP - just above 10 XRP base reserve)
    const walletResult = await apiHelper.createTreasury(20);
    if (!walletResult.success) {
      return errorResponse('Failed to create wallet for charity');
    }

    // Generate DID for the charity
    const did = generateDID('charity', walletResult.data.address);

    const charity = await (prisma as any).charity.create({
      data: {
        did,
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
        did: charity.did,
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
