// src/models/User.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { User as UserType } from '@/lib/types'; // Using existing User type for structure

// Interface for Mongoose Document
export interface UserDocument extends Omit<UserType, 'id' | 'borrowerProfileId'>, Document {
  // id: string; // Mongoose _id will be transformed to id by virtual/toJSON
  borrowerProfileId?: mongoose.Types.ObjectId; // Link to BorrowerProfile model
  passwordHash?: string;
  passwordResetOtp?: string; // Added for OTP for password reset
  passwordResetOtpExpires?: Date; // Added for OTP expiry time
  createdAt?: Date; // Mongoose timestamps will add this
  updatedAt?: Date; // Mongoose timestamps will add this
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
        virtuals: true, // Ensure virtuals are included
        getters: true,
        transform: function(doc, ret) {
            ret.id = ret._id.toString(); // Ensure id is a string
            delete ret._id;
            delete ret.__v;
            // Do not delete passwordHash here, handle in API responses
        }
    },
    toObject: {
        virtuals: true, // Ensure virtuals are included
        getters: true,
        transform: function(doc, ret) {
            ret.id = ret._id.toString(); // Ensure id is a string
            delete ret._id;
            delete ret.__v;
            // Do not delete passwordHash here, handle in API responses
        }
    }
  }
);

// Explicitly define virtual 'id' if not already present
if (!UserSchema.virtuals['id']) {
    UserSchema.virtual('id').get(function(this: UserDocument) {
        return this._id.toHexString();
    });
}


const UserModel = (models.User as Model<UserDocument>) || mongoose.model<UserDocument>('User', UserSchema);

export default UserModel;
