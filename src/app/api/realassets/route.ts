import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureIssuerWallet, ensureTreasuryWallet, errorResponse } from '@/lib/api-utils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'halal-chain';

// GET /api/realassets - List all real assets
export async function GET() {
  try {
    const assets = await prisma.realAsset.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(assets);
  } catch (e) {
    return errorResponse(String(e));
  }
}

// POST /api/realassets - Create a new real asset (supports FormData with file)
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let name: string, description: string, code: string, totalTokens: number, profitRate: number;
    let currentValuationXrp: number | null = null;
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = formData.get('name') as string;
      description = formData.get('description') as string;
      code = formData.get('code') as string;
      totalTokens = Number(formData.get('totalTokens'));
      profitRate = Number(formData.get('profitRate'));
      const valuationStr = formData.get('currentValuationXrp') as string;
      currentValuationXrp = valuationStr ? Number(valuationStr) : null;
      file = formData.get('file') as File | null;
    } else {
      const body = await request.json();
      name = body.name;
      description = body.description;
      code = body.code;
      totalTokens = Number(body.totalTokens);
      profitRate = Number(body.profitRate);
      currentValuationXrp = body.currentValuationXrp ? Number(body.currentValuationXrp) : null;
    }

    if (!name || !description || !code) {
      return errorResponse('name, description, code are required');
    }
    if (!totalTokens || totalTokens <= 0) {
      return errorResponse('totalTokens must be > 0');
    }
    if (profitRate == null || Number.isNaN(profitRate)) {
      return errorResponse('profitRate is required (number)');
    }

    // Upload file if provided
    let fileUrl: string | null = null;
    if (file && file.size > 0) {
      const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
      if (!allowed.includes(file.type)) {
        return errorResponse('Only pdf/png/jpg/webp allowed');
      }

      const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      const objectPath = `assets/${code}/${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;
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

    const issuer = await ensureIssuerWallet();
    const treasury = await ensureTreasuryWallet();

    const asset = await prisma.realAsset.create({
      data: {
        name,
        description,
        code,
        totalTokens,
        profitRate,
        currentValuationXrp,
        fileUrl,
        status: 'DRAFT',
        issuerAddress: issuer.address,
        treasuryAddress: treasury.address,
        currencyCode: null,
      },
    });

    return NextResponse.json({
      ok: true,
      asset,
      issuer: { address: issuer.address },
      treasury: { address: treasury.address },
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
