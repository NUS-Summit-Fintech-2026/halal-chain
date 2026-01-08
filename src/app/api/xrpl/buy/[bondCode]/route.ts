import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, requireUser } from '@/lib/api-utils';

// POST /api/xrpl/buy/[bondCode] - Place a buy order for tokens
// General API - accepts currencyCode and issuerAddress directly
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
    const { tokenAmount, pricePerToken, currencyCode, issuerAddress } = body;

    // Validate required fields
    if (tokenAmount == null || pricePerToken == null) {
      return errorResponse('tokenAmount and pricePerToken are required');
    }

    if (!currencyCode || !issuerAddress) {
      return errorResponse('currencyCode and issuerAddress are required');
    }

    if (tokenAmount <= 0) {
      return errorResponse('tokenAmount must be greater than 0');
    }

    if (pricePerToken <= 0) {
      return errorResponse('pricePerToken must be greater than 0');
    }

    // Check if user has enough XRP to buy
    const totalCost = Number(tokenAmount) * Number(pricePerToken);
    const balanceResult = await apiHelper.getWalletBalances(user.walletAddress);
    if (!balanceResult.success) {
      return errorResponse(`Failed to check balance: ${balanceResult.error}`);
    }

    const xrpBalance = balanceResult.data.balances.find(
      (b: { currency: string }) => b.currency === 'XRP'
    );
    const availableXrp = xrpBalance ? parseFloat(xrpBalance.value) : 0;

    // Account for reserve (10 XRP base + some buffer)
    const reserveBuffer = 15;
    if (availableXrp - reserveBuffer < totalCost) {
      return errorResponse(`Insufficient XRP balance. You have ${availableXrp.toFixed(2)} XRP (${reserveBuffer} XRP reserved), need ${totalCost.toFixed(6)} XRP`);
    }

    // Ensure trust line exists before buying
    const trustLineResult = await apiHelper.ensureTrustLine(
      user.walletSeed,
      currencyCode,
      issuerAddress,
      1000000 // Default trust limit
    );

    if (!trustLineResult.success) {
      return errorResponse(`Failed to set up trust line: ${trustLineResult.error}`);
    }

    // Place buy order
    const r = await apiHelper.buyTokens({
      buyerSeed: user.walletSeed,
      currencyCode,
      issuerAddress,
      tokenAmount: Number(tokenAmount),
      pricePerToken: Number(pricePerToken),
    });

    if (!r.success) {
      return NextResponse.json(r, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        type: 'buy',
        tokenAmount: Number(tokenAmount),
        pricePerToken: Number(pricePerToken),
        totalXrp: totalCost,
        currencyCode,
        issuerAddress,
        txHash: r.data?.txHash,
      },
      trustLine: trustLineResult.data,
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
