import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// GET /api/realassets/[id] - Get real asset by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const asset = await prisma.realAsset.findUnique({ where: { id } });

    if (!asset) {
      return errorResponse('Real asset not found', 404);
    }

    return NextResponse.json(asset);
  } catch (e) {
    return errorResponse(String(e));
  }
}

// PUT /api/realassets/[id] - Update real asset by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if asset exists
    const existing = await prisma.realAsset.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Real asset not found', 404);
    }

    // Don't allow editing published/realized assets
    if (existing.status !== 'DRAFT') {
      return errorResponse('Cannot edit a published or realized asset');
    }

    // Update asset
    const updated = await prisma.realAsset.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
        totalTokens: body.totalTokens ?? existing.totalTokens,
        profitRate: body.profitRate ?? existing.profitRate,
        currentValuationXrp: body.currentValuationXrp ?? existing.currentValuationXrp,
      },
    });

    return NextResponse.json({ ok: true, asset: updated });
  } catch (e) {
    return errorResponse(String(e));
  }
}

// DELETE /api/realassets/[id] - Delete real asset by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if asset exists and is draft
    const existing = await prisma.realAsset.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Real asset not found', 404);
    }

    if (existing.status !== 'DRAFT') {
      return errorResponse('Cannot delete a published or realized asset');
    }

    await prisma.realAsset.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(String(e));
  }
}
