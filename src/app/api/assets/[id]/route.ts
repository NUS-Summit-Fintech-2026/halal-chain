import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// GET /api/assets/[id] - Get asset by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asset = await (prisma as any).realAsset.findUnique({
      where: { id },
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
