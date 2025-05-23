
// src/app/api/users/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
// In a real app, you'd use a library like bcrypt for password hashing
// import bcrypt from 'bcryptjs'; 

export async function POST(request: NextRequest) {
  try {
    await dbConnect(); // Establish connection first

    const body = await request.json();
    const { name, email, password, role, contactNo, address, idProofType, addressProofType } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Name, email, and password are required' }, { status: 400 });
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() }); // Normalize email for check
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User with this email already exists' }, { status: 409 });
    }

    // const salt = await bcrypt.genSalt(10);
    // const passwordHash = await bcrypt.hash(password, salt);
    // For now, storing password as plain text (NOT FOR PRODUCTION)
    const passwordHash = password; // Replace with actual hashing

    // Construct payload carefully, only including optional fields if they exist
    const newUserPayload: any = {
      name,
      email: email.toLowerCase(), // Store email in lowercase
      passwordHash,
      role: role || 'user',
    };
    if (contactNo) newUserPayload.contactNo = contactNo;
    if (address) newUserPayload.address = address;
    if (idProofType) newUserPayload.idProofType = idProofType;
    if (addressProofType) newUserPayload.addressProofType = addressProofType;
    // Note: Document URLs (e.g., idProofDocumentUrl) are not handled here yet,
    // they would be set after file uploads in a more complete implementation.

    const newUser = new UserModel(newUserPayload);
    await newUser.save();
    
    const userResponse = newUser.toObject(); // Use toObject to apply transforms (remove passwordHash)

    return NextResponse.json({ success: true, message: 'User registered successfully', user: userResponse }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error); // Full error for server logs

    let errorMessage = 'An internal server error occurred during registration.';
    let statusCode = 500;

    if (error.name === 'ValidationError') {
      let errors = {};
      Object.keys(error.errors).forEach((key) => {
        (errors as any)[key] = error.errors[key].message;
      });
      return NextResponse.json({ success: false, message: 'Validation Error', errors }, { status: 400 });
    }
    
    // Handle MongoDB duplicate key error (code 11000) for unique indexes like email
    if (error.code === 11000) {
      errorMessage = 'An account with this email already exists. Please use a different email.';
      statusCode = 409; // Conflict
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return NextResponse.json({ success: false, message: errorMessage }, { status: statusCode });
  }
}
