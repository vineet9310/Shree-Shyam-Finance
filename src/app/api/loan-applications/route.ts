// src/app/api/loan-applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanApplicationModel from '@/models/LoanApplication';
import UserModel from '@/models/User'; // Your User model
import { uploadImageToCloudinary } from '@/lib/cloudinary'; // Your Cloudinary utility
import mongoose from 'mongoose';

// Define an interface for the expected request body, including new fields
interface LoanApplicationRequestBody {
    userId?: string; // For identifying the user, sent from the new form
    isExistingUserApplication?: boolean; // Flag from the new form

    borrowerEmail: string; // Kept for potential existing integrations
    borrowerFullName: string;
    borrowerContactNo?: string;
    borrowerAddress?: string;
    borrowerIdProofType?: string;
    borrowerIdProofDocument?: string; // Expected as data URI for new users
    borrowerAddressProofType?: string;
    borrowerAddressProofDocument?: string; // Expected as data URI for new users
    
    monthlyIncome?: number;
    employmentStatus?: string;
    jobType?: string;
    businessDescription?: string;
    creditScore?: number;
    loanAmount: number; // Renamed from requestedAmount in some contexts
    loanPurpose?: string; // Renamed from purpose in some contexts

    hasGuarantor?: boolean;
    guarantor?: {
        fullName?: string;
        address?: string;
        contactNo?: string;
        idProofType?: string;
        idProofDocument?: string; // Data URI
        addressProofType?: string;
        addressProofDocument?: string; // Data URI
        relationshipToBorrower?: string;
    };
    collaterals?: Array<{
        type: string;
        description?: string;
        estimatedValue?: number;
        // Document fields for collaterals - expected as data URIs
        atmCardFrontImage?: string;
        atmCardBackImage?: string;
        chequeImage?: string;
        bankStatementFile?: string; // e.g., specific to collateral like hypothecation
        vehicleRcImage?: string;
        vehicleImage?: string;
        propertyPapersFile?: string;
        propertyImage?: string;
        assetImage?: string;
        // Fields to store URLs after upload
        atmCardFrontImageUrl?: string;
        atmCardBackImageUrl?: string;
        chequeImageUrl?: string;
        bankStatementUrl?: string;
        vehicleRcImageUrl?: string;
        vehicleImageUrl?: string; // Corrected from vehicleImageName
        propertyPapersUrl?: string;
        propertyImageUrl?: string; // Corrected from propertyImageName
        assetImageUrl?: string; // Corrected from assetImageName
    }>;
    generalSupportingDocuments?: string[]; // Array of data URIs for new users
    
    // Fields from your simplified form (if they are different and need mapping)
    // loanTenureMonths?: number; // If this is different from how tenure is derived
}


// Helper to check if a string is a valid data URI
const isDataURI = (str: any): str is string => typeof str === 'string' && str.startsWith('data:');

