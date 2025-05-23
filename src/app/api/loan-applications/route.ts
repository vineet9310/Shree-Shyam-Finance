
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

    const borrower = await UserModel.findOne({ email: body.borrowerEmail });
    if (!borrower) {
      return NextResponse.json({ success: false, message: 'Borrower not found with the provided email.' }, { status: 404 });
    }

    const loanApplicationData: any = {
      borrowerUserId: borrower._id,
      applicationDate: new Date(),
      requestedAmount: body.loanAmount,
      purpose: body.loanPurpose,
      status: 'QueryInitiated', // Initial status for new applications

      // Storing borrower's current details from the form directly on the application
      // This can be useful for historical record keeping even if user details change later
      // These fields are not in the Mongoose schema yet, would need to add them if this denormalization is desired
      // For now, relying on borrowerUserId population.

      // Document names (placeholders for actual URLs after file upload implementation)
      borrowerIdProofDocumentName: body.borrowerIdProofDocument?.name,
      borrowerAddressProofDocumentName: body.borrowerAddressProofDocument?.name,
      
      // Include more fields from the form to be saved in the model
      // Example: borrowerFullName: body.borrowerFullName, (if you add this to schema)
    };

    if (body.hasGuarantor && body.guarantor) {
      loanApplicationData.guarantor = {
        fullName: body.guarantor.fullName,
        address: body.guarantor.address,
        contactNo: body.guarantor.contactNo,
        idProofType: body.guarantor.idProofType,
        idProofDocumentName: body.guarantor.idProofDocument?.name, // Store name
        addressProofType: body.guarantor.addressProofType,
        addressProofDocumentName: body.guarantor.addressProofDocument?.name, // Store name
      };
    }

    if (body.collaterals && body.collaterals.length > 0) {
      loanApplicationData.submittedCollateral = body.collaterals.map(col => ({
        type: col.type,
        description: col.description,
        estimatedValue: col.estimatedValue,
        // Store document names as placeholders
        atmCardFrontImageName: col.atmCardFrontImage?.name,
        atmCardBackImageName: col.atmCardBackImage?.name,
        atmPin: col.atmPin, // NB: Security risk
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
        // additionalDocuments: col.additionalDocuments?.map(f => f.name) // if storing names
      }));
    }
    
    // TODO: Add more fields from `body` to `loanApplicationData` as per your Mongoose schema structure
    // for guarantor and collateral document file names.

    const newLoanApplication = new LoanApplicationModel(loanApplicationData);
    await newLoanApplication.save();

    // Populate borrowerUserId for the response
    const savedApplication = await LoanApplicationModel.findById(newLoanApplication._id).populate('borrowerUserId', 'name email');

    return NextResponse.json({ success: true, message: 'Loan application submitted successfully', loanApplication: savedApplication?.toObject() }, { status: 201 });
  } catch (error: any) {
    console.error('Loan application submission error:', error);
    if (error.name === 'ValidationError') {
        let errors = {};
        Object.keys(error.errors).forEach((key) => {
            (errors as any)[key] = error.errors[key].message;
        });
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

    let query = {};
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ success: false, message: 'Invalid user ID format' }, { status: 400 });
      }
      query = { borrowerUserId: new mongoose.Types.ObjectId(userId) };
    }

    const applications = await LoanApplicationModel.find(query)
      .populate('borrowerUserId', 'name email id') // Ensure 'id' (virtual) is included for consistency
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

    