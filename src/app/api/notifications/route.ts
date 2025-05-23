
// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import NotificationModel from '@/models/Notification';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  console.log('[API GET /notifications] Received request');
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      console.log('[API GET /notifications] userId query parameter is missing');
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`[API GET /notifications] Invalid userId format received: ${userId}`);
      return NextResponse.json({ success: false, message: 'Invalid user ID format' }, { status: 400 });
    }

    console.log(`[API GET /notifications] Querying notifications for userId: ${userId}`);
    
    const notificationsFromDB = await NotificationModel.find({ recipientUserId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .limit(20); // Limit to recent 20 notifications

    console.log(`[API GET /notifications] Found ${notificationsFromDB.length} notifications for userId ${userId}.`);

    const notifications = notificationsFromDB.map(notif => notif.toObject());
    
    return NextResponse.json({ success: true, notifications }, { status: 200 });

  } catch (error: any) {
    console.error('[API GET /notifications] Error fetching notifications:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal Server Error while fetching notifications.',
      errorType: error.name 
    }, { status: 500 });
  }
}

// Placeholder for marking notifications as read - to be implemented later
export async function PUT(request: NextRequest) {
    // const { searchParams } = new URL(request.url);
    // const notificationId = searchParams.get('id');
    // if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
    //   return NextResponse.json({ success: false, message: 'Invalid notification ID' }, { status: 400 });
    // }
    // TODO: Implement logic to mark a notification as read
    console.log('[API PUT /notifications] Request received to update notification (not implemented).');
    return NextResponse.json({ success: false, message: 'PUT method not yet fully implemented for notifications.' }, { status: 501 });
}
