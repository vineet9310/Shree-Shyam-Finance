// src/app/api/loan-applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanApplicationModel from '@/models/LoanApplication';
import UserModel from '@/models/User';
import { uploadImageToCloudinary } from '@/lib/cloudinary'; // Import your Cloudinary utility
import mongoose from 'mongoose';
import type { LoanApplicationFormValues } from '@/components/custom/DetailedLoanApplicationForm';

// Helper to check if a string is a valid data URI
const isDataURI = (str: string) => typeof str === 'string' && str.startsWith('data:');

export async function POST(request: NextRequest) {
  console.log('[API POST /loan-applications] Received request');
  try {
    await dbConnect();
    console.log('[API POST /loan-applications] DB connected.');
    const body: LoanApplicationFormValues = await request.json();
    console.log('[API POST /loan-applications] Request body (partial, sensitive info omitted):', {
      borrowerEmail: body.borrowerEmail,
      borrowerContactNo: body.borrowerContactNo,
      borrowerAddress: body.borrowerAddress,
      borrowerIdProofType: body.borrowerIdProofType,
      borrowerAddressProofType: body.borrowerAddressProofType,
      monthlyIncome: body.monthlyIncome, // Changed from income to monthlyIncome
      employmentStatus: body.employmentStatus,
      jobType: body.jobType, // Added
      businessDescription: body.businessDescription, // Added
      creditScore: body.creditScore,
      loanAmount: body.loanAmount,
      hasGuarantor: body.hasGuarantor,
      numCollaterals: body.collaterals?.length,
      numGeneralDocs: body.generalSupportingDocuments?.length,
    });

    // Ensure borrowerEmail is provided
    if (!body.borrowerEmail) {
        console.error('[API POST /loan-applications] Error: Borrower email is missing from the request body.');
        return NextResponse.json({ success: false, message: 'Borrower email is required.' }, { status: 400 });
    }
     if (!body.borrowerFullName) {
        console.error('[API POST /loan-applications] Error: Borrower full name is missing from the request body.');
        return NextResponse.json({ success: false, message: 'Borrower full name is required.' }, { status: 400 });
    }

    const borrower = await UserModel.findOne({ email: body.borrowerEmail.toLowerCase() });
    if (!borrower) {
      console.log(`[API POST /loan-applications] Borrower not found with email: ${body.borrowerEmail}`);
      return NextResponse.json({ success: false, message: 'Borrower not found with the provided email.' }, { status: 404 });
    }
    console.log(`[API POST /loan-applications] Found borrower with ID: ${borrower._id}`);

    // --- Start File Uploads to Cloudinary ---
    const uploadedFileUrls: { [key: string]: string } = {};

    // Helper function to upload and store URL
    const uploadAndStore = async (fileDataUri: string | undefined, folder: string, key: string) => {
      if (fileDataUri && isDataURI(fileDataUri)) {
        try {
          const uploadResult = await uploadImageToCloudinary(fileDataUri, folder);
          uploadedFileUrls[key] = uploadResult.secure_url;
          console.log(`[API POST /loan-applications] Uploaded ${key} to: ${uploadResult.secure_url}`);
        } catch (uploadError) {
          console.error(`[API POST /loan-applications] Failed to upload ${key}:`, uploadError);
          throw new Error(`Failed to upload ${key} document.`); // Propagate specific error
        }
      }
    };

    // Borrower Documents
    await uploadAndStore(body.borrowerIdProofDocument as any, 'borrower_id_proofs', 'borrowerIdProofDocumentUrl');
    await uploadAndStore(body.borrowerAddressProofDocument as any, 'borrower_address_proofs', 'borrowerAddressProofDocumentUrl');

    // Guarantor Documents
    if (body.hasGuarantor && body.guarantor) {
      await uploadAndStore(body.guarantor.idProofDocument as any, 'guarantor_id_proofs', 'guarantorIdProofDocumentUrl');
      await uploadAndStore(body.guarantor.addressProofDocument as any, 'guarantor_address_proofs', 'guarantorAddressProofDocumentUrl');
    }

    // Collateral Documents
    const processedCollaterals = [];
    if (body.collaterals && body.collaterals.length > 0) {
      for (const [index, col] of body.collaterals.entries()) {
        const collateralData: any = { ...col };
        const collateralFolder = `collaterals/${col.type.replace(/_/g, '-')}_${index}`;

        await uploadAndStore(col.atmCardFrontImage as any, collateralFolder, `collateral_${index}_atmCardFrontImageUrl`);
        await uploadAndStore(col.atmCardBackImage as any, collateralFolder, `collateral_${index}_atmCardBackImageUrl`);
        await uploadAndStore(col.chequeImage as any, collateralFolder, `collateral_${index}_chequeImageUrl`);
        await uploadAndStore(col.bankStatementFile as any, collateralFolder, `collateral_${index}_bankStatementUrl`);
        await uploadAndStore(col.vehicleRcImage as any, collateralFolder, `collateral_${index}_vehicleRcImageUrl`);
        await uploadAndStore(col.vehicleImage as any, collateralFolder, `collateral_${index}_vehicleImageUrl`);
        await uploadAndStore(col.propertyPapersFile as any, collateralFolder, `collateral_${index}_propertyPapersUrl`);
        await uploadAndStore(col.propertyImage as any, collateralFolder, `collateral_${index}_propertyImageUrl`);
        await uploadAndStore(col.assetImage as any, collateralFolder, `collateral_${index}_assetImageUrl`);

        // Apply uploaded URLs back to the collateral object
        if (uploadedFileUrls[`collateral_${index}_atmCardFrontImageUrl`]) collateralData.atmCardFrontImageUrl = uploadedFileUrls[`collateral_${index}_atmCardFrontImageUrl`];
        if (uploadedFileUrls[`collateral_${index}_atmCardBackImageUrl`]) collateralData.atmCardBackImageUrl = uploadedFileUrls[`collateral_${index}_atmCardBackImageUrl`];
        if (uploadedFileUrls[`collateral_${index}_chequeImageUrl`]) collateralData.chequeImageUrl = uploadedFileUrls[`collateral_${index}_chequeImageUrl`];
        if (uploadedFileUrls[`collateral_${index}_bankStatementUrl`]) collateralData.bankStatementUrl = uploadedFileUrls[`collateral_${index}_bankStatementUrl`];
        if (uploadedFileUrls[`collateral_${index}_vehicleRcImageUrl`]) collateralData.vehicleRcImageUrl = uploadedFileUrls[`collateral_${index}_vehicleRcImageUrl`];
        if (uploadedFileUrls[`collateral_${index}_vehicleImageName`]) collateralData.vehicleImageName = uploadedFileUrls[`collateral_${index}_vehicleImageName`]; // This should be URL, not Name
        if (uploadedFileUrls[`collateral_${index}_propertyPapersUrl`]) collateralData.propertyPapersUrl = uploadedFileUrls[`collateral_${index}_propertyPapersUrl`];
        if (uploadedFileUrls[`collateral_${index}_propertyImageName`]) collateralData.propertyImageName = uploadedFileUrls[`collateral_${index}_propertyImageName`]; // This should be URL, not Name
        if (uploadedFileUrls[`collateral_${index}_assetImageName`]) collateralData.assetImageName = uploadedFileUrls[`collateral_${index}_assetImageName`]; // This should be URL, not Name

        // IMPORTANT: Remove the actual file data from the object before saving to DB
        // These are now handled by Cloudinary URLs
        delete collateralData.atmCardFrontImage;
        delete collateralData.atmCardBackImage;
        delete collateralData.chequeImage;
        delete collateralData.bankStatementFile;
        delete collateralData.vehicleRcImage;
        delete collateralData.vehicleImage;
        delete collateralData.propertyPapersFile;
        delete collateralData.propertyImage;
        delete collateralData.assetImage;

        processedCollaterals.push(collateralData);
      }
    }

    // General Supporting Documents (handle array of files)
    const generalDocumentUrls: string[] = [];
    if (body.generalSupportingDocuments && body.generalSupportingDocuments.length > 0) {
      for (const [index, doc] of body.generalSupportingDocuments.entries()) {
        if (doc && isDataURI(doc as any)) {
          try {
            const uploadResult = await uploadImageToCloudinary(doc as any, `general_docs`);
            generalDocumentUrls.push(uploadResult.secure_url);
            console.log(`[API POST /loan-applications] Uploaded general doc ${index} to: ${uploadResult.secure_url}`);
          } catch (uploadError) {
            console.error(`[API POST /loan-applications] Failed to upload general document ${index}:`, uploadError);
            throw new Error(`Failed to upload general document ${index}.`);
          }
        }
      }
    }

    // --- End File Uploads to Cloudinary ---


    const loanApplicationData: any = {
      borrowerUserId: borrower._id,
      borrowerFullName: body.borrowerFullName,
      borrowerEmail: body.borrowerEmail.toLowerCase(),
      // Add new borrower details
      borrowerContactNo: body.borrowerContactNo,
      borrowerAddress: body.borrowerAddress,
      borrowerIdProofType: body.borrowerIdProofType,
      borrowerAddressProofType: body.borrowerAddressProofType,
      // Add financial profile details
      monthlyIncome: body.monthlyIncome, // Changed from income to monthlyIncome
      employmentStatus: body.employmentStatus,
      jobType: body.jobType, // Added
      businessDescription: body.businessDescription, // Added
      creditScore: body.creditScore,
      applicationDate: new Date(),
      requestedAmount: body.loanAmount,
      purpose: body.loanPurpose,
      status: 'QueryInitiated',

      // Storing document URLs from Cloudinary
      borrowerIdProofDocumentUrl: uploadedFileUrls.borrowerIdProofDocumentUrl,
      borrowerAddressProofDocumentUrl: uploadedFileUrls.borrowerAddressProofDocumentUrl,
      generalSupportingDocumentUrls: generalDocumentUrls, // New field for general documents
    };

    if (body.hasGuarantor && body.guarantor) {
      console.log('[API POST /loan-applications] Processing guarantor details for DB:', body.guarantor);
      loanApplicationData.guarantor = {
        fullName: body.guarantor.fullName,
        address: body.guarantor.address,
        contactNo: body.guarantor.contactNo,
        idProofType: body.guarantor.idProofType,
        // Ensure guarantor document URLs are correctly assigned
        idProofDocumentUrl: uploadedFileUrls.guarantorIdProofDocumentUrl, // Correctly assign URL
        addressProofType: body.guarantor.addressProofType,
        addressProofDocumentUrl: uploadedFileUrls.guarantorAddressProofDocumentUrl, // Correctly assign URL
        relationshipToBorrower: body.guarantor.relationshipToBorrower,
      };
    }

    if (processedCollaterals.length > 0) {
      loanApplicationData.submittedCollateral = processedCollaterals;
    }

    console.log('[API POST /loan-applications] Constructed loanApplicationData for saving:', JSON.stringify(loanApplicationData, null, 2));

    const newLoanApplication = new LoanApplicationModel(loanApplicationData);
    await newLoanApplication.save();
    console.log(`[API POST /loan-applications] New loan application saved with ID: ${newLoanApplication._id}`);

    // Fetch the saved application and populate borrowerUserId to include name and email in the response
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
     // Catch specific error from cloudinary util
    if (error.message.includes('Failed to upload document to Cloudinary') || error.message.includes('Failed to upload')) {
      return NextResponse.json({ success: false, message: `Document upload failed: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error while submitting loan application.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  console.log('[API GET /loan-applications] Received request');
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query: any = {};
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.log(`[API GET /loan-applications] Invalid userId format received: ${userId}`);
        return NextResponse.json({ success: false, message: 'Invalid user ID format' }, { status: 400 });
      }
      query = { borrowerUserId: new mongoose.Types.ObjectId(userId) };
      console.log(`[API GET /loan-applications] Querying for userId: ${userId}`);
    } else {
      console.log('[API GET /loan-applications] Querying for all applications (no userId specified)');
    }

    const applicationsFromDB = await LoanApplicationModel.find(query)
      .populate<{ borrowerUserId: { _id: mongoose.Types.ObjectId, id: string, name: string, email: string } }>({ // Added type hint for populate
          path: 'borrowerUserId',
          select: 'name email',
          model: UserModel 
      })
      .sort({ createdAt: -1 });

    console.log(`[API GET /loan-applications] Found ${applicationsFromDB.length} applications in DB matching query.`);

    const applications = applicationsFromDB.map(app => {
      const appObj = app.toObject();
      return appObj;
    });

    return NextResponse.json({ success: true, applications: applications }, { status: 200 });
  } catch (error: any) {
    console.error('[API GET /loan-applications] Error fetching loan applications:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error while fetching applications.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'PUT method not implemented yet.' }, { status: 405 });
}