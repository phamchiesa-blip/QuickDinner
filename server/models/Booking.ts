import { model, Schema, Document } from 'mongoose';
import { Types } from 'mongoose';
import crypto from 'crypto';

export interface IBooking extends Document {
  user: Types.ObjectId;
  restaurant: Types.ObjectId;
  date: Date;
  time: string;
  guests: number;
  occasion?: string;
  specialRequests?: string;
  bookingId: string;
  status: 'cancelled' | 'confirmed' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
    user: { type: Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: Types.ObjectId, ref: 'Restaurant', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    guests: { type: Number, required: true, min: 1 },
    occasion: { type: String },
    specialRequests: { type: String },
    status: { type: String, enum: ['cancelled', 'confirmed', 'completed'], default: 'confirmed' },
    bookingId: { 
        type: String, 
        required: true, 
        unique: true, 
        default: () => `GR-${crypto.randomBytes(4).toString('hex').toUpperCase()}` 
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, 
{ timestamps: true });

// Auto generate reference code on validate if missing
BookingSchema.pre('validate', function () {
   if(!this.bookingId) {
      this.bookingId = `GR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
   }
});

export const Booking = model<IBooking>('Booking', BookingSchema);
