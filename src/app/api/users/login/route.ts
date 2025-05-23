
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

    console.log(`[Login API] Attempting login for email: ${email.toLowerCase()}`);

    // Explicitly select passwordHash to ensure it's fetched
    const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user) {
      console.log(`[Login API] User not found for email: ${email.toLowerCase()}`);
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    console.log(`[Login API] User found for ${email.toLowerCase()}. Checking passwordHash.`);
    console.log(`[Login API] Stored passwordHash is: "${user.passwordHash}" (Type: ${typeof user.passwordHash}, Length: ${user.passwordHash?.length})`);


    // More robust check for passwordHash
    if (!user.passwordHash || typeof user.passwordHash !== 'string' || user.passwordHash.length < 10) { // bcrypt hashes are typically ~60 chars
        console.error(`[Login API] LOGIN_FAIL: User ${email.toLowerCase()} found, but passwordHash field is missing, not a string, or too short.`);
        return NextResponse.json({ success: false, message: 'Account configuration error. Please contact support.' }, { status: 500 });
    }

    console.log(`[Login API] Comparing form password "${password.substring(0, 3)}..." (length: ${password.length}) with stored hash for user ${email.toLowerCase()}.`);
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(`[Login API] bcrypt.compare result for ${email.toLowerCase()}: ${isMatch}`);

    if (!isMatch) {
      console.log(`[Login API] Password mismatch for user: ${email.toLowerCase()}`);
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    // User authenticated successfully
    const userResponse = user.toObject(); // Excludes passwordHash due to schema transform

    console.log(`[Login API] Login successful for user: ${email.toLowerCase()}`);
    return NextResponse.json({ success: true, message: 'Login successful', user: userResponse }, { status: 200 });

  } catch (error: any) {
    console.error('[Login API] Login error:', error);
    // Log the full error object for more details, especially for unexpected errors
    console.error('[Login API] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json({ success: false, message: error.message || 'An internal server error occurred during login.' }, { status: 500 });
  }
}
