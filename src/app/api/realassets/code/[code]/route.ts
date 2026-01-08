import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// GET /api/realassets/code/[code] - Get real asset by code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const asset = await prisma.realAsset.findUnique({ where: { code } });

    if (!asset) {
      return errorResponse('Real asset not found', 404);
    }

    return NextResponse.json(asset);
  } catch (e) {
    return errorResponse(String(e));
  }
}
