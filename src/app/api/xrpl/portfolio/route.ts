import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, requireUser } from '@/lib/api-utils';

// GET /api/xrpl/portfolio - Get user's wallet balances
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireUser(request);
    if (error) return error;

    const apiHelper = await import('@/app/tool/apiHelper.js') as any;

    const r = await apiHelper.getWalletBalances(user.walletAddress);
    if (!r.success) {
      return NextResponse.json(r, { status: 400 });
    }

    return NextResponse.json(r);
  } catch (e) {
    return errorResponse(String(e));
  }
}
