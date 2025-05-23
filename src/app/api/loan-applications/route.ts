
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
      borrowerFullName: body.borrowerFullName,
      borrowerEmail: body.borrowerEmail,
      applicationDate: new Date(),
      requestedAmount: body.loanAmount,
      purpose: body.loanPurpose,
      status: 'QueryInitiated', 

      borrowerIdProofDocumentName: body.borrowerIdProofDocument && body.borrowerIdProofDocument.name ? body.borrowerIdProofDocument.name : undefined,
      borrowerAddressProofDocumentName: body.borrowerAddressProofDocument && body.borrowerAddressProofDocument.name ? body.borrowerAddressProofDocument.name : undefined,
    };

    if (body.hasGuarantor && body.guarantor) {
      console.log('[API POST /loan-applications] Processing guarantor details:', body.guarantor);
      loanApplicationData.guarantor = {
        fullName: body.guarantor.fullName,
        address: body.guarantor.address,
        contactNo: body.guarantor.contactNo,
        idProofType: body.guarantor.idProofType,
        idProofDocumentName: body.guarantor.idProofDocument && body.guarantor.idProofDocument.name ? body.guarantor.idProofDocument.name : undefined,
        addressProofType: body.guarantor.addressProofType,
        addressProofDocumentName: body.guarantor.addressProofDocument && body.guarantor.addressProofDocument.name ? body.guarantor.addressProofDocument.name : undefined,
        // Add any other guarantor fields from your schema if needed
      };
    }

    if (body.collaterals && body.collaterals.length > 0) {
      console.log('[API POST /loan-applications] Processing collateral details:', body.collaterals);
      loanApplicationData.submittedCollateral = body.collaterals.map(col => ({
        type: col.type,
        description: col.description,
        estimatedValue: col.estimatedValue,
        atmCardFrontImageName: col.atmCardFrontImage && col.atmCardFrontImage.name ? col.atmCardFrontImage.name : undefined,
        atmCardBackImageName: col.atmCardBackImage && col.atmCardBackImage.name ? col.atmCardBackImage.name : undefined,
        atmPin: col.atmPin,
        chequeImageName: col.chequeImage && col.chequeImage.name ? col.chequeImage.name : undefined,
        chequeNumber: col.chequeNumber,
        bankStatementFileName: col.bankStatementFile && col.bankStatementFile.name ? col.bankStatementFile.name : undefined,
        vehicleRcImageName: col.vehicleRcImage && col.vehicleRcImage.name ? col.vehicleRcImage.name : undefined,
        vehicleImageName: col.vehicleImage && col.vehicleImage.name ? col.vehicleImage.name : undefined,
        vehicleChallanDetails: col.vehicleChallanDetails,
        propertyPapersFileName: col.propertyPapersFile && col.propertyPapersFile.name ? col.propertyPapersFile.name : undefined,
        propertyImageName: col.propertyImage && col.propertyImage.name ? col.propertyImage.name : undefined,
        assetDetails: col.assetDetails,
        assetImageName: col.assetImage && col.assetImage.name ? col.assetImage.name : undefined,
      }));
    }
    
    console.log('[API POST /loan-applications] Constructed loanApplicationData for saving:', JSON.stringify(loanApplicationData, null, 2));

    const newLoanApplication = new LoanApplicationModel(loanApplicationData);
    await newLoanApplication.save();
    console.log(`[API POST /loan-applications] New loan application saved with ID: ${newLoanApplication._id}`);

    // Populate borrowerUserId for the response
    const savedApplication = await LoanApplicationModel.findById(newLoanApplication._id).populate({
        path: 'borrowerUserId',
        select: 'name email id', 
        model: UserModel 
    });

    return NextResponse.json({ success: true, message: 'Loan application submitted successfully', loanApplication: savedApplication?.toObject() }, { status: 201 });
  } catch (error: any) {
    console.error('[API POST /loan-applications] Loan application submission error:', error);
    if (error.name === 'ValidationError') {
        let errors: Record<string, string> = {};
        for (let field in error.errors) {
            errors[field] = error.errors[field].message;
        }
        console.error('[API POST /loan-applications] Validation Errors:', errors);
        return NextResponse.json({ success: false, message: 'Validation Error', errors }, { status: 400 });
    }
     if (error instanceof TypeError && error.message.includes("reading 'name'")) {
        console.error('[API POST /loan-applications] TypeError accessing .name, possibly on document metadata:', error);
        return NextResponse.json({ success: false, message: `Internal server error processing document data: ${error.message}` }, { status: 500 });
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

    const applications = await LoanApplicationModel.find(query)
      .populate({
          path: 'borrowerUserId',
          select: 'name email id', 
          model: UserModel 
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

    
