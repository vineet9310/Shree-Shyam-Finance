
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
        select: 'name email', // Mongoose includes _id by default, virtual 'id' should be handled by toObject
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
    // Ensure a JSON response even for unexpected errors
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal Server Error while fetching the application.',
      errorType: error.name 
    }, { status: 500 });
  }
}

// Placeholder for PUT (Update Status)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
   if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid application ID' }, { status: 400 });
  }
  // TODO: Implement logic to update loan application status
  console.log(`[API PUT /loan-applications/${id}] Request received to update status (not implemented).`);
  return NextResponse.json({ success: false, message: 'PUT method not yet implemented for loan application status update.' }, { status: 501 });
}

// Placeholder for DELETE
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
   const { id } = params;
   if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid application ID' }, { status: 400 });
  }
  // TODO: Implement logic to delete loan application
  console.log(`[API DELETE /loan-applications/${id}] Request received to delete application (not implemented).`);
  return NextResponse.json({ success: false, message: 'DELETE method not yet implemented.' }, { status: 501 });
}
