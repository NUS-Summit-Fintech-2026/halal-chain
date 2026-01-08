import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'halal-chain';

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

// PUT /api/bonds/[id] - Update bond by ID (supports FormData with file)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contentType = request.headers.get('content-type') || '';

    // Check if bond exists
    const existing = await (prisma as any).bond.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Bond not found', 404);
    }

    // Don't allow editing published bonds
    if (existing.status === 'PUBLISHED') {
      return errorResponse('Cannot edit a published bond');
    }

    let name: string | undefined, description: string | undefined, totalTokens: number | undefined;
    let profitRate: number | undefined, maturityAt: string | null | undefined;
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = formData.get('name') as string || undefined;
      description = formData.get('description') as string || undefined;
      const totalTokensStr = formData.get('totalTokens') as string;
      totalTokens = totalTokensStr ? Number(totalTokensStr) : undefined;
      const profitRateStr = formData.get('profitRate') as string;
      profitRate = profitRateStr ? Number(profitRateStr) : undefined;
      maturityAt = formData.get('maturityAt') as string | null;
      file = formData.get('file') as File | null;
    } else {
      const body = await request.json();
      name = body.name;
      description = body.description;
      totalTokens = body.totalTokens;
      profitRate = body.profitRate;
      maturityAt = body.maturityAt;
    }

    // Upload file if provided
    let fileUrl: string | undefined;
    if (file && file.size > 0) {
      const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
      if (!allowed.includes(file.type)) {
        return errorResponse('Only pdf/png/jpg/webp allowed');
      }

      const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      const objectPath = `bonds/${existing.code}/${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: upErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(objectPath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (upErr) {
        return errorResponse(`File upload failed: ${upErr.message}`);
      }

      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(objectPath);
      fileUrl = data.publicUrl;
    }

    // Update bond
    const updated = await (prisma as any).bond.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        description: description ?? existing.description,
        totalTokens: totalTokens ?? existing.totalTokens,
        profitRate: profitRate ?? existing.profitRate,
        maturityAt: maturityAt !== undefined
          ? (maturityAt ? new Date(maturityAt) : null)
          : existing.maturityAt,
        fileUrl: fileUrl ?? existing.fileUrl,
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
