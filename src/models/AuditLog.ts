// src/models/AuditLog.ts
// Tracks all admin actions for compliance and auditing

import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IAuditLog {
    adminUserId: mongoose.Types.ObjectId | string;
    adminEmail: string;
    action: string;
    targetType: 'loan_application' | 'user' | 'transaction' | 'system';
    targetId?: string;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

export interface AuditLogDocument extends Omit<IAuditLog, 'timestamp'>, Document {
    timestamp: Date;
    createdAt: Date;
}

const AuditLogSchema = new Schema<AuditLogDocument>(
    {
        adminUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        adminEmail: {
            type: String,
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                'LOGIN',
                'LOGOUT',
                'VIEW_APPLICATION',
                'APPROVE_LOAN',
                'REJECT_LOAN',
                'DISBURSE_LOAN',
                'RECORD_PAYMENT',
                'VERIFY_PAYMENT',
                'REJECT_PAYMENT_PROOF',
                'UPDATE_LOAN_STATUS',
                'UPDATE_USER',
                'DELETE_USER',
                'SEND_REMINDER',
                'EXPORT_DATA',
                'SYSTEM_CONFIG_CHANGE',
                'OTHER',
            ],
        },
        targetType: {
            type: String,
            required: true,
            enum: ['loan_application', 'user', 'transaction', 'system'],
        },
        targetId: {
            type: String,
        },
        details: {
            type: Schema.Types.Mixed,
            default: {},
        },
        ipAddress: String,
        userAgent: String,
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc: any, ret: any) {
                ret.id = ret._id?.toString();
                delete ret._id;
                delete ret.__v;
            },
        },
    }
);

// Index for efficient querying
AuditLogSchema.index({ adminUserId: 1, timestamp: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ timestamp: -1 });

const AuditLogModel = (models.AuditLog as Model<AuditLogDocument>) ||
    mongoose.model<AuditLogDocument>('AuditLog', AuditLogSchema);

export default AuditLogModel;

// Helper function to create audit log entry
export async function createAuditLog(
    adminUserId: string,
    adminEmail: string,
    action: string,
    targetType: 'loan_application' | 'user' | 'transaction' | 'system',
    details: Record<string, any> = {},
    targetId?: string,
    request?: Request
): Promise<void> {
    try {
        const log = new AuditLogModel({
            adminUserId,
            adminEmail,
            action,
            targetType,
            targetId,
            details,
            ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
            userAgent: request?.headers.get('user-agent') || undefined,
        });
        await log.save();
        console.log(`[AuditLog] ${action} by ${adminEmail} on ${targetType}:${targetId || 'N/A'}`);
    } catch (error) {
        console.error('[AuditLog] Failed to create audit log:', error);
        // Don't throw - audit logging should not break main functionality
    }
}
