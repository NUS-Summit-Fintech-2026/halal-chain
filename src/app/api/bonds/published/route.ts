import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// GET /api/bonds/published - Get all published bonds for marketplace
export async function GET(request: NextRequest) {
  try {
    const bonds = await (prisma as any).bond.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bonds);
  } catch (e) {
    return errorResponse(String(e));
  }
}
