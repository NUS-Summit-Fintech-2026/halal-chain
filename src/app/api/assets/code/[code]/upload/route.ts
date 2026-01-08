import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const ASSETS_BUCKET = process.env.SUPABASE_ASSETS_BUCKET || 'Assets';

// POST /api/assets/code/[code]/upload - Upload file for asset
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const asset = await (prisma as any).realAsset.findUnique({ where: { code } });
    if (!asset) {
      return errorResponse('Asset not found', 404);
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
    const objectPath = `assets/${asset.code}/${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await supabase.storage
      .from(ASSETS_BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (upErr) {
      return errorResponse(upErr.message);
    }

    const { data } = supabase.storage.from(ASSETS_BUCKET).getPublicUrl(objectPath);
    const fileUrl = data.publicUrl;

    // Create file record
    const fileRow = await (prisma as any).assetFile.create({
      data: {
        assetId: asset.id,
        url: fileUrl,
        mimeType: file.type,
        fileName: file.name,
        size: file.size,
      },
    });

    return NextResponse.json({
      success: true,
      asset: { id: asset.id, code: asset.code },
      file: fileRow,
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
