import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// middleware to protect routes
export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
    const token = req.header('x-auth-token');

    // check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // verify token
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey123');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
