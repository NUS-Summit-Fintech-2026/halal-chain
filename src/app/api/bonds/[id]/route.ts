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

// PUT /api/bonds/[id] - Update bond by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if bond exists
    const existing = await (prisma as any).bond.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Bond not found', 404);
    }

    // Don't allow editing published bonds
    if (existing.status === 'PUBLISHED') {
      return errorResponse('Cannot edit a published bond');
    }

    // Update bond
    const updated = await (prisma as any).bond.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
        totalTokens: body.totalTokens ?? existing.totalTokens,
        profitRate: body.profitRate ?? existing.profitRate,
      },
    });

    return NextResponse.json({ ok: true, bond: updated });
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

    // Check if bond exists and is not published
    const existing = await (prisma as any).bond.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Bond not found', 404);
    }

    if (existing.status === 'PUBLISHED') {
      return errorResponse('Cannot delete a published bond');
    }

    await (prisma as any).bond.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(String(e));
  }
}
