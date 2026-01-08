import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, requireUser } from '@/lib/api-utils';

// POST /api/xrpl/sell/[bondCode] - Sell tokens for a bond
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bondCode: string }> }
) {
  try {
    const { user, error } = await requireUser(request);
    if (error) return error;

    const { bondCode } = await params;
    const apiHelper = await import('@/app/tool/apiHelper.js') as any;

    const body = await request.json();
    const { tokenAmount, pricePerToken } = body;

    if (tokenAmount == null || pricePerToken == null) {
      return errorResponse('tokenAmount and pricePerToken are required');
    }

    const bond = await (prisma as any).bond.findUnique({ where: { code: bondCode } });
    if (!bond) {
      return errorResponse('Bond not found', 404);
    }

    if (bond.status !== 'PUBLISHED') {
      return errorResponse('Bond not published');
    }

    if (!bond.currencyCode) {
      return errorResponse('Bond missing currencyCode');
    }

    const r = await apiHelper.sellTokens({
      sellerSeed: user.walletSeed,
      currencyCode: bond.currencyCode,
      issuerAddress: bond.issuerAddress,
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
