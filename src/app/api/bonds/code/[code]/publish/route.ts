import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// POST /api/bonds/code/[code]/publish - Publish/tokenize a bond
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const apiHelper = await import('@/app/tool/apiHelper.js') as any;

    const bond = await (prisma as any).bond.findUnique({ where: { code } });
    if (!bond) {
      return errorResponse('Bond not found', 404);
    }

    if (bond.status === 'PUBLISHED') {
      return NextResponse.json({ ok: true, bond, note: 'Already published' });
    }

    const body = await request.json();
    const { pricePerToken } = body;

    if (pricePerToken == null || Number(pricePerToken) <= 0) {
      return errorResponse('pricePerToken (in XRP) is required to list initial sell offer');
    }

    const issuer = await (prisma as any).wallet.findUnique({ where: { role: 'ISSUER' } });
    const treasury = await (prisma as any).wallet.findUnique({ where: { role: 'TREASURY' } });

    if (!issuer || !treasury) {
      return errorResponse('ISSUER/TREASURY wallet not found. Create a bond first.', 500);
    }

    // Tokenize the bond on XRPL
    const tok = await apiHelper.tokenizeBond({
      bondCode: bond.code,
      totalTokens: bond.totalTokens,
      issuerSeed: issuer.seed,
      treasurySeed: treasury.seed,
    });

    if (!tok?.success) {
      return NextResponse.json(tok, { status: 400 });
    }

    // Update bond status
    const updated = await (prisma as any).bond.update({
      where: { id: bond.id },
      data: {
        currencyCode: tok.data.currencyCode,
        status: 'PUBLISHED',
      },
    });

    // Create initial sell offer from treasury
    const sell = await apiHelper.sellTokens({
      sellerSeed: treasury.seed,
      currencyCode: updated.currencyCode,
      issuerAddress: updated.issuerAddress,
      tokenAmount: updated.totalTokens,
      pricePerToken: Number(pricePerToken),
    });

    if (!sell?.success) {
      return NextResponse.json({
        ok: false,
        error: 'Tokenized and published, but failed to place treasury sell offer',
        bond: updated,
        tokenize: tok.data,
        sellError: sell,
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      bond: updated,
      tokenize: tok.data,
      initialSellOffer: sell.data,
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
