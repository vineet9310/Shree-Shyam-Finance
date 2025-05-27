// src/app/api/loan-applications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LoanApplicationModel from '@/models/LoanApplication';
import UserModel from '@/models/User';
import NotificationModel from '@/models/Notification';
import mongoose from 'mongoose';
import { uploadImageToCloudinary } from '@/lib/cloudinary'; // Assuming you have this util now
import type { LoanApplicationStatus, SystemNotification } from '@/lib/types'; // Added SystemNotification import

// Helper to check if a string is a valid data URI
const isDataURI = (str: string) => typeof str === 'string' && str.startsWith('data:');

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
    const body = await request.json(); // Get the whole body
    const { status, rejectionReasonText, rejectionReasonImage, rejectionReasonAudio, adminId } :
      {
        status: LoanApplicationStatus,
        rejectionReasonText?: string,
        rejectionReasonImage?: string, // Base64 from frontend
        rejectionReasonAudio?: string, // Base64 from frontend
        adminId?: string, // Admin's user ID
      } = body;

    console.log(`[API PUT /loan-applications/${id}] New status received: ${status}`);
    console.log(`[API PUT /loan-applications/${id}] Rejection details received: text="${rejectionReasonText?.substring(0, 50)}...", image=${!!rejectionReasonImage}, audio=${!!rejectionReasonAudio}, adminId=${adminId}`);

    const validStatuses: LoanApplicationStatus[] = ['Approved', 'Rejected', 'PendingAdminVerification', 'AdditionalInfoRequired', 'QueryInitiated', 'Active', 'PaidOff', 'Overdue', 'Defaulted'];
    if (!status || !validStatuses.includes(status)) {
      console.log(`[API PUT /loan-applications/${id}] Invalid status value: ${status}`);
      return NextResponse.json({ success: false, message: 'Invalid status value' }, { status: 400 });
    }

    await dbConnect();
    console.log(`[API PUT /loan-applications/${id}] Database connected. Finding application to update.`);

    const application = await LoanApplicationModel.findById(id).populate('borrowerUserId', 'name email');

    if (!application) {
      console.log(`[API PUT /loan-applications/${id}] Application not found for update.`);
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    const oldStatus = application.status;
    const updateData: any = { status };

    if (status === 'Approved' && oldStatus !== 'Approved') {
      updateData.approvedDate = new Date();
      if (application.approvedAmount == null || application.approvedAmount === 0) {
        updateData.approvedAmount = application.requestedAmount;
      }
      // Ensure rejection details are cleared if status changes from Rejected to Approved
      updateData.rejectionDetails = undefined;
    } else if (status === 'Rejected' && oldStatus !== 'Rejected') {
      const rejectionDetails: any = {
        text: rejectionReasonText,
        rejectedAt: new Date(),
        adminId: adminId, // Store adminId as string directly
      };

      // Handle image and audio uploads if provided
      if (rejectionReasonImage && isDataURI(rejectionReasonImage)) {
        try {
          const imageUploadResult = await uploadImageToCloudinary(rejectionReasonImage, `rejection_reasons/${id}`);
          rejectionDetails.imageUrl = imageUploadResult.secure_url;
          console.log(`[API PUT /loan-applications/${id}] Uploaded rejection image: ${imageUploadResult.secure_url}`);
        } catch (uploadError) {
          console.error(`[API PUT /loan-applications/${id}] Failed to upload rejection image:`, uploadError);
          // Decide if you want to fail the whole request or just proceed without the image
          // For now, re-throw to fail the request for clear error feedback
          throw new Error('Failed to upload rejection image.');
        }
      }
      if (rejectionReasonAudio && isDataURI(rejectionReasonAudio)) {
        try {
          const audioUploadResult = await uploadImageToCloudinary(rejectionReasonAudio, `rejection_reasons/${id}`); // Cloudinary uploader handles audio too
          rejectionDetails.audioUrl = audioUploadResult.secure_url;
          console.log(`[API PUT /loan-applications/${id}] Uploaded rejection audio: ${audioUploadResult.secure_url}`);
        } catch (uploadError) {
          console.error(`[API PUT /loan-applications/${id}] Failed to upload rejection audio:`, uploadError);
          throw new Error('Failed to upload rejection audio.');
        }
      }
      updateData.rejectionDetails = rejectionDetails;
    } else if (status !== 'Rejected' && application.rejectionDetails) {
        // If status changes from Rejected to something else, clear rejection details
        updateData.rejectionDetails = undefined;
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
        return NextResponse.json({ success: false, message: 'Application not found or failed to update' }, { status: 404 });
    }

    console.log(`[API PUT /loan-applications/${id}] Application status updated successfully. New details:`, JSON.stringify(updatedApplication.toObject(), null, 2));

    // Create notification if status changed
    console.log(`[API PUT /loan-applications/${id}] Checking if notification needs to be created. Old status: ${oldStatus}, New status: ${updatedApplication.status}, Borrower User ID: ${updatedApplication.borrowerUserId}`);
    if (oldStatus !== updatedApplication.status && updatedApplication.borrowerUserId) {
      let notificationMessage = `Your loan application (ID: ...${updatedApplication.id.slice(-6)}) status has been updated to ${updatedApplication.status}.`;
      let notificationType: SystemNotification['type'] = 'loan_status_updated';
      let rejectionReasonTextForNotif: string | undefined;
      let rejectionReasonImageUrlForNotif: string | undefined;
      let rejectionReasonAudioUrlForNotif: string | undefined;

      if (updatedApplication.status === 'Approved') {
        notificationMessage = `Congratulations! Your loan application for ${updatedApplication.purpose.substring(0,20)}... has been approved.`;
      } else if (updatedApplication.status === 'Rejected') {
        notificationType = 'loan_rejected_details';
        notificationMessage = `We regret to inform you that your loan application for ${updatedApplication.purpose.substring(0,20)}... has been rejected.`;
        if (updatedApplication.rejectionDetails) {
            rejectionReasonTextForNotif = updatedApplication.rejectionDetails.text;
            rejectionReasonImageUrlForNotif = updatedApplication.rejectionDetails.imageUrl;
            rejectionReasonAudioUrlForNotif = updatedApplication.rejectionDetails.audioUrl;
            console.log(`[API PUT /loan-applications/${id}] Rejection details for notification: Text: ${rejectionReasonTextForNotif ? 'Yes' : 'No'}, Image: ${rejectionReasonImageUrlForNotif ? 'Yes' : 'No'}, Audio: ${rejectionReasonAudioUrlForNotif ? 'Yes' : 'No'}`);
        }
      }

      console.log(`[API PUT /loan-applications/${id}] Creating new notification for recipient: ${updatedApplication.borrowerUserId._id}`);
      const newNotification = new NotificationModel({
        recipientUserId: updatedApplication.borrowerUserId._id,
        loanApplicationId: updatedApplication._id,
        message: notificationMessage,
        type: notificationType,
        linkTo: `/dashboard/application/${updatedApplication.id}`,
        rejectionReasonText: rejectionReasonTextForNotif, // Pass to notification
        rejectionReasonImageUrl: rejectionReasonImageUrlForNotif, // Pass to notification
        rejectionReasonAudioUrl: rejectionReasonAudioUrlForNotif, // Pass to notification
      });
      await newNotification.save();
      console.log(`[API PUT /loan-applications/${id}] Notification created successfully for user ${updatedApplication.borrowerUserId._id} regarding application ${updatedApplication._id}`);
    } else {
        console.log(`[API PUT /loan-applications/${id}] No notification created. Condition not met: oldStatus !== updatedApplication.status (${oldStatus} !== ${updatedApplication.status}) or borrowerUserId is missing (${!!updatedApplication.borrowerUserId}).`);
    }

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
    // Catch specific error from cloudinary util
    if (error.message.includes('Failed to upload rejection')) {
        return NextResponse.json({ success: false, message: `Rejection multimedia upload failed: ${error.message}` }, { status: 500 });
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
