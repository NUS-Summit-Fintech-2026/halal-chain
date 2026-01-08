import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// POST /api/assets/code/[code]/publish - Publish/tokenize an asset
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const apiHelper = await import('@/app/tool/apiHelper.js') as any;

    const asset = await (prisma as any).realAsset.findUnique({ where: { code } });
    if (!asset) {
      return errorResponse('Asset not found', 404);
    }

    if (asset.status === 'PUBLISHED') {
      return NextResponse.json({ success: true, asset, note: 'Already published' });
    }

    const body = await request.json();
    const { pricePerToken } = body;

    if (pricePerToken == null || Number(pricePerToken) <= 0) {
      return errorResponse('pricePerToken (in XRP) is required');
    }

    const issuer = await (prisma as any).wallet.findUnique({ where: { role: 'ISSUER' } });
    const treasury = await (prisma as any).wallet.findUnique({ where: { role: 'TREASURY' } });

    if (!issuer || !treasury) {
      return errorResponse('ISSUER/TREASURY wallet not found. Create an asset first.', 500);
    }

    // Tokenize the asset on XRPL
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
    const updated = await (prisma as any).realAsset.update({
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
        success: false,
        error: 'Tokenized and published, but failed to place initial treasury sell offer',
        asset: updated,
        tokenize: tok.data,
        sellError: sell,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      asset: updated,
      tokenize: tok.data,
      initialSellOffer: sell.data,
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
