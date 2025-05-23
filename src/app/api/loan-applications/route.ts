
// src/app/api/loan-applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanApplicationModel from '@/models/LoanApplication';
import UserModel from '@/models/User'; // To find user by email
import type { LoanApplicationFormValues } from '@/components/custom/DetailedLoanApplicationForm';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body: LoanApplicationFormValues = await request.json();

    // Find user by email to get their ID for borrowerUserId
    // In a real app, user ID would come from authenticated session
    const borrower = await UserModel.findOne({ email: body.borrowerEmail });
    if (!borrower) {
      return NextResponse.json({ success: false, message: 'Borrower not found with the provided email.' }, { status: 404 });
    }

    // Prepare data for LoanApplicationModel
    // This is a simplified mapping. Document URLs will be handled later.
    const loanApplicationData: any = {
      borrowerUserId: borrower._id,
      applicationDate: new Date(),
      requestedAmount: body.loanAmount,
      purpose: body.loanPurpose,
      status: 'QueryInitiated', // Initial status
      // Borrower details (denormalized for easier display or link to BorrowerProfile)
      // These fields are not directly in LoanApplication model in types.ts but often useful.
      // For now, assuming these are part of User model or a separate BorrowerProfile
      // borrowerFullName: body.borrowerFullName, (already on user)
      // borrowerContactNo: body.borrowerContactNo, (already on user)
      // borrowerEmail: body.borrowerEmail, (already on user)

      // Store filenames as placeholders for document URLs
      borrowerIdProofDocumentName: body.borrowerIdProofDocument?.name,
      borrowerAddressProofDocumentName: body.borrowerAddressProofDocument?.name,
    };

    if (body.hasGuarantor && body.guarantor) {
      loanApplicationData.guarantor = {
        fullName: body.guarantor.fullName,
        address: body.guarantor.address,
        contactNo: body.guarantor.contactNo,
        idProofType: body.guarantor.idProofType,
        // idProofDocumentUrl: placeholder for body.guarantor.idProofDocument.name,
        addressProofType: body.guarantor.addressProofType,
        // addressProofDocumentUrl: placeholder for body.guarantor.addressProofDocument.name,
      };
    }

    if (body.collaterals && body.collaterals.length > 0) {
      loanApplicationData.submittedCollateral = body.collaterals.map(col => ({
        type: col.type,
        description: col.description,
        estimatedValue: col.estimatedValue,
        // Store filenames as placeholders for URLs
        // atmCardFrontImageUrl: col.atmCardFrontImage?.name,
        // ... and so on for other collateral document fields
      }));
    }
    
    // TODO: Add more fields from body to loanApplicationData as per your Mongoose schema

    const newLoanApplication = new LoanApplicationModel(loanApplicationData);
    await newLoanApplication.save();

    return NextResponse.json({ success: true, message: 'Loan application submitted successfully', loanApplication: newLoanApplication.toObject() }, { status: 201 });
  } catch (error: any) {
    console.error('Loan application submission error:', error);
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

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    // TODO: Add population for borrowerUserId to get borrower details
    const applications = await LoanApplicationModel.find({}).populate('borrowerUserId', 'name email').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, applications }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching loan applications:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
