
// src/app/api/users/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // Ensure passwordHash exists on user object before comparing
    if (!user.passwordHash) {
        console.error(`User ${email} has no passwordHash set. Cannot log in.`);
        return NextResponse.json({ success: false, message: 'Account configuration error. Please contact support.' }, { status: 500 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // User authenticated successfully
    const userResponse = user.toObject(); // Excludes passwordHash due to schema transform

    return NextResponse.json({ success: true, message: 'Login successful', user: userResponse }, { status: 200 });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: error.message || 'An internal server error occurred during login.' }, { status: 500 });
  }
}
