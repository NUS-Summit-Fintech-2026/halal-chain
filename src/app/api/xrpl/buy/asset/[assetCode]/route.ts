import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, requireUser } from '@/lib/api-utils';

// POST /api/xrpl/buy/asset/[assetCode] - Buy tokens for an asset
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assetCode: string }> }
) {
  try {
    const { user, error } = await requireUser(request);
    if (error) return error;

    const { assetCode } = await params;
    const apiHelper = await import('@/app/tool/apiHelper.js') as any;

    const body = await request.json();
    const { tokenAmount, pricePerToken } = body;

    if (tokenAmount == null || pricePerToken == null) {
      return errorResponse('tokenAmount and pricePerToken are required');
    }

    const asset = await (prisma as any).realAsset.findUnique({ where: { code: assetCode } });
    if (!asset) {
      return errorResponse('Asset not found', 404);
    }

    if (asset.status !== 'PUBLISHED') {
      return errorResponse('Asset not published');
    }

    if (!asset.currencyCode) {
      return errorResponse('Asset missing currencyCode');
    }

    const r = await apiHelper.buyTokens({
      buyerSeed: user.walletSeed,
      currencyCode: asset.currencyCode,
      issuerAddress: asset.issuerAddress,
      tokenAmount: Number(tokenAmount),
      pricePerToken: Number(pricePerToken),
    });

    if (!r.success) {
      return NextResponse.json(r, { status: 400 });
    }

    return NextResponse.json(r);
  } catch (e) {
    return errorResponse(String(e));
  }
}
