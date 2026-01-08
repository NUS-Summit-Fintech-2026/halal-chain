import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureIssuerWallet, ensureTreasuryWallet, errorResponse } from '@/lib/api-utils';

// GET /api/assets - List all assets
export async function GET() {
  try {
    const assets = await (prisma as any).realAsset.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, assets });
  } catch (e) {
    return errorResponse(String(e));
  }
}

// POST /api/assets - Create a new asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, code, totalTokens, profitRate } = body;

    if (!name || !description || !code) {
      return errorResponse('name, description, code are required');
    }
    if (totalTokens == null || Number(totalTokens) <= 0) {
      return errorResponse('totalTokens must be > 0');
    }
    if (profitRate == null || Number.isNaN(Number(profitRate))) {
      return errorResponse('profitRate is required (number)');
    }

    const issuer = await ensureIssuerWallet();
    const treasury = await ensureTreasuryWallet();

    const asset = await (prisma as any).realAsset.create({
      data: {
        name,
        description,
        code,
        totalTokens: Number(totalTokens),
        profitRate: Number(profitRate),
        status: 'DRAFT',
        issuerAddress: issuer.address,
        treasuryAddress: treasury.address,
        currencyCode: null,
      },
    });

    return NextResponse.json({ success: true, asset });
  } catch (e) {
    return errorResponse(String(e));
  }
}
