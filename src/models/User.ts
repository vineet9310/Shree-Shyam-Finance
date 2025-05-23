
// src/models/User.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { User as UserType } from '@/lib/types'; // Using existing User type for structure

// Interface for Mongoose Document
export interface UserDocument extends Omit<UserType, 'id' | 'borrowerProfileId'>, Document {
  id: string; // Mongoose _id will be used as id
  borrowerProfileId?: mongoose.Types.ObjectId; // Link to BorrowerProfile model
  // Add any backend-specific fields if necessary, e.g., passwordHash
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
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
    passwordHash: { // Store hashed passwords, not plain text
      type: String,
      // required: [true, 'Password is required.'] // Consider if using external auth provider
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Fields from BorrowerProfile (denormalized or to be linked)
    contactNo: String,
    address: String,
    idProofType: String,
    idProofDocumentUrl: String,
    addressProofType: String,
    addressProofDocumentUrl: String,
    borrowerProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'BorrowerProfile', // Assuming you'll have a BorrowerProfile model
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id.toString(); // Ensure id is a string
            delete ret._id;
            delete ret.__v;
            delete ret.passwordHash; // Don't send password hash to client
        }
    },
    toObject: {
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id.toString(); // Ensure id is a string
            delete ret._id;
            delete ret.__v;
            delete ret.passwordHash; // Don't send password hash to client when converting to object for response
        }
    }
  }
);

// Add a virtual 'id' property to get the _id as a string
// This is redundant if toJSON/toObject virtuals are correctly transforming _id to id as string.
// However, explicitly defining it doesn't hurt.
if (!UserSchema.virtuals['id']) {
    UserSchema.virtual('id').get(function(this: UserDocument) {
        return this._id.toHexString();
    });
}


const UserModel = models.User || mongoose.model<UserDocument>('User', UserSchema);

export default UserModel as Model<UserDocument>;
