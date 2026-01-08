import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, requireUser } from '@/lib/api-utils';

// POST /api/xrpl/sell/[bondCode] - Place a sell order for tokens
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

    // Check if user has enough tokens to sell
    const balanceResult = await apiHelper.getWalletBalances(user.walletAddress);
    if (!balanceResult.success) {
      return errorResponse(`Failed to check balance: ${balanceResult.error}`);
    }

    const tokenBalance = balanceResult.data.balances.find(
      (b: { currency: string; issuer?: string }) =>
        b.currency === currencyCode && b.issuer === issuerAddress
    );

    const availableTokens = tokenBalance ? parseFloat(tokenBalance.value) : 0;
    if (availableTokens < tokenAmount) {
      return errorResponse(`Insufficient token balance. You have ${availableTokens} tokens, trying to sell ${tokenAmount}`);
    }

    // Place sell order
    const r = await apiHelper.sellTokens({
      sellerSeed: user.walletSeed,
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
        type: 'sell',
        tokenAmount: Number(tokenAmount),
        pricePerToken: Number(pricePerToken),
        totalXrp: Number(tokenAmount) * Number(pricePerToken),
        currencyCode,
        issuerAddress,
        txHash: r.data?.txHash,
      },
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
