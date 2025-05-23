
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

    // Find user by ID and explicitly select passwordHash to ensure it's fetched
    // The User model's toObject/toJSON transform will now keep it unless deleted by API logic.
    const user = await UserModel.findById(id).select('+passwordHash');

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: user.toObject() }, { status: 200 });
  } catch (error: any) {
    console.error(`Error fetching user with ID ${id}:`, error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Update a user by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid or missing user ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const body = await request.json();

    // Fields that can be updated
    const { name, email, role, contactNo, address, idProofType, addressProofType } = body;

    // Construct update object carefully to avoid overwriting fields with undefined
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (role !== undefined) updateData.role = role;
    if (contactNo !== undefined) updateData.contactNo = contactNo;
    if (address !== undefined) updateData.address = address;
    if (idProofType !== undefined) updateData.idProofType = idProofType;
    if (addressProofType !== undefined) updateData.addressProofType = addressProofType;


    // Prevent password update through this endpoint
    if (body.password || body.passwordHash) {
      return NextResponse.json({ success: false, message: 'Password updates are not allowed through this endpoint. Use a dedicated password reset flow.' }, { status: 400 });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('+passwordHash');

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'User not found or could not be updated' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser.toObject(), message: 'User updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating user with ID ${id}:`, error);
     if (error.name === 'ValidationError') {
        let errors = {};
        Object.keys(error.errors).forEach((key) => {
            (errors as any)[key] = error.errors[key].message;
        });
        return NextResponse.json({ success: false, message: 'Validation Error', errors }, { status: 400 });
    }
    if (error.code === 11000) { // Duplicate key error (e.g., email already exists)
        return NextResponse.json({ success: false, message: 'Email already in use by another account.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error during user update' }, { status: 500 });
  }
}

// Delete a user by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid or missing user ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const deletedUser = await UserModel.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    
    // TODO: Consider implications for associated data, e.g., loan applications.
    // For now, it's a hard delete of the user.

    return NextResponse.json({ success: true, message: 'User deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting user with ID ${id}:`, error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
