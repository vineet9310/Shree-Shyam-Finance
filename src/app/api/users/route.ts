
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    // For admin, ideally, add role-based access control here
    const users = await UserModel.find({}).select('-passwordHash'); // Exclude password hash
    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
