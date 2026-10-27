import {AuthenticatedRequest} from "../middleware/auth.js";
import { Response } from "express";
import {Restaurant} from "../models/Restaurant.js";
import {Booking} from "../models/Booking.js";

// Create a new booking
// POST /api/bookings
// @access Private
export const createBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try{
        const { restaurantId, date, time, guests, occasion, specialRequests } = req.body;
        if(!restaurantId || !date || !time || !guests) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }

        // check if the restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if(!restaurant) {
            res.status(404).json({ message: "Restaurant not found" });
            return;
        }

        // Verify restaurant is approved
        if(restaurant.status !== "approved") {
            res.status(400).json({ message: "Reservations are not available for this restaurant" });
            return;
        }

        // Kiểm tra số ghế còn trống cho nhà hàng, ngày và giờ đã chọn
        const requestedGuests = Number(guests);
        // Tìm các lượt đặt đã "confirmed" đúng nhà hàng, ngày và giờ.
        const existingBookings = await Booking.find({
            restaurant: restaurantId,
            date: new Date(date),
            time: time,
            status: "confirmed"
        });

        // Cộng số khách của những lượt đó để tính số ghế đã đặt.
        const bookedSeats = existingBookings.reduce((total, booking) => total + booking.guests, 0);

        const totalSeats = restaurant.totalSeats || 20;

        const availableSeats = totalSeats - bookedSeats;

        if(requestedGuests > availableSeats) {
            res.status(400).json({ message: "Not enough available seats for the requested time" });
            return;
        }

        const booking = await Booking.create({
            user: req.user?._id,
            restaurant: restaurantId,
            date: new Date(date),
            time: time,
            guests: Number(guests),
            occasion,
            specialRequests,
            status: "confirmed"
        });

        // Lấy thêm một số trường của nhà hàng (name, location, image, address) để đưa vào dữ liệu trả về.
        const populatedBooking = await booking.populate("restaurant", "name location image address");

        res.status(201).json(populatedBooking);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// Get logged in user bookings
// GET /api/bookings/my
// @access Private
export const getMyBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try{
        const bookings = await Booking.find({ user: req.user?._id })
        .populate("restaurant", "name location image address slug")
        .sort({date: -1, time: -1});
        res.status(200).json(bookings);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// Cancel a booking
// PUT /api/bookings/:id/cancel
// @access Private
export const cancelBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try{
        const booking = await Booking.findById(req.params.id);

        if(!booking) {
            res.status(404).json({message: "Booking is not found"});
            return;
        }

        // Verify user owns the booking:
        if(booking.user.toString() !== req.user?._id.toString()) {
            res.status(404).json({message: "Not authorized to cancel this booking!"});
        }

        booking.status = "cancelled";
        await booking.save();

        const populatedBooking = await booking.populate("restaurant", "name location image address");

        res.json(populatedBooking);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}