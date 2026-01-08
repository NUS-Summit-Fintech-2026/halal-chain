import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api-utils';

// GET /api/xrpl/orderbook - Get order book for any token
// Query params: currencyCode, issuerAddress
export async function GET(request: NextRequest) {
  try {
    const apiHelper = await import('@/app/tool/apiHelper.js') as any;

    const { searchParams } = new URL(request.url);
    const currencyCode = searchParams.get('currencyCode');
    const issuerAddress = searchParams.get('issuerAddress');

    if (!currencyCode || !issuerAddress) {
      return errorResponse('currencyCode and issuerAddress query parameters are required');
    }

    const r = await apiHelper.getOrderBook(currencyCode, issuerAddress);
    if (!r.success) {
      return NextResponse.json(r, { status: 400 });
    }

    return NextResponse.json(r);
  } catch (e) {
    return errorResponse(String(e));
  }
}
