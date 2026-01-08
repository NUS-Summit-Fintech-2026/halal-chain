import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const BONDS_BUCKET = process.env.SUPABASE_BONDS_BUCKET || 'Bonds';

// POST /api/bonds/code/[code]/upload - Upload document for bond
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const bond = await (prisma as any).bond.findUnique({ where: { code } });
    if (!bond) {
      return errorResponse('Bond not found', 404);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('file is required');
    }

    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return errorResponse('Only pdf/png/jpg/webp allowed');
    }

    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const objectPath = `bonds/${bond.code}/${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await supabase.storage
      .from(BONDS_BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (upErr) {
      return errorResponse(upErr.message);
    }

    const { data } = supabase.storage.from(BONDS_BUCKET).getPublicUrl(objectPath);
    const fileUrl = data.publicUrl;

    const updated = await (prisma as any).bond.update({
      where: { id: bond.id },
      data: { fileUrl },
    });

    return NextResponse.json({
      success: true,
      bond: updated,
      file: {
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        fileUrl,
        objectPath,
      },
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
