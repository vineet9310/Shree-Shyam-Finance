// src/app/api/users/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIP, AUTH_RATE_LIMIT } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limiting check first (doesn't need DB)
  try {
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`login:${clientIP}`, AUTH_RATE_LIMIT);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
          }
        }
      );
    }
  } catch (rateLimitError) {
    console.error('Rate limit error:', rateLimitError);
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      { success: false, message: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: 'Email and password are required' },
      { status: 400 }
    );
  }

  // Connect to database
  try {
    await dbConnect();
  } catch (dbError: any) {
    console.error('[Login API] Database connection error:', dbError.message);
    return NextResponse.json(
      { success: false, message: 'Server temporarily unavailable. Please try again later.' },
      { status: 503 }
    );
  }

  try {
    const lowercasedEmail = email.toLowerCase();
    console.log(`[Login API] Attempting login for email: ${lowercasedEmail}`);

    const user = await UserModel.findOne({ email: lowercasedEmail }).select('+passwordHash');

    if (!user) {
      console.log(`[Login API] User not found for email: ${lowercasedEmail}`);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.passwordHash || typeof user.passwordHash !== 'string' || user.passwordHash.length < 10) {
      console.error(`[Login API] Invalid password hash for user: ${lowercasedEmail}`);
      return NextResponse.json(
        { success: false, message: 'Account configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    } catch (compareError) {
      console.error(`[Login API] bcrypt error:`, compareError);
      return NextResponse.json(
        { success: false, message: 'Error during password verification.' },
        { status: 500 }
      );
    }

    if (!isMatch) {
      console.log(`[Login API] Password mismatch for user: ${lowercasedEmail}`);
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    console.log(`[Login API] Login successful for user: ${lowercasedEmail}`);
    return NextResponse.json(
      { success: true, message: 'Login successful', user: userResponse },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[Login API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
