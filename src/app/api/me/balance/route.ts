import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-utils';

// GET /api/me/balance - Get logged in user's wallet balance
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireUser(request);
    if (error) return error;

    const apiHelper = await import('@/app/tool/apiHelper.js') as any;
    const result = await apiHelper.getWalletBalances(user.walletAddress);

    if (!result.success) {
      return errorResponse(`Failed to get balance: ${result.error}`);
    }

    // Find XRP balance
    const xrpBalance = result.data.balances.find(
      (b: { currency: string }) => b.currency === 'XRP'
    );

    return NextResponse.json({
      ok: true,
      walletAddress: user.walletAddress,
      xrpBalance: xrpBalance ? parseFloat(xrpBalance.value) : 0,
      balances: result.data.balances,
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
