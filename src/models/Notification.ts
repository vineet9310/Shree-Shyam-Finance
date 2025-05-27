// src/models/Notification.ts

import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { SystemNotification as NotificationType } from '@/lib/types';

export interface NotificationDocument extends Omit<NotificationType, 'id' | 'recipientUserId' | 'loanApplicationId' | 'paymentRecordId' | 'createdAt' | 'rejectionReasonText' | 'rejectionReasonImageUrl' | 'rejectionReasonAudioUrl'>, Document {
  recipientUserId: mongoose.Types.ObjectId;
  loanApplicationId?: mongoose.Types.ObjectId;
  paymentRecordId?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  // New fields for rejection details directly in notification
  rejectionReasonText?: string;
  rejectionReasonImageUrl?: string;
  rejectionReasonAudioUrl?: string;
}

const NotificationSchema: Schema<NotificationDocument> = new Schema(
  {
    recipientUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    loanApplicationId: {
      type: Schema.Types.ObjectId,
      ref: 'LoanApplication',
    },
    paymentRecordId: {
      type: Schema.Types.ObjectId,
      // ref: 'PaymentRecord', // Add this if you create a PaymentRecord model
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'loan_application_submitted',
        'loan_status_updated',
        'payment_due_reminder',
        'payment_received_confirmation',
        'payment_overdue_alert',
        'document_request',
        'general_admin_alert',
        'general_user_info',
        'loan_rejected_details', // New type
      ],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    linkTo: String,
    // New fields for rejection details for direct notification display
    rejectionReasonText: String,
    rejectionReasonImageUrl: String,
    rejectionReasonAudioUrl: String,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      getters: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: {
      virtuals: true,
      getters: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

if (!NotificationSchema.virtuals['id']) {
  NotificationSchema.virtual('id').get(function (this: NotificationDocument) {
    return this._id.toHexString();
  });
}

const NotificationModel = (models.Notification as Model<NotificationDocument>) ||
  mongoose.model<NotificationDocument>('Notification', NotificationSchema);

export default NotificationModel;