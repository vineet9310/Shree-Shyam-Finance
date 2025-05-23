
// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
import mongoose from 'mongoose';

// Get a single user by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid or missing user ID' }, { status: 400 });
  }

  try {
    await dbConnect();

    // Find user by ID and explicitly exclude passwordHash
    const user = await UserModel.findById(id).select('-passwordHash');

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: user.toObject() }, { status: 200 });
  } catch (error: any) {
    console.error(`Error fetching user with ID ${id}:`, error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Update a user by ID (Placeholder)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  // const body = await request.json();
  // TODO: Implement logic to update user details
  // Ensure to handle password changes separately and securely (e.g., re-hashing)
  // Do not allow direct passwordHash updates from client
  return NextResponse.json({ success: false, message: `PUT method for user ${id} not implemented yet.` }, { status: 405 });
}

// Delete a user by ID (Placeholder)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  // TODO: Implement logic to delete user
  // Consider soft delete vs. hard delete and implications (e.g., associated loan applications)
  return NextResponse.json({ success: false, message: `DELETE method for user ${id} not implemented yet.` }, { status: 405 });
}
