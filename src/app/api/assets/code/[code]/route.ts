import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// GET /api/assets/code/[code] - Get asset by code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const asset = await (prisma as any).realAsset.findUnique({
      where: { code },
      include: { files: true },
    });

    if (!asset) {
      return errorResponse('Asset not found', 404);
    }

    return NextResponse.json({ success: true, asset });
  } catch (e) {
    return errorResponse(String(e));
  }
}
