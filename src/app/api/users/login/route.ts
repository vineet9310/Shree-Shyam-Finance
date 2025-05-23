
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

    const lowercasedEmail = email.toLowerCase();
    console.log(`[Login API] Attempting login for email: ${lowercasedEmail}`);
    console.log(`[Login API] Plain text password received (length): ${password.length}, first 3 chars: "${password.substring(0,3)}"`);

    // Explicitly select passwordHash to ensure it's fetched
    const user = await UserModel.findOne({ email: lowercasedEmail }).select('+passwordHash');

    if (!user) {
      console.log(`[Login API] User not found for email: ${lowercasedEmail}`);
      return NextResponse.json({ success: false, message: 'Invalid credentials (user not found)' }, { status: 401 });
    }
    
    console.log(`[Login API] User found for ${lowercasedEmail}.`);

    if (!user.passwordHash) {
        console.error(`[Login API] LOGIN_FAIL: User ${lowercasedEmail} found, but passwordHash field is MISSING or null.`);
        return NextResponse.json({ success: false, message: 'Account configuration error (missing hash). Please contact support.' }, { status: 500 });
    }
    
    if (typeof user.passwordHash !== 'string') {
        console.error(`[Login API] LOGIN_FAIL: User ${lowercasedEmail} found, but passwordHash is NOT A STRING. Type: ${typeof user.passwordHash}`);
        return NextResponse.json({ success: false, message: 'Account configuration error (hash type). Please contact support.' }, { status: 500 });
    }

    if (user.passwordHash.length < 10) { // bcrypt hashes are typically ~60 chars
        console.error(`[Login API] LOGIN_FAIL: User ${lowercasedEmail} found, but passwordHash field is too short. Length: ${user.passwordHash.length}`);
        return NextResponse.json({ success: false, message: 'Account configuration error (hash length). Please contact support.' }, { status: 500 });
    }

    console.log(`[Login API] Stored passwordHash for ${lowercasedEmail} (type: ${typeof user.passwordHash}, length: ${user.passwordHash.length}): "${user.passwordHash.substring(0,10)}..."`);

    let isMatch = false;
    try {
        // Ensure both `password` (plain text) and `user.passwordHash` (from DB) are strings
        if (typeof password !== 'string') {
            console.error(`[Login API] bcrypt.compare error: Plain text password is not a string. Type: ${typeof password}`);
            return NextResponse.json({ success: false, message: 'Error during password verification (input type).' }, { status: 500 });
        }
        isMatch = await bcrypt.compare(password, user.passwordHash);
    } catch (compareError) {
        console.error(`[Login API] bcrypt.compare threw an error for ${lowercasedEmail}:`, compareError);
        return NextResponse.json({ success: false, message: 'Error during password verification (compare fn).' }, { status: 500 });
    }
    
    console.log(`[Login API] bcrypt.compare result for ${lowercasedEmail}: ${isMatch}`);

    if (!isMatch) {
      console.log(`[Login API] Password mismatch for user: ${lowercasedEmail}`);
      return NextResponse.json({ success: false, message: 'Invalid credentials (password mismatch)' }, { status: 401 });
    }

    // User authenticated successfully
    // The .toObject() method will use the transform defined in UserSchema to remove passwordHash for the response
    const userResponse = user.toObject(); 

    console.log(`[Login API] Login successful for user: ${lowercasedEmail}`);
    return NextResponse.json({ success: true, message: 'Login successful', user: userResponse }, { status: 200 });

  } catch (error: any) {
    console.error('[Login API] Outer catch block error:', error);
    // Log the full error object for more details, especially for unexpected errors
    // console.error('[Login API] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json({ success: false, message: error.message || 'An internal server error occurred during login.' }, { status: 500 });
  }
}
