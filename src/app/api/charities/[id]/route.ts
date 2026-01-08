import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// GET /api/charities/[id] - Get a single charity with donation history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const charity = await prisma.charity.findUnique({
      where: { id },
      include: {
        donations: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!charity) {
      return errorResponse('Charity not found', 404);
    }

    return NextResponse.json({
      id: charity.id,
      name: charity.name,
      description: charity.description,
      walletAddress: charity.walletAddress,
      totalReceived: charity.totalReceived,
      createdAt: charity.createdAt,
      donations: charity.donations,
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}

// PUT /api/charities/[id] - Update charity details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const charity = await prisma.charity.findUnique({ where: { id } });
    if (!charity) {
      return errorResponse('Charity not found', 404);
    }

    const updated = await prisma.charity.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
      },
    });

    return NextResponse.json({
      ok: true,
      charity: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        walletAddress: updated.walletAddress,
        totalReceived: updated.totalReceived,
      },
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}

// DELETE /api/charities/[id] - Delete a charity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const charity = await prisma.charity.findUnique({ where: { id } });
    if (!charity) {
      return errorResponse('Charity not found', 404);
    }

    await prisma.charity.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(String(e));
  }
}
