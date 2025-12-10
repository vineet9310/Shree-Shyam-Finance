// src/app/api/users/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import UserModel from '@/models/User';
import connectDB from '@/lib/mongodb';
import nodemailer from 'nodemailer';
import { checkRateLimit, getClientIP, STRICT_RATE_LIMIT } from '@/lib/rate-limit';

// Configure Nodemailer transporter
function getTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials not configured');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function POST(request: NextRequest) {
  // Rate limiting check first (doesn't need DB)
  try {
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`forgot-password:${clientIP}`, STRICT_RATE_LIMIT);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many password reset attempts. Please try again later.' },
        { status: 429 }
      );
    }
  } catch (rateLimitError) {
    console.error('Rate limit error:', rateLimitError);
    // Continue without rate limiting if it fails
  }

  // Parse request body
  let email: string;
  try {
    const body = await request.json();
    email = body.email;
  } catch (e) {
    return NextResponse.json(
      { success: false, message: 'Invalid request body.' },
      { status: 400 }
    );
  }

  if (!email) {
    return NextResponse.json(
      { success: false, message: 'Email is required.' },
      { status: 400 }
    );
  }

  // Connect to database
  try {
    await connectDB();
  } catch (dbError: any) {
    console.error('Database connection error:', dbError.message);
    return NextResponse.json(
      { success: false, message: 'Server temporarily unavailable. Please try again later.' },
      { status: 503 }
    );
  }

  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() });

    // For security, always return success even if user doesn't exist
    if (!user) {
      console.log(`Forgot password attempt for non-existent email: ${email}`);
      return NextResponse.json(
        { success: true, message: 'If a matching account is found, a password reset OTP has been sent to your email.' },
        { status: 200 }
      );
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user
    user.passwordResetOtp = otp;
    user.passwordResetOtpExpires = otpExpires;
    await user.save();

    // Try to send email
    const transporter = getTransporter();

    if (transporter) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Your Password Reset OTP for Shree Shyam Finance',
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #0056b3;">Password Reset Request</h2>
              <p>Hello ${user.name},</p>
              <p>You have requested to reset your password for your Shree Shyam Finance account.</p>
              <p>Your One-Time Password (OTP) is: <strong style="font-size: 24px; color: #0056b3;">${otp}</strong></p>
              <p>This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
              <p>If you did not request a password reset, please ignore this email.</p>
              <p>Thank you,<br/>The Shree Shyam Finance Team</p>
            </div>
          `,
          text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);
      } catch (emailError: any) {
        console.error('Failed to send OTP email:', emailError.message);
        // In dev mode, log the OTP to console
        console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
      }
    } else {
      // Dev mode - log OTP to console
      console.log(`[DEV MODE] Email not configured. OTP for ${email}: ${otp}`);
    }

    return NextResponse.json(
      { success: true, message: 'If a matching account is found, a password reset OTP has been sent to your email.' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
