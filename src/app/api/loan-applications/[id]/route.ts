
// src/app/api/loan-applications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanApplicationModel from '@/models/LoanApplication';
import UserModel from '@/models/User';
import mongoose from 'mongoose';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  console.log(`[API GET /loan-applications/${id}] Received request for ID: ${id}`);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.log(`[API GET /loan-applications/${id}] Invalid application ID format: ${id}`);
    return NextResponse.json({ success: false, message: 'Invalid application ID format' }, { status: 400 });
  }

  try {
    await dbConnect();
    console.log(`[API GET /loan-applications/${id}] Database connected. Fetching application.`);

    const application = await LoanApplicationModel.findById(id)
      .populate<{ borrowerUserId: { _id: mongoose.Types.ObjectId, name: string, email: string, id: string } }>({
        path: 'borrowerUserId',
        select: 'name email', 
        model: UserModel 
      });

    if (!application) {
      console.log(`[API GET /loan-applications/${id}] Application not found.`);
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    console.log(`[API GET /loan-applications/${id}] Application found and populated:`, JSON.stringify(application.toObject(), null, 2));
    return NextResponse.json({ success: true, application: application.toObject() });
  } catch (error: any) {
    console.error(`[API GET /loan-applications/${id}] Error fetching application:`, error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal Server Error while fetching the application.',
      errorType: error.name 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  console.log(`[API PUT /loan-applications/${id}] Received request to update status.`);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.log(`[API PUT /loan-applications/${id}] Invalid application ID format: ${id}`);
    return NextResponse.json({ success: false, message: 'Invalid application ID format' }, { status: 400 });
  }

  try {
    const { status } = await request.json();
    console.log(`[API PUT /loan-applications/${id}] New status received: ${status}`);

    if (!status || !['Approved', 'Rejected', 'PendingAdminVerification', 'AdditionalInfoRequired', 'QueryInitiated', 'Active', 'PaidOff', 'Overdue', 'Defaulted'].includes(status)) {
      console.log(`[API PUT /loan-applications/${id}] Invalid status value: ${status}`);
      return NextResponse.json({ success: false, message: 'Invalid status value' }, { status: 400 });
    }

    await dbConnect();
    console.log(`[API PUT /loan-applications/${id}] Database connected. Finding application to update.`);

    const application = await LoanApplicationModel.findById(id);

    if (!application) {
      console.log(`[API PUT /loan-applications/${id}] Application not found for update.`);
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    const updateData: any = { status };

    if (status === 'Approved') {
      updateData.approvedDate = new Date();
      // If approvedAmount is not already set, set it to requestedAmount
      if (application.approvedAmount == null || application.approvedAmount === 0) {
        updateData.approvedAmount = application.requestedAmount;
      }
      // Optionally, set disbursementDate if approving also means disbursed immediately
      // updateData.disbursementDate = new Date();
      // updateData.status = 'Active'; // Or keep 'Approved' until disbursed
    }
    
    console.log(`[API PUT /loan-applications/${id}] Update data:`, updateData);

    const updatedApplication = await LoanApplicationModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate<{ borrowerUserId: { _id: mongoose.Types.ObjectId, name: string, email: string, id: string } }>({
        path: 'borrowerUserId',
        select: 'name email', 
        model: UserModel 
      });

    if (!updatedApplication) {
        console.log(`[API PUT /loan-applications/${id}] Failed to update application or application not found after update attempt.`);
        // This case should ideally not happen if findById found it earlier, but as a safeguard:
        return NextResponse.json({ success: false, message: 'Application not found or failed to update' }, { status: 404 });
    }
    
    console.log(`[API PUT /loan-applications/${id}] Application status updated successfully. New details:`, JSON.stringify(updatedApplication.toObject(), null, 2));
    return NextResponse.json({ success: true, application: updatedApplication.toObject(), message: 'Application status updated successfully' });

  } catch (error: any) {
    console.error(`[API PUT /loan-applications/${id}] Error updating application status:`, error);
     if (error.name === 'ValidationError') {
        let errors: Record<string, string> = {};
        for (let field in error.errors) {
            errors[field] = error.errors[field].message;
        }
        console.error(`[API PUT /loan-applications/${id}] Validation Errors:`, errors);
        return NextResponse.json({ success: false, message: 'Validation Error during update', errors }, { status: 400 });
    }
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal Server Error while updating application status.',
      errorType: error.name
    }, { status: 500 });
  }
}


export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
   const { id } = params;
   if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid application ID' }, { status: 400 });
  }
  // TODO: Implement logic to delete loan application
  console.log(`[API DELETE /loan-applications/${id}] Request received to delete application (not implemented).`);
  return NextResponse.json({ success: false, message: 'DELETE method not yet implemented.' }, { status: 501 });
}

