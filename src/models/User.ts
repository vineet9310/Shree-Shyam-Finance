// src/models/User.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { User as UserType } from '@/lib/types';

// Interface for Mongoose Document
export interface UserDocument extends Omit<UserType, 'id' | 'borrowerProfileId' | 'createdAt' | 'updatedAt'>, Document {
  borrowerProfileId?: mongoose.Types.ObjectId;
  passwordHash?: string;
  passwordResetOtp?: string;
  passwordResetOtpExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema: Schema<UserDocument> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name for this user.'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email for this user.'],
      unique: true,
      match: [/.+@.+\..+/, 'Please enter a valid email address'],
      lowercase: true, // Ensure email is stored in lowercase
    },
    passwordHash: {
      type: String,
      select: false, // Default to not select passwordHash unless explicitly asked
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    contactNo: String,
    address: String,
    idProofType: String,
    idProofDocumentUrl: String, // Placeholder for now
    addressProofType: String,
    addressProofDocumentUrl: String, // Placeholder for now
    borrowerProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'BorrowerProfile',
    },
    // Fields for password reset OTP
    passwordResetOtp: {
      type: String,
      required: false, // OTP is not always present
    },
    passwordResetOtpExpires: {
      type: Date,
      required: false, // OTP expiry is not always present
    },
  },
  {
    timestamps: true,
    toJSON: {
        virtuals: true,
        getters: true,
        transform: function(doc: any, ret: any) {
            ret.id = ret._id?.toString();
            delete ret._id;
            if (ret.__v !== undefined) delete ret.__v;
        }
    },
    toObject: {
        virtuals: true,
        getters: true,
        transform: function(doc: any, ret: any) {
            ret.id = ret._id?.toString();
            delete ret._id;
            if (ret.__v !== undefined) delete ret.__v;
        }
    }
  }
);

(UserSchema.virtuals as any)['id'] = UserSchema.virtual('id').get(function(this: any) {
  return this._id?.toHexString();
});


const UserModel = (models.User as Model<UserDocument>) || mongoose.model<UserDocument>('User', UserSchema);

export default UserModel;
