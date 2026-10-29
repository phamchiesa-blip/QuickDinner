import "dotenv/config";
import express, { NextFunction, Request, Response } from 'express';
import cors from "cors";
import connectDB from './config/db.js';
import authRouter from "./routes/authRoutes.js";
import restaurantRouter from "./routes/restaurantRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import ownerRouter from './routes/ownerRoutes.js'
import adminRouter from "./routes/adminRoutes.js";
import { admin } from "./middleware/auth.js";

const app = express();

// connect to DB
await connectDB();

// Middleware
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use("/api/auth", authRouter); 
app.use("/api/restaurants", restaurantRouter); 
app.use("/api/bookings", bookingRouter); 
app.use("/api/owner", ownerRouter); 
app.use("/api/admin", adminRouter); 

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandle Error: ", err);
    res.status(500).json({ message: 'Something went wrong!',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
     });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});