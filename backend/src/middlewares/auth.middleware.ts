import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export interface AuthenticatedRequest extends Request {
    user?: any;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        
        if (!token) {
            res.status(401).json({ message: "Not authorized, no token" });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            res.status(401).json({ message: "Not authorized, user not found" });
            return;
        }

        req.user = user;
        
        next();
    } catch (error) {
        res.status(401).json({ message: "Not authorized, token failed" });
        return;
    }
};
