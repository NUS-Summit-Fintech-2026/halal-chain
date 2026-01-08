import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// POST /api/bonds/code/[code]/simulate-expired - Redeem bond for all holders
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

    if (bond.status !== 'PUBLISHED') {
      return errorResponse('Bond not published');
    }

    if (!bond.currencyCode) {
      return errorResponse('Bond has no currencyCode. Publish first.');
    }

    const issuer = await (prisma as any).wallet.findUnique({ where: { role: 'ISSUER' } });
    const treasury = await (prisma as any).wallet.findUnique({ where: { role: 'TREASURY' } });

    if (!issuer || !treasury) {
      return errorResponse('ISSUER/TREASURY wallet missing', 500);
    }

    const body = await request.json().catch(() => ({}));
    const principalPerTokenXrp = Number(body?.principalPerTokenXrp ?? 1);
    const profitMultiplier = Number(body?.profitMultiplier ?? 1.2);
    const xrpPayoutPerToken = principalPerTokenXrp * profitMultiplier;

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
      currencyCode: bond.currencyCode,
      xrpPayoutPerToken,
      holderSeeds,
    });

    if (!r?.success) {
      return NextResponse.json(r, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      bond: { code: bond.code, currencyCode: bond.currencyCode },
      params: { principalPerTokenXrp, profitMultiplier, xrpPayoutPerToken },
      xrpl: r.data,
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
