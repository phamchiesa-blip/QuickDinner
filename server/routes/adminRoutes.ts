import {Router} from "express";
import {getAllRetaurants, approveRetaurants, getAdminStats} from '../controllers/adminControllers.js'
import { protect, admin } from "../middleware/auth.js";

const adminRouter = Router();

adminRouter.use(protect);
adminRouter.use(admin);

adminRouter.get("/restaurants", getAllRetaurants);
adminRouter.put("/restaurants/:id/approve", approveRetaurants);
adminRouter.get("/stats", getAdminStats);

export default adminRouter;
