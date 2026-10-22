import { model, Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: "user" | "admin" | "owner";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6, maxLength: 15  },
    phone: { type: String, required: true, minlength: 10},
    role: { type: String, required: true, enum: ["user", "admin", "owner"], default: "user" },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, 
{ timestamps: true });

// Remove password field when converting to JSON
UserSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  }
});

export const User = model<IUser>('User', UserSchema);