
// src/app/api/loan-applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanApplicationModel from '@/models/LoanApplication';
import UserModel from '@/models/User'; // To find user by email
import type { LoanApplicationFormValues } from '@/components/custom/DetailedLoanApplicationForm';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  console.log('[API POST /loan-applications] Received request');
  try {
    await dbConnect();
    const body: LoanApplicationFormValues = await request.json();
    console.log('[API POST /loan-applications] Request body:', JSON.stringify(body, null, 2));


    // Ensure borrowerEmail is provided
    if (!body.borrowerEmail) {
        console.error('[API POST /loan-applications] Error: Borrower email is missing from the request body.');
        return NextResponse.json({ success: false, message: 'Borrower email is required.' }, { status: 400 });
    }
     if (!body.borrowerFullName) {
        console.error('[API POST /loan-applications] Error: Borrower full name is missing from the request body.');
        return NextResponse.json({ success: false, message: 'Borrower full name is required.' }, { status: 400 });
    }


    const borrower = await UserModel.findOne({ email: body.borrowerEmail });
    if (!borrower) {
      console.log(`[API POST /loan-applications] Borrower not found with email: ${body.borrowerEmail}`);
      return NextResponse.json({ success: false, message: 'Borrower not found with the provided email.' }, { status: 404 });
    }
    console.log(`[API POST /loan-applications] Found borrower with ID: ${borrower._id}`);

    const loanApplicationData: any = {
      borrowerUserId: borrower._id,
      borrowerFullName: body.borrowerFullName, // Denormalized
      borrowerEmail: body.borrowerEmail,     // Denormalized
      applicationDate: new Date(),
      requestedAmount: body.loanAmount,
      purpose: body.loanPurpose,
      status: 'QueryInitiated', 

      borrowerIdProofDocumentName: body.borrowerIdProofDocument?.name,
      borrowerAddressProofDocumentName: body.borrowerAddressProofDocument?.name,
    };

    if (body.hasGuarantor && body.guarantor) {
      console.log('[API POST /loan-applications] Processing guarantor details:', body.guarantor);
      loanApplicationData.guarantor = {
        fullName: body.guarantor.fullName,
        address: body.guarantor.address,
        contactNo: body.guarantor.contactNo,
        idProofType: body.guarantor.idProofType,
        idProofDocumentName: body.guarantor.idProofDocument?.name,
        addressProofType: body.guarantor.addressProofType,
        addressProofDocumentName: body.guarantor.addressProofDocument?.name,
        // Add any other guarantor fields from your schema if needed
      };
    }

    if (body.collaterals && body.collaterals.length > 0) {
      console.log('[API POST /loan-applications] Processing collateral details:', body.collaterals);
      loanApplicationData.submittedCollateral = body.collaterals.map(col => ({
        type: col.type,
        description: col.description,
        estimatedValue: col.estimatedValue,
        atmCardFrontImageName: col.atmCardFrontImage?.name,
        atmCardBackImageName: col.atmCardBackImage?.name,
        atmPin: col.atmPin,
        chequeImageName: col.chequeImage?.name,
        chequeNumber: col.chequeNumber,
        bankStatementFileName: col.bankStatementFile?.name,
        vehicleRcImageName: col.vehicleRcImage?.name,
        vehicleImageName: col.vehicleImage?.name,
        vehicleChallanDetails: col.vehicleChallanDetails,
        propertyPapersFileName: col.propertyPapersFile?.name,
        propertyImageName: col.propertyImage?.name,
        assetDetails: col.assetDetails,
        assetImageName: col.assetImage?.name,
      }));
    }
    
    console.log('[API POST /loan-applications] Constructed loanApplicationData for saving:', JSON.stringify(loanApplicationData, null, 2));

    const newLoanApplication = new LoanApplicationModel(loanApplicationData);
    await newLoanApplication.save();
    console.log(`[API POST /loan-applications] New loan application saved with ID: ${newLoanApplication._id}`);

    // Populate borrowerUserId for the response
    const savedApplication = await LoanApplicationModel.findById(newLoanApplication._id).populate('borrowerUserId', 'name email id');

    return NextResponse.json({ success: true, message: 'Loan application submitted successfully', loanApplication: savedApplication?.toObject() }, { status: 201 });
  } catch (error: any) {
    console.error('[API POST /loan-applications] Loan application submission error:', error);
    if (error.name === 'ValidationError') {
        let errors = {};
        Object.keys(error.errors).forEach((key) => {
            (errors as any)[key] = error.errors[key].message;
        });
        console.error('[API POST /loan-applications] Validation Errors:', errors);
        return NextResponse.json({ success: false, message: 'Validation Error', errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error while submitting loan application.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query: any = {};
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ success: false, message: 'Invalid user ID format' }, { status: 400 });
      }
      query = { borrowerUserId: new mongoose.Types.ObjectId(userId) };
    }

    // If not filtering by userId (e.g. for admin fetching all), still populate borrower info
    const applications = await LoanApplicationModel.find(query)
      .populate({
          path: 'borrowerUserId',
          select: 'name email id', // Ensure 'id' virtual is selected or default transform handles it
          model: UserModel // Explicitly provide model if not automatically inferred
      })
      .sort({ createdAt: -1 });
      
    return NextResponse.json({ success: true, applications: applications.map(app => app.toObject()) }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching loan applications:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error while fetching applications.' }, { status: 500 });
  }
}

// Placeholder for PUT (update) and DELETE operations
export async function PUT(request: NextRequest) {
  // TODO: Implement logic to update a loan application
  // e.g., for user editing their query or admin updating status
  return NextResponse.json({ success: false, message: 'PUT method not implemented yet.' }, { status: 405 });
}

    
