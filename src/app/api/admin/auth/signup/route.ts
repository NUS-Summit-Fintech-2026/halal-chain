import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

// POST /api/admin/auth/signup - Create new admin account
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

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
      return errorResponse('Admin with this email already exists', 400);
    }

    // Create admin
    const admin = await prisma.admin.create({
      data: { email },
    });

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
