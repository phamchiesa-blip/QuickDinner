import { AuthenticatedRequest } from "../middleware/auth.js"
import { Response } from "express"
import { Restaurant } from "../models/Restaurant.js";
import {v2 as cloudinary} from 'cloudinary'
import { Booking } from "../models/Booking.js";

// Helper function to upload buffer to CLoudinary
const uploadToCloudinary = (fileBuffer: Buffer) : Promise<{secure_url: string}> => { // trả về secure_url
    return new Promise((resolve, reject) => {
        // bắt đầu tải ảnh lên thư mục QuickDine
        const stream = cloudinary.uploader.upload_stream({folder: "QuickDine"}, 
            (error, result)=> {
                if(error) {
                    return reject(error);
                }
                if(!result) {
                    return reject(new Error("Upload failed!"));
                }
                // Nếu tải thành công, Promise hoàn tất với URL bảo mật của ảnh
                resolve({secure_url: result.secure_url});
        });
        // Gửi dữ liệu ảnh vào luồng tải lên. Khi tải xong, callback ở bước 3 sẽ xử lý kết quả.
        stream.end(fileBuffer);
    });
}


// Get owner's restaurant
// GET /api/owner/restaurant
export const getOwnerRestaurant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const restaurant = await Restaurant.findOne({owner: req.user?._id});
        if(!restaurant) {
            res.status(200).json(null);
            return;
        }
        res.json(restaurant);
    } catch(error: any) {
        res.status(400).json({message: error.message});
    }
} 

// Create owner's restaurant (submitted to pending)
// POST /api/owner/restaurant
export const createOwnerRestaurant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const existing = await Restaurant.findOne({owner: req.user?._id});
        if(existing) {
            res.status(400).json({message: "You already have a restaurant registered"});
            return;
        }

        const {name, description, cuisine, priceRange, location, 
        address, chef, tags, availableSlots, totalSeats} = req.body;

        if(!name || !description || !cuisine || !priceRange || !location || 
        !address || !chef || !tags || !availableSlots || !totalSeats) {
            res.status(400).json({message: "Please provide all required fields!"});
            return;
        }

        // Generate slug from name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

        const slugExists = await Restaurant.findOne({slug});
        if(slugExists) {
            res.status(400).json({message: "A restaurant with this name aldeady exists!"});
            return;
        }

        // Handle image
        let imageUrl = "";
        if(req.file) {
           const result = await uploadToCloudinary(req.file.buffer);
           imageUrl = result.secure_url;
        }

        // Setup parsed tags and slots
        const parsedTags = typeof tags === 'string' ? tags.split(",").map(t => t.trim())
        : tags || [];
        const parsedSlots = typeof availableSlots === "string" ? availableSlots.split(",").
        map(s => s.trim()) : availableSlots || ["17:00", "18:00", "19:00", "20:00", "21:00"];

        const restaurant = await Restaurant.create({
            name,
            slug,
            description,
            cuisine,
            location,
            priceRange,
            address,
            image: imageUrl,
            chef,
            tags: parsedTags,
            availableSlots: parsedSlots,
            totalSeats: totalSeats ? Number(totalSeats) : 20,
            owner: req.user?._id,
            status: "pending"
        });

        res.status(201).json(restaurant);
    } catch(error: any) {
        res.status(400).json({message: error.message});
    }
}

// Update owner's restaurant 
// PUT /api/owner/restaurant
export const updateOwnerRestaurant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const restaurant = await Restaurant.findOne({owner: req.user?._id});
        if(!restaurant) {
            res.status(404).json({message: "Restaurant profile is not found"});
            return;
        }

        const {name, description, cuisine, priceRange, location, 
        address, chef, tags, availableSlots, totalSeats} = req.body; 

        if(name) restaurant.name = name;
        if(description) restaurant.description = description;
        if(cuisine) restaurant.cuisine = cuisine;
        if(priceRange) restaurant.priceRange = priceRange;
        if(location) restaurant.location = location;
        if(address) restaurant.address = address;
        if(chef) restaurant.chef = chef;
        if(totalSeats) restaurant.totalSeats = Number(totalSeats);

        if(tags) {
            restaurant.tags = typeof tags === 'string' ? tags.split(",").map(t => t.trim())
            : tags;
        }

        if(availableSlots) {
           restaurant.availableSlots = typeof availableSlots === "string" ? availableSlots.split(",").
            map(s => s.trim()) : availableSlots;
        }

        // Handle new image upload if any
        if(req.file) {
           const result = await uploadToCloudinary(req.file.buffer);
           restaurant.image = result.secure_url;
        }

        const update = await restaurant.save();
        res.json(update);
    } catch(error: any) {
        res.status(400).json({message: error.message});
    }
}

// Get bookings for owner's restaurant 
// GET /api/owner/bookings
export const getOwnerBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const restaurant = await Restaurant.findOne({owner: req.user?._id});

        if(!restaurant) {
            res.status(404).json({message: "Restaurant peofile is not found!"});
            return;
        }

        const bookings = await Booking.find({restaurant: restaurant._id}).populate("user", "name email phone").
        sort({date: -1, time: -1});

        res.json(bookings);
    } catch(error: any) {
        res.status(400).json({message: error.message});
    }
}

// Update status for a booking
// PUT /api/owner/bookings/:id/status
export const updateBookingStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {status} = req.body;
        if(!status || !["confirmed", "cancelled", "completed"].includes(status)) {
            res.status(400).json({message: "please enter a valid booking status"});
            return;
        }

        const booking = await Booking.findById(req.params.id);
        if(!booking) {
            res.status(404).json({message: "Booking is not found"});
            return;
        }

        // Verify booking belongs to the owner's restaurant
        const restaurant = await Restaurant.findById(booking.restaurant);
        if(!restaurant || restaurant.owner.toString() !== req.user?._id.toString()) {
            res.status(401).json({message: "Not authorized"});
            return;
        }

        booking.status = status;
        await booking.save();
        res.json(booking);

    } catch(error: any) {
        res.status(400).json({message: error.message});
    }
}