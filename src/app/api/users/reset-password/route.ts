// src/app/api/users/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import UserModel from '@/models/User'; // Import your User model
import connectDB from '@/lib/mongodb'; // Import your DB connection utility
import bcrypt from 'bcryptjs'; // For hashing new password

export async function POST(request: NextRequest) {
  await connectDB(); // Connect to MongoDB

  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ success: false, message: 'Email, OTP, and new password are required.' }, { status: 400 });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      // For security, return a generic error message
      return NextResponse.json({ success: false, message: 'Invalid request or user not found.' }, { status: 400 });
    }

    // Check if OTP matches and is not expired
    if (!user.passwordResetOtp || user.passwordResetOtp !== otp || !user.passwordResetOtpExpires || user.passwordResetOtpExpires < new Date()) {
      return NextResponse.json({ success: false, message: 'Invalid or expired OTP.' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 is the salt rounds

    // Update user's password and clear OTP fields
    user.passwordHash = hashedPassword; // Assuming your User model uses passwordHash
    user.passwordResetOtp = undefined; // Clear OTP
    user.passwordResetOtpExpires = undefined; // Clear OTP expiry
    await user.save();

    return NextResponse.json({ success: true, message: 'Password has been reset successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Reset password API error:', error);
    return NextResponse.json({ success: false, message: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
