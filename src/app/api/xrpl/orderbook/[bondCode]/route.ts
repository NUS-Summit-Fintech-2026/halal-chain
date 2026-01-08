import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// GET /api/xrpl/orderbook/[bondCode] - Get order book for a bond
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bondCode: string }> }
) {
  try {
    const { bondCode } = await params;
    const apiHelper = await import('@/app/tool/apiHelper.js') as any;

    const bond = await (prisma as any).bond.findUnique({ where: { code: bondCode } });
    if (!bond) {
      return errorResponse('Bond not found', 404);
    }

    if (!bond.currencyCode) {
      return errorResponse('Bond not tokenized yet. Publish first.');
    }

    const r = await apiHelper.getOrderBook(bond.currencyCode, bond.issuerAddress);
    if (!r.success) {
      return NextResponse.json(r, { status: 400 });
    }

    return NextResponse.json(r);
  } catch (e) {
    return errorResponse(String(e));
  }
}
