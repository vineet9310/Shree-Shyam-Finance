// src/app/api/users/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import UserModel from '@/models/User'; // Import your User model
import connectDB from '@/lib/mongodb'; // Import your DB connection utility
import crypto from 'crypto'; // For generating OTP
import nodemailer from 'nodemailer'; // For sending emails

// Configure Nodemailer transporter (replace with your actual email service details)
const transporter = nodemailer.createTransport({
  service: 'gmail', // e.g., 'gmail', 'SendGrid', etc.
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app-specific password
  },
});

export async function POST(request: NextRequest) {
  await connectDB(); // Connect to MongoDB

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 });
    }

    const user = await UserModel.findOne({ email }); // Find user by email

    // Important: For security, always return a generic success message
    // even if the user does not exist, to prevent email enumeration.
    if (!user) {
      console.log(`Forgot password attempt for non-existent email: ${email}`);
      return NextResponse.json({ success: true, message: 'If a matching account is found, a password reset OTP has been sent to your email.' }, { status: 200 });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Set OTP expiry to 10 minutes from now
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP and expiry to the user document
    user.passwordResetOtp = otp; // Store OTP in user model
    user.passwordResetOtpExpires = otpExpires; // Store OTP expiry
    await user.save(); // Save updated user

    // Send email with OTP
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Password Reset OTP for Shree Shyam Finance',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0056b3;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You have requested to reset your password for your Shree Shyam Finance account.</p>
          <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
          <p>This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Thank you,<br/>The Shree Shyam Finance Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'If a matching account is found, a password reset OTP has been sent to your email.' }, { status: 200 });

  } catch (error: any) {
    console.error('Forgot password API error:', error);
    return NextResponse.json({ success: false, message: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
