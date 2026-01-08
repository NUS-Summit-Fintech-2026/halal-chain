import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// POST /api/realassets/code/[code]/simulate-realization - Simulate asset sale and distribute to holders
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

    if (asset.status !== 'PUBLISHED') {
      return errorResponse('Asset must be published to simulate realization');
    }

    if (!asset.currencyCode) {
      return errorResponse('Asset has no currencyCode. Publish first.');
    }

    const issuer = await prisma.wallet.findUnique({ where: { role: 'ISSUER' } });
    const treasury = await prisma.wallet.findUnique({ where: { role: 'TREASURY' } });

    if (!issuer || !treasury) {
      return errorResponse('ISSUER/TREASURY wallet missing', 500);
    }

    const body = await request.json().catch(() => ({}));
    const { sellingPriceXrp } = body;

    if (sellingPriceXrp == null || Number(sellingPriceXrp) <= 0) {
      return errorResponse('sellingPriceXrp is required (total selling price of the asset)');
    }

    // Calculate XRP payout per token based on selling price
    // sellingPriceXrp is the total sale price, divided by total tokens
    const xrpPayoutPerToken = Number(sellingPriceXrp) / asset.totalTokens;

    // Get all users to build holderSeeds map
    const users = await prisma.user.findMany({
      select: { walletAddress: true, walletSeed: true },
    });
    const holderSeeds = Object.fromEntries(
      users.map((u: any) => [u.walletAddress, u.walletSeed])
    );

    // Redeem asset for all holders (using same function as bonds)
    const r = await apiHelper.redeemBondForAllHolders({
      issuerSeed: issuer.seed,
      treasurySeed: treasury.seed,
      currencyCode: asset.currencyCode,
      xrpPayoutPerToken,
      holderSeeds,
    });

    if (!r?.success) {
      return NextResponse.json(r, { status: 400 });
    }

    // Update asset status to REALIZED
    const updated = await prisma.realAsset.update({
      where: { id: asset.id },
      data: {
        status: 'REALIZED',
        currentValuationXrp: Number(sellingPriceXrp),
      },
    });

    return NextResponse.json({
      success: true,
      asset: {
        code: updated.code,
        currencyCode: updated.currencyCode,
        status: updated.status,
      },
      params: {
        sellingPriceXrp: Number(sellingPriceXrp),
        totalTokens: asset.totalTokens,
        xrpPayoutPerToken,
      },
      xrpl: r.data,
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
