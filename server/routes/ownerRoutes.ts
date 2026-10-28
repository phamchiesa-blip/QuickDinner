import {Router} from "express";
import {createOwnerRestaurant, getOwnerRestaurant, updateOwnerRestaurant, getOwnerBookings, updateBookingStatus} from "../controllers/ownerControllers.js"
import upload from "../config/multer.js";
import { protect, owner } from "../middleware/auth.js";

const ownerRouter = Router();

ownerRouter.use(protect);
ownerRouter.use(owner);

ownerRouter.get("/restaurant", getOwnerRestaurant);
ownerRouter.post("/restaurant", upload.single("image"), createOwnerRestaurant);
ownerRouter.put("/restaurant", upload.single("image"), updateOwnerRestaurant);
ownerRouter.get("/bookings", getOwnerBookings);
ownerRouter.put("/bookings/:id/status", updateBookingStatus);

export default ownerRouter;