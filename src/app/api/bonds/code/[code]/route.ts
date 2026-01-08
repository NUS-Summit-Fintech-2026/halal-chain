import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// GET /api/bonds/code/[code] - Get bond by code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const bond = await (prisma as any).bond.findUnique({ where: { code } });

    if (!bond) {
      return errorResponse('Bond not found', 404);
    }

    return NextResponse.json(bond);
  } catch (e) {
    return errorResponse(String(e));
  }
}
