import { NextRequest, NextResponse } from 'next/server';
import { requireUser, errorResponse } from '@/lib/api-utils';

// GET /api/me/wallet - Get logged in user's wallet explorer URL
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireUser(request);
    if (error) return error;

    const apiHelper = await import('@/app/tool/apiHelper.js') as any;
    const explorerUrl = apiHelper.getExplorerUrl(user.walletAddress, 'testnet');

    return NextResponse.json({
      ok: true,
      walletAddress: user.walletAddress,
      explorerUrl: explorerUrl,
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
