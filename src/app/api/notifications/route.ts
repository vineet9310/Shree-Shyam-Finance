// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import NotificationModel from '@/models/Notification';
import mongoose from 'mongoose';
import { NotificationTypeEnum } from '@/lib/types';

export async function GET(request: NextRequest) {
  console.log('[API GET /notifications] Received request');
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const notificationType = searchParams.get('type'); // New parameter to filter by type

    // Base query
    let query: any = {};

    // If userId is provided, add it to the query
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ success: false, message: 'Invalid user ID format' }, { status: 400 });
      }
      query.recipientUserId = new mongoose.Types.ObjectId(userId);
    }

    // If notificationType is provided, add it to the query
    if (notificationType) {
        // Validate if it's a valid enum value
        if (Object.values(NotificationTypeEnum).includes(notificationType as NotificationTypeEnum)) {
            query.type = notificationType;
        } else {
            return NextResponse.json({ success: false, message: 'Invalid notification type provided' }, { status: 400 });
        }
    }
    
    // If no filters are provided, it's potentially a bad request, but for now, we'll allow it.
    // In a real app, you might want to require at least one filter.
    if (Object.keys(query).length === 0) {
        // This logic now fetches for all users if no userId is provided, which is what we want for the admin queue
        // But we should only fetch the specific type for the queue page
        // The frontend for the queue page will now specifically ask for the type.
        console.log('[API GET /notifications] Fetching notifications with filter:', query);
    }


    console.log(`[API GET /notifications] Querying notifications with filter:`, query);
    
    const notificationsFromDB = await NotificationModel.find(query)
      .sort({ createdAt: -1 }) 
      .limit(50); // Increased limit for admin queue

    console.log(`[API GET /notifications] Found ${notificationsFromDB.length} notifications.`);

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

// PUT method remains unchanged
export async function PUT(request: NextRequest) {
    console.log('[API PUT /notifications] Request received to update notification (not implemented).');
    return NextResponse.json({ success: false, message: 'PUT method not yet fully implemented for notifications.' }, { status: 501 });
}
