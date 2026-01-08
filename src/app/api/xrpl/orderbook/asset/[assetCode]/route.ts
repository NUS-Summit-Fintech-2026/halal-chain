import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// GET /api/xrpl/orderbook/asset/[assetCode] - Get order book for an asset
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetCode: string }> }
) {
  try {
    const { assetCode } = await params;
    const apiHelper = await import('@/app/tool/apiHelper.js') as any;

    const asset = await (prisma as any).realAsset.findUnique({ where: { code: assetCode } });
    if (!asset) {
      return errorResponse('Asset not found', 404);
    }

    if (!asset.currencyCode) {
      return errorResponse('Asset not tokenized. Publish first.');
    }

    const r = await apiHelper.getOrderBook(asset.currencyCode, asset.issuerAddress);
    if (!r.success) {
      return NextResponse.json(r, { status: 400 });
    }

    return NextResponse.json(r);
  } catch (e) {
    return errorResponse(String(e));
  }
}
