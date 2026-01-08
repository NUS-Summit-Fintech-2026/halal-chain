// =============================================================================
// DEPRECATED: This API is no longer used.
// User management is handled via /api/auth/signin and /api/auth/signup.
// =============================================================================

// import { NextRequest, NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';

// type Params = Promise<{ id: string }>;

// // GET /api/users/[id] - Get a single user
// export async function GET(
//   request: NextRequest,
//   { params }: { params: Params }
// ) {
//   try {
//     const { id } = await params;

//     const user = await prisma.user.findUnique({
//       where: { id },
//     });

//     if (!user) {
//       return NextResponse.json(
//         { error: 'User not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(user);
//   } catch (error) {
//     console.error('Failed to fetch user:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch user' },
//       { status: 500 }
//     );
//   }
// }

// // PATCH /api/users/[id] - Update a user
// export async function PATCH(
//   request: NextRequest,
//   { params }: { params: Params }
// ) {
//   try {
//     const { id } = await params;
//     const body = await request.json();
//     const { email, name } = body;

//     const user = await prisma.user.update({
//       where: { id },
//       data: {
//         ...(email && { email }),
//         ...(name !== undefined && { name }),
//       },
//     });

//     return NextResponse.json(user);
//   } catch (error: unknown) {
//     console.error('Failed to update user:', error);

//     if (
//       error &&
//       typeof error === 'object' &&
//       'code' in error &&
//       error.code === 'P2025'
//     ) {
//       return NextResponse.json(
//         { error: 'User not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(
//       { error: 'Failed to update user' },
//       { status: 500 }
//     );
//   }
// }

// // DELETE /api/users/[id] - Delete a user
// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: Params }
// ) {
//   try {
//     const { id } = await params;

//     await prisma.user.delete({
//       where: { id },
//     });

//     return NextResponse.json({ message: 'User deleted successfully' });
//   } catch (error: unknown) {
//     console.error('Failed to delete user:', error);

//     if (
//       error &&
//       typeof error === 'object' &&
//       'code' in error &&
//       error.code === 'P2025'
//     ) {
//       return NextResponse.json(
//         { error: 'User not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(
//       { error: 'Failed to delete user' },
//       { status: 500 }
//     );
//   }
// }
