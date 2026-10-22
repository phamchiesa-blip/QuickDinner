import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/User.js";
import JWT from "jsonwebtoken";
import { User } from "../models/User.js";

export interface AuthenticatedRequest extends Request {
    user?: IUser;
}

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
   let token: string | undefined;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded: any = JWT.verify(token, process.env.JWT_SECRET!) as { id: string };

            // Get user from the token, excluding the password field
            const user = await User.findById(decoded.id).select('-password');
            if(!user) {
                res.status(401).json({ message: 'Not authorized, user not found' });
                return;
            }

            req.user = user;
            next();
        } catch (error: any) {
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    }

    // ko có token do chưa đăng nhập/đăng kí! 
    if(!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }
}    


export const admin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if(req.user && req.user.role === 'admin') {
       next(); 
    } else {
        res.status(403).json({ message: 'Not authorized, user is not an admin' });
    }
}   

export const owner = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if(req.user && req.user.role === 'owner') {
       next(); 
    } else {
        res.status(403).json({ message: 'Not authorized, user is not an owner' });
    }
} 