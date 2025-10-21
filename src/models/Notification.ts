// src/models/Notification.ts

import mongoose, { Schema, Document, models, Model } from 'mongoose';
// Import NotificationTypeEnum as a value, and SystemNotification as a type
import { NotificationTypeEnum } from '@/lib/types'; 
import type { SystemNotification as NotificationType } from '@/lib/types';

export interface NotificationDocument extends Omit<NotificationType, 'id' | 'recipientUserId' | 'loanApplicationId' | 'paymentRecordId' | 'createdAt' | 'rejectionReasonText' | 'rejectionReasonImageUrl' | 'rejectionReasonAudioUrl'>, Document {
  recipientUserId: mongoose.Types.ObjectId;
  loanApplicationId?: mongoose.Types.ObjectId;
  paymentRecordId?: mongoose.Types.ObjectId; // This will now refer to LoanTransaction's _id
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
    paymentRecordId: { // Refers to the _id of a LoanTransaction document
      type: Schema.Types.ObjectId,
      ref: 'LoanTransaction', 
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationTypeEnum), // Use enum values for validation
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    linkTo: String,
    rejectionReasonText: String,
    rejectionReasonImageUrl: String,
    rejectionReasonAudioUrl: String,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      getters: true,
      transform: function (doc: any, ret: any) {
        ret.id = ret._id?.toString();
        delete ret._id;
        if (ret.__v !== undefined) delete ret.__v;
      },
    },
    toObject: {
      virtuals: true,
      getters: true,
      transform: function (doc: any, ret: any) {
        ret.id = ret._id?.toString();
        delete ret._id;
        if (ret.__v !== undefined) delete ret.__v;
      },
    },
  }
);

const virtuals = NotificationSchema.virtuals as Record<string, any>;
if (!virtuals['id']) {
  NotificationSchema.virtual('id').get(function (this: NotificationDocument) {
    return (this._id as any)?.toHexString?.() || (this._id as any)?.toString?.();
  });
}

const NotificationModel = (models.Notification as Model<NotificationDocument>) ||
  mongoose.model<NotificationDocument>('Notification', NotificationSchema);

export default NotificationModel;
