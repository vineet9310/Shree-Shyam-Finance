
// src/app/api/users/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';
// In a real app, you'd use a library like bcrypt for password hashing
// import bcrypt from 'bcryptjs'; 

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, email, password, role, contactNo, address, idProofType, addressProofType } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Name, email, and password are required' }, { status: 400 });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User with this email already exists' }, { status: 409 });
    }

    // const salt = await bcrypt.genSalt(10);
    // const passwordHash = await bcrypt.hash(password, salt);
    // For now, storing password as plain text (NOT FOR PRODUCTION)
    const passwordHash = password; // Replace with actual hashing

    const newUser = new UserModel({
      name,
      email,
      passwordHash, // Store hashed password
      role: role || 'user',
      contactNo,
      address,
      idProofType,
      // idProofDocumentUrl: "placeholder_id_url", // Will be set after file upload
      addressProofType,
      // addressProofDocumentUrl: "placeholder_address_proof_url", // Will be set after file upload
    });

    await newUser.save();
    const userResponse = newUser.toObject(); // Use toObject to apply transforms (remove passwordHash)

    return NextResponse.json({ success: true, message: 'User registered successfully', user: userResponse }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    // Mongoose validation error
    if (error.name === 'ValidationError') {
        let errors = {};
        Object.keys(error.errors).forEach((key) => {
            (errors as any)[key] = error.errors[key].message;
        });
        return NextResponse.json({ success: false, message: 'Validation Error', errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