export async function POST(request: NextRequest) {
  console.log('[API POST /loan-applications] Received request');
  try {
    await dbConnect();
    console.log('[API POST /loan-applications] DB connected.');
    
    // Use the extended interface for the body
    const body: LoanApplicationRequestBody = await request.json();
    
    console.log('[API POST /loan-applications] Request body (partial):', {
        userId: body.userId,
        isExistingUserApplication: body.isExistingUserApplication,
        borrowerEmail: body.borrowerEmail,
        loanAmount: body.loanAmount,
    });

    // Determine the user identifier: prioritize userId from new form, fallback to borrowerEmail
    let userIdentifierQuery: any;
    if (body.userId && mongoose.Types.ObjectId.isValid(body.userId)) {
        userIdentifierQuery = { _id: new mongoose.Types.ObjectId(body.userId) };
        console.log(`[API POST /loan-applications] Identifying user by userId: ${body.userId}`);
    } else if (body.borrowerEmail) {
        userIdentifierQuery = { email: body.borrowerEmail.toLowerCase() };
        console.log(`[API POST /loan-applications] Identifying user by email: ${body.borrowerEmail}`);
    } else {
        console.error('[API POST /loan-applications] Error: User identifier (userId or borrowerEmail) is missing.');
        return NextResponse.json({ success: false, message: 'User identifier (userId or borrowerEmail) is required.' }, { status: 400 });
    }
    
    const borrower = await UserModel.findOne(userIdentifierQuery);
    if (!borrower) {
      console.log(`[API POST /loan-applications] Borrower not found with query:`, userIdentifierQuery);
      return NextResponse.json({ success: false, message: 'Borrower not found.' }, { status: 404 });
    }
    console.log(`[API POST /loan-applications] Found borrower with ID: ${borrower._id}`);

    const uploadedFileUrls: { [key: string]: string | undefined } = {}; // To store Cloudinary URLs
    const generalDocumentUrlsFromDbOrUpload: string[] = [];

    // --- Start File Uploads to Cloudinary ---
    const uploadAndStore = async (fileDataUri: string | undefined, folder: string, key: string) => {
      if (fileDataUri && isDataURI(fileDataUri)) {
        try {
          const uploadResult = await uploadImageToCloudinary(fileDataUri, folder);
          uploadedFileUrls[key] = uploadResult.secure_url;
          console.log(`[API POST /loan-applications] Uploaded ${key} to: ${uploadResult.secure_url}`);
        } catch (uploadError) {
          console.error(`[API POST /loan-applications] Failed to upload ${key}:`, uploadError);
          throw new Error(`Failed to upload ${key} document.`);
        }
      }
    };

    if (body.isExistingUserApplication) {
        console.log('[API POST /loan-applications] Processing for existing user. Reusing stored documents.');
        // For existing users, fetch URLs from their profile (UserModel)
        // Ensure your UserModel has these fields (e.g., idProofDocumentUrl, addressProofDocumentUrl, panCardUrl, etc.)
        // The names in UserModel might be different, adjust accordingly.
        uploadedFileUrls.borrowerIdProofDocumentUrl = borrower.get('idProofDocumentUrl'); // Example: borrower.idProofDocumentUrl
        uploadedFileUrls.borrowerAddressProofDocumentUrl = borrower.get('addressProofDocumentUrl'); // Example: borrower.addressProofDocumentUrl
        
        // For general supporting documents, use existing ones from user profile
        const existingGeneralDocs = borrower.get('generalSupportingDocumentUrls'); // Example: borrower.generalDocs array
        if (Array.isArray(existingGeneralDocs)) {
            generalDocumentUrlsFromDbOrUpload.push(...existingGeneralDocs);
        }
        // You might also want to fetch PAN, Income proof, Bank statement URLs if stored separately on UserModel
        // uploadedFileUrls.panCardUrl = borrower.get('panCardUrl'); 
        // uploadedFileUrls.incomeProofUrl = borrower.get('incomeProofUrl');
        // uploadedFileUrls.bankStatementUrl = borrower.get('bankStatementUrl');

        console.log('[API POST /loan-applications] Using existing document URLs for borrower:', {
            idProof: uploadedFileUrls.borrowerIdProofDocumentUrl,
            addressProof: uploadedFileUrls.borrowerAddressProofDocumentUrl,
            generalDocsCount: generalDocumentUrlsFromDbOrUpload.length
        });

    } else {
        console.log('[API POST /loan-applications] Processing for new user or user providing new documents.');
        // Borrower Documents (ID and Address proof) - Upload if new user
        await uploadAndStore(body.borrowerIdProofDocument, `borrowers/${borrower._id}/id_proofs`, 'borrowerIdProofDocumentUrl');
        await uploadAndStore(body.borrowerAddressProofDocument, `borrowers/${borrower._id}/address_proofs`, 'borrowerAddressProofDocumentUrl');

        // General Supporting Documents (handle array of files) - Upload if new user
        if (body.generalSupportingDocuments && body.generalSupportingDocuments.length > 0) {
            for (const [index, docDataUri] of body.generalSupportingDocuments.entries()) {
                if (docDataUri && isDataURI(docDataUri)) {
                    try {
                        const uploadResult = await uploadImageToCloudinary(docDataUri, `borrowers/${borrower._id}/general_docs`);
                        generalDocumentUrlsFromDbOrUpload.push(uploadResult.secure_url);
                        console.log(`[API POST /loan-applications] Uploaded general doc ${index} to: ${uploadResult.secure_url}`);
                    } catch (uploadError) {
                        console.error(`[API POST /loan-applications] Failed to upload general document ${index}:`, uploadError);
                        throw new Error(`Failed to upload general document ${index}.`);
                    }
                }
            }
        }
    }

    // Guarantor Documents - Upload if provided, regardless of existing/new user (specific to this loan)
    if (body.hasGuarantor && body.guarantor) {
      await uploadAndStore(body.guarantor.idProofDocument, `guarantors/${borrower._id}/id_proofs`, 'guarantorIdProofDocumentUrl');
      await uploadAndStore(body.guarantor.addressProofDocument, `guarantors/${borrower._id}/address_proofs`, 'guarantorAddressProofDocumentUrl');
    }

    // Collateral Documents - Upload if provided (specific to this loan, optional)
    const processedCollaterals = [];
    if (body.collaterals && body.collaterals.length > 0) {
      for (const [index, col] of body.collaterals.entries()) {
        const collateralData: any = { ...col }; // Start with all data from request
        const collateralFolder = `borrowers/${borrower._id}/collaterals/${col.type.replace(/[^a-zA-Z0-9]/g, '-')}_${index}`;

        // Store original keys for uploaded URLs before attempting upload
        const atmFrontKey = `collateral_${index}_atmCardFrontImageUrl`;
        const atmBackKey = `collateral_${index}_atmCardBackImageUrl`;
        const chequeKey = `collateral_${index}_chequeImageUrl`;
        const bankStmtKey = `collateral_${index}_bankStatementUrl`;
        const vehicleRcKey = `collateral_${index}_vehicleRcImageUrl`;
        const vehicleImgKey = `collateral_${index}_vehicleImageUrl`;
        const propertyPapersKey = `collateral_${index}_propertyPapersUrl`;
        const propertyImgKey = `collateral_${index}_propertyImageUrl`;
        const assetImgKey = `collateral_${index}_assetImageUrl`;

        // Upload collateral files
        await uploadAndStore(col.atmCardFrontImage, collateralFolder, atmFrontKey);
        await uploadAndStore(col.atmCardBackImage, collateralFolder, atmBackKey);
        await uploadAndStore(col.chequeImage, collateralFolder, chequeKey);
        await uploadAndStore(col.bankStatementFile, collateralFolder, bankStmtKey);
        await uploadAndStore(col.vehicleRcImage, collateralFolder, vehicleRcKey);
        await uploadAndStore(col.vehicleImage, collateralFolder, vehicleImgKey);
        await uploadAndStore(col.propertyPapersFile, collateralFolder, propertyPapersKey);
        await uploadAndStore(col.propertyImage, collateralFolder, propertyImgKey);
        await uploadAndStore(col.assetImage, collateralFolder, assetImgKey);
        
        // Assign uploaded URLs back to the collateral object
        collateralData.atmCardFrontImageUrl = uploadedFileUrls[atmFrontKey];
        collateralData.atmCardBackImageUrl = uploadedFileUrls[atmBackKey];
        collateralData.chequeImageUrl = uploadedFileUrls[chequeKey];
        collateralData.bankStatementUrl = uploadedFileUrls[bankStmtKey];
        collateralData.vehicleRcImageUrl = uploadedFileUrls[vehicleRcKey];
        collateralData.vehicleImageUrl = uploadedFileUrls[vehicleImgKey]; // Corrected assignment
        collateralData.propertyPapersUrl = uploadedFileUrls[propertyPapersKey];
        collateralData.propertyImageUrl = uploadedFileUrls[propertyImgKey]; // Corrected assignment
        collateralData.assetImageUrl = uploadedFileUrls[assetImgKey];     // Corrected assignment

        // Remove the base64 data URI fields from collateralData before saving to DB
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
    // --- End File Uploads ---

    const loanApplicationData: any = {
      borrowerUserId: borrower._id,
      borrowerFullName: body.borrowerFullName || borrower.get('fullName') || borrower.get('name'), // Prioritize body, fallback to user model
      borrowerEmail: (body.borrowerEmail || borrower.email).toLowerCase(),
      borrowerContactNo: body.borrowerContactNo || borrower.get('contactNo'),
      borrowerAddress: body.borrowerAddress || borrower.get('address'),
      borrowerIdProofType: body.borrowerIdProofType,
      borrowerAddressProofType: body.borrowerAddressProofType,
      
      monthlyIncome: body.monthlyIncome,
      employmentStatus: body.employmentStatus,
      jobType: body.jobType,
      businessDescription: body.businessDescription,
      creditScore: body.creditScore,
      
      applicationDate: new Date(),
      requestedAmount: body.loanAmount, // Ensure this maps to `loanAmount` from simpler form
      purpose: body.loanPurpose, // Ensure this maps to `loanPurpose` from simpler form
      // loanTenureMonths: body.loanTenureMonths, // If you have this field from simplified form

      status: 'QueryInitiated', // Or your default initial status

      // Storing document URLs from Cloudinary or existing user profile
      borrowerIdProofDocumentUrl: uploadedFileUrls.borrowerIdProofDocumentUrl,
      borrowerAddressProofDocumentUrl: uploadedFileUrls.borrowerAddressProofDocumentUrl,
      generalSupportingDocumentUrls: generalDocumentUrlsFromDbOrUpload,
      
      // Include PAN, Income, Bank Statement URLs if fetched for existing user and stored directly on LoanApplicationModel
      // panCardUrl: uploadedFileUrls.panCardUrl,
      // incomeProofUrl: uploadedFileUrls.incomeProofUrl,
      // bankStatementUrl: uploadedFileUrls.bankStatementUrl,
    };

    if (body.hasGuarantor && body.guarantor) {
      loanApplicationData.guarantor = {
        fullName: body.guarantor.fullName,
        address: body.guarantor.address,
        contactNo: body.guarantor.contactNo,
        idProofType: body.guarantor.idProofType,
        idProofDocumentUrl: uploadedFileUrls.guarantorIdProofDocumentUrl,
        addressProofType: body.guarantor.addressProofType,
        addressProofDocumentUrl: uploadedFileUrls.guarantorAddressProofDocumentUrl,
        relationshipToBorrower: body.guarantor.relationshipToBorrower,
      };
    }

    if (processedCollaterals.length > 0) {
      loanApplicationData.submittedCollateral = processedCollaterals;
    }
    // Add the flag to the application data if you want to store it
    loanApplicationData.isExistingUserApplication = !!body.isExistingUserApplication;


    console.log('[API POST /loan-applications] Constructed loanApplicationData for saving (sensitive data URIs removed from log):', 
        JSON.stringify({...loanApplicationData, submittedCollateral: 'Processed separately'}, null, 2)
    );

    const newLoanApplication = new LoanApplicationModel(loanApplicationData);
    await newLoanApplication.save();
    console.log(`[API POST /loan-applications] New loan application saved with ID: ${newLoanApplication._id}`);

    const savedApplication = await LoanApplicationModel.findById(newLoanApplication._id)
      .populate({
        path: 'borrowerUserId',
        select: 'name email fullName', // Adjust fields as per your UserModel
        model: UserModel
      });

    return NextResponse.json({ 
        success: true, 
        message: 'Loan application submitted successfully', 
        loanApplication: savedApplication?.toObject() 
    }, { status: 201 });

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
    const loanId = searchParams.get('loanId'); // For fetching a single application by its ID

    let query: any = {};
    
    if (loanId) {
        if (!mongoose.Types.ObjectId.isValid(loanId)) {
            console.log(`[API GET /loan-applications] Invalid loanId format received: ${loanId}`);
            return NextResponse.json({ success: false, message: 'Invalid loan ID format' }, { status: 400 });
        }
        query = { _id: new mongoose.Types.ObjectId(loanId) };
        console.log(`[API GET /loan-applications] Querying for loanId: ${loanId}`);
    } else if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.log(`[API GET /loan-applications] Invalid userId format received: ${userId}`);
        return NextResponse.json({ success: false, message: 'Invalid user ID format' }, { status: 400 });
      }
      query = { borrowerUserId: new mongoose.Types.ObjectId(userId) };
      console.log(`[API GET /loan-applications] Querying for userId: ${userId}`);
    } else {
      console.log('[API GET /loan-applications] Querying for all applications (no userId or loanId specified)');
    }

    const applicationsFromDB = await LoanApplicationModel.find(query)
      .populate<{ borrowerUserId: { _id: mongoose.Types.ObjectId; id: string; name: string; email: string, fullName?:string } }>({
        path: 'borrowerUserId',
        select: 'name email fullName', // Ensure UserModel has these fields selected
        model: UserModel 
      })
      .sort({ createdAt: -1 });

    console.log(`[API GET /loan-applications] Found ${applicationsFromDB.length} applications in DB matching query.`);
    
    const applications = applicationsFromDB.map(app => app.toObject());

    // If loanId was used, we expect a single application or none
    if (loanId) {
        if (applications.length > 0) {
            return NextResponse.json({ success: true, application: applications[0] }, { status: 200 });
        } else {
            return NextResponse.json({ success: false, message: "Loan application not found"}, { status: 404});
        }
    }

    return NextResponse.json({ success: true, applications: applications }, { status: 200 });
  } catch (error: any) {
    console.error('[API GET /loan-applications] Error fetching loan applications:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error while fetching applications.' }, { status: 500 });
  }
}

// PUT method remains unchanged as per your provided code
export async function PUT(request: NextRequest) {
  return NextResponse.json({ success: false, message: 'PUT method not implemented yet.' }, { status: 405 });
}
