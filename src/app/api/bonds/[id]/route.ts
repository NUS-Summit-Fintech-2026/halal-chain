import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// GET /api/bonds/[id] - Get bond by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bond = await (prisma as any).bond.findUnique({ where: { id } });

    if (!bond) {
      return errorResponse('Bond not found', 404);
    }

    return NextResponse.json(bond);
  } catch (e) {
    return errorResponse(String(e));
  }
}

// DELETE /api/bonds/[id] - Delete bond by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await (prisma as any).bond.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(String(e));
  }
}
