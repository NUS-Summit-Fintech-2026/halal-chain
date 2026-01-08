import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// GET /api/realassets/published - List published real assets only
export async function GET() {
  try {
    const assets = await prisma.realAsset.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(assets);
  } catch (e) {
    return errorResponse(String(e));
  }
}
