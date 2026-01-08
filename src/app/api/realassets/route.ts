import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureIssuerWallet, ensureTreasuryWallet, errorResponse } from '@/lib/api-utils';

// GET /api/realassets - List all real assets
export async function GET() {
  try {
    const assets = await prisma.realAsset.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(assets);
  } catch (e) {
    return errorResponse(String(e));
  }
}

// POST /api/realassets - Create a new real asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, code, totalTokens, profitRate, currentValuationXrp } = body;

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

    const asset = await prisma.realAsset.create({
      data: {
        name,
        description,
        code,
        totalTokens: Number(totalTokens),
        profitRate: Number(profitRate),
        currentValuationXrp: currentValuationXrp ? Number(currentValuationXrp) : null,
        status: 'DRAFT',
        issuerAddress: issuer.address,
        treasuryAddress: treasury.address,
        currencyCode: null,
      },
    });

    return NextResponse.json({
      ok: true,
      asset,
      issuer: { address: issuer.address },
      treasury: { address: treasury.address },
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
