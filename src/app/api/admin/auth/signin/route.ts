import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// POST /api/admin/auth/signin - Admin sign in with email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return errorResponse('Email is required');
    }

    // Validate email format (must end with @admin)
    if (!email.endsWith('@admin')) {
      return errorResponse('Invalid admin email format. Must end with @admin');
    }

    // Find admin
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return errorResponse('Admin not found. Please sign up first.', 404);
    }

    return NextResponse.json({
      ok: true,
      admin: {
        id: admin.id,
        email: admin.email,
      },
    });
  } catch (e) {
    return errorResponse(String(e));
  }
}
