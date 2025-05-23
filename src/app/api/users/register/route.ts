
// src/app/api/users/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
import bcrypt from 'bcryptjs'; 

export async function POST(request: NextRequest) {
  try {
    await dbConnect(); 

    const body = await request.json();
    const { name, email, password, role, contactNo, address, idProofType, addressProofType } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Name, email, and password are required' }, { status: 400 });
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
      passwordHash, // Store hashed password
      role: role || 'user',
    };
    if (contactNo) newUserPayload.contactNo = contactNo;
    if (address) newUserPayload.address = address;
    if (idProofType) newUserPayload.idProofType = idProofType;
    if (addressProofType) newUserPayload.addressProofType = addressProofType;
    
    const newUser = new UserModel(newUserPayload);
    await newUser.save();
    
    const userResponse = newUser.toObject(); 

    return NextResponse.json({ success: true, message: 'User registered successfully', user: userResponse }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error); 

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
