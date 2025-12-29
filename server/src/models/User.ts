import mongoose, { Schema } from 'mongoose';

export type UserRole = 'OVERSEER' | 'FIELD_AGENT';

export interface IUser {
  username: string;
  passwordHash: string;
  role: UserRole;
  // Field agents have no station binding in task-based workflow

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['OVERSEER', 'FIELD_AGENT'], index: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
