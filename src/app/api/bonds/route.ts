import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureIssuerWallet, ensureTreasuryWallet, errorResponse } from '@/lib/api-utils';

// GET /api/bonds - List all bonds
export async function GET() {
  try {
    const bonds = await prisma.bond.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(bonds);
  } catch (e) {
    return errorResponse(String(e));
  }
}

// POST /api/bonds - Create a new bond
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, code, totalTokens, profitRate, maturityAt } = body;

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

    const bond = await prisma.bond.create({
      data: {
        name,
        description,
        code,
        totalTokens: Number(totalTokens),
        profitRate: Number(profitRate),
        maturityAt: maturityAt ? new Date(maturityAt) : null,
        status: 'DRAFT',
        issuerAddress: issuer.address,
        treasuryAddress: treasury.address,
        currencyCode: null,
      },
    });

    return NextResponse.json({
      ok: true,
      bond,
      issuer: { address: issuer.address },
      treasury: { address: treasury.address },
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
