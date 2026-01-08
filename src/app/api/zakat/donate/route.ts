import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, requireUser } from '@/lib/api-utils';

const ZAKAT_RATE = 0.025; // 2.5%

// POST /api/zakat/donate - Donate Zakat (2.5% of XRP) to a charity
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireUser(request);
    if (error) return error;

    const apiHelper = await import('@/app/tool/apiHelper.js') as any;
    const body = await request.json();
    const { charityId } = body;

    if (!charityId) {
      return errorResponse('charityId is required');
    }

    // Find the charity
    const charity = await prisma.charity.findUnique({ where: { id: charityId } });
    if (!charity) {
      return errorResponse('Charity not found', 404);
    }

    // Get user's XRP balance
    const balanceResult = await apiHelper.getWalletBalances(user.walletAddress);
    if (!balanceResult.success) {
      return errorResponse(`Failed to check balance: ${balanceResult.error}`);
    }

    const xrpBalance = balanceResult.data.balances.find(
      (b: { currency: string }) => b.currency === 'XRP'
    );
    const availableXrp = xrpBalance ? parseFloat(xrpBalance.value) : 0;

    // Reserve buffer (10 XRP base reserve + 5 XRP buffer)
    const reserveBuffer = 15;
    const donateableXrp = Math.max(0, availableXrp - reserveBuffer);

    if (donateableXrp <= 0) {
      return errorResponse(`Insufficient XRP balance. You have ${availableXrp.toFixed(2)} XRP but ${reserveBuffer} XRP is reserved.`);
    }

    // Calculate Zakat amount (2.5%) - round to 2 decimal places to avoid XRP precision issues
    const zakatAmount = Math.round(donateableXrp * ZAKAT_RATE * 100) / 100;

    if (zakatAmount < 0.01) {
      return errorResponse('Zakat amount too small to donate (minimum 0.01 XRP)');
    }

    // Send XRP payment to charity
    const paymentResult = await apiHelper.sendXrpPayment({
      senderSeed: user.walletSeed,
      destinationAddress: charity.walletAddress,
      xrpAmount: zakatAmount,
    });

    if (!paymentResult.success) {
      return errorResponse(`Payment failed: ${paymentResult.error}`);
    }

    // Record the donation
    const donation = await prisma.donation.create({
      data: {
        charityId: charity.id,
        donorAddress: user.walletAddress,
        donorEmail: user.email,
        xrpAmount: zakatAmount,
        txHash: paymentResult.data.txHash,
      },
    });

    // Update charity's total received
    await prisma.charity.update({
      where: { id: charity.id },
      data: {
        totalReceived: {
          increment: zakatAmount,
        },
      },
    });

    return NextResponse.json({
      success: true,
      donation: {
        id: donation.id,
        charityName: charity.name,
        xrpAmount: zakatAmount,
        txHash: paymentResult.data.txHash,
        zakatRate: `${ZAKAT_RATE * 100}%`,
        donorBalance: availableXrp,
        donateableBalance: donateableXrp,
      },
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
