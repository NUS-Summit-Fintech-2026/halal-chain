import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// POST /api/realassets/code/[code]/publish - Publish/tokenize a real asset
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const apiHelper = await import('@/app/tool/apiHelper.js') as any;

    const asset = await prisma.realAsset.findUnique({ where: { code } });
    if (!asset) {
      return errorResponse('Real asset not found', 404);
    }

    if (asset.status === 'PUBLISHED') {
      return NextResponse.json({ ok: true, asset, note: 'Already published' });
    }

    if (asset.status === 'REALIZED') {
      return errorResponse('Cannot publish a realized asset');
    }

    const body = await request.json();
    const { pricePerToken } = body;

    if (pricePerToken == null || Number(pricePerToken) <= 0) {
      return errorResponse('pricePerToken (in XRP) is required to list initial sell offer');
    }

    const issuer = await prisma.wallet.findUnique({ where: { role: 'ISSUER' } });
    const treasury = await prisma.wallet.findUnique({ where: { role: 'TREASURY' } });

    if (!issuer || !treasury) {
      return errorResponse('ISSUER/TREASURY wallet not found. Create an asset first.', 500);
    }

    // Tokenize the asset on XRPL (using same tokenizeBond function)
    const tok = await apiHelper.tokenizeBond({
      bondCode: asset.code,
      totalTokens: asset.totalTokens,
      issuerSeed: issuer.seed,
      treasurySeed: treasury.seed,
    });

    if (!tok?.success) {
      return NextResponse.json(tok, { status: 400 });
    }

    // Update asset status
    const updated = await prisma.realAsset.update({
      where: { id: asset.id },
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
        asset: updated,
        tokenize: tok.data,
        sellError: sell,
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      asset: updated,
      tokenize: tok.data,
      initialSellOffer: sell.data,
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
