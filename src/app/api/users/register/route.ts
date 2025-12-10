// src/app/api/users/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIP, AUTH_RATE_LIMIT } from '@/lib/rate-limit';

// Password strength validation
function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, message: 'Password is strong' };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`register:${clientIP}`, AUTH_RATE_LIMIT);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many registration attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { name, email, password, role, contactNo, address, idProofType, addressProofType } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Name, email, and password are required' }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ success: false, message: passwordValidation.message }, { status: 400 });
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User with this email already exists' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUserPayload: any = {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'user',
    };
    if (contactNo) newUserPayload.contactNo = contactNo;
    if (address) newUserPayload.address = address;
    if (idProofType) newUserPayload.idProofType = idProofType;
    if (addressProofType) newUserPayload.addressProofType = addressProofType;

    const newUser = new UserModel(newUserPayload);
    await newUser.save();

    const userResponse = newUser.toObject();
    console.log("[API /users/register] User registered successfully");

    return NextResponse.json({ success: true, message: 'User registered successfully', user: userResponse }, { status: 201 });

  } catch (error: any) {
    console.error('[API /users/register] Registration error:', error);

    let errorMessage = 'An internal server error occurred during registration.';
    let statusCode = 500;

    if (error.name === 'ValidationError') {
      let errors = {};
      Object.keys(error.errors).forEach((key) => {
        (errors as any)[key] = error.errors[key].message;
      });
      return NextResponse.json({ success: false, message: 'Validation Error', errors }, { status: 400 });
    }

    if (error.code === 11000) {
      errorMessage = 'An account with this email already exists. Please use a different email.';
      statusCode = 409;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return NextResponse.json({ success: false, message: errorMessage }, { status: statusCode });
  }
}
