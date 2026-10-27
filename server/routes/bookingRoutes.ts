import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { createBooking, getMyBookings, cancelBooking } from "../controllers/bookingControllers.js";

const bookingRouter = Router();

bookingRouter.post("/", protect, createBooking);
bookingRouter.get("/my",protect,  getMyBookings);
bookingRouter.put("/id/cancel", protect, cancelBooking);

export default bookingRouter;