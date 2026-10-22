import {Request, Response} from 'express';
import JWT from 'jsonwebtoken';
import { User } from '../models/User.js';
import bcrypt from 'bcrypt';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Helper to generate JWT token
const generateToken = (id: string) => {
    // Implementation for generating JWT token
    return JWT.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '30d' });
}   



// Register a new user
// POST /api/auth/register
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, phone, role } = req.body;
        if(!name || !email || !password || !phone || !role) {
            res.status(400).json({ message: 'Please provide all required fields' });
            return;
        }

        // check if user already exists
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = await User.create({
            name,
            email,
            password: hashedPassword, // lúc soi psw ở mongoDB thì sẽ không thấy password gốc mà sẽ thấy password đã được hash
            phone,
            role
        });

        if(user) { // check on postman
            res.status(201).json({ 
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                token: generateToken(user._id.toString())
             });
            return;
        } else{
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'Error registering user' });
    }
}

// Authenticate a new user
// POST /api/auth/login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if(!email || !password) {
            res.status(400).json({ message: 'Please provide email and password' });
            return;
        }

        // Find user by email
        const user = await User.findOne({ email });
        if(!user) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password || "");
        if(!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

         // check on postman
        res.status(201).json({ 
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                token: generateToken(user._id.toString())
            });

    }catch (error: any) {
        res.status(500).json({ message: 'Error logging in user' });
    }
}

// Get user profile
// GET /api/auth/me
// @access Private
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
       if(!req.user) { // Nếu ko có người dùng
            res.status(401).json({ message: 'Not authorized' });
            return;
        }
        // có thông tin người dùng trong req.user, trả về thông tin người dùng
        res.json({ user: req.user });
    }catch (error: any) {
        res.status(500).json({ message: 'Error fetching user profile' });
    }
}