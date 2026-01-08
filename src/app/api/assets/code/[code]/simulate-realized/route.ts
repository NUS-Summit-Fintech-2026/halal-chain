import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// POST /api/assets/code/[code]/simulate-realized - Redeem asset for all holders
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

    if (asset.status !== 'PUBLISHED') {
      return errorResponse('Asset not published');
    }

    if (!asset.currencyCode) {
      return errorResponse('Asset has no currencyCode. Publish first.');
    }

    const issuer = await (prisma as any).wallet.findUnique({ where: { role: 'ISSUER' } });
    const treasury = await (prisma as any).wallet.findUnique({ where: { role: 'TREASURY' } });

    if (!issuer || !treasury) {
      return errorResponse('ISSUER/TREASURY wallet missing', 500);
    }

    const body = await request.json().catch(() => ({}));
    const principalPerTokenXrp = Number(body?.principalPerTokenXrp ?? 1);
    const profitRate = body?.profitRate != null ? Number(body.profitRate) : Number(asset.profitRate);
    const xrpPayoutPerToken = principalPerTokenXrp * (1 + profitRate);

    // Get all users to build holderSeeds map
    const users = await (prisma as any).user.findMany({
      select: { walletAddress: true, walletSeed: true },
    });
    const holderSeeds = Object.fromEntries(
      users.map((u: any) => [u.walletAddress, u.walletSeed])
    );

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

    return NextResponse.json({
      success: true,
      asset: { code: asset.code, currencyCode: asset.currencyCode },
      params: { principalPerTokenXrp, profitRate, xrpPayoutPerToken },
      xrpl: r.data,
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
