import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';

export const logger = (req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.url}`);
    next();
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (user && user.user_type === "ADMIN") {
        next();
    } else {
        res.status(403).json({ message: "Forbidden: Admins only" });
    }
};

export const isOwner = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const targetId = req.body.author;

    if (user && user.id === targetId) {
        next();
    } else {
        res.status(403).json({ message: "Forbidden: Access to own resources only" });
    }
};

export const validateRequestBody = (requiredFields: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const missingFields = requiredFields.filter(field => !(field in req.body));

        if (missingFields.length > 0) {
            res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
        } else {
            next();
        }
    };
};

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const payload = AuthService.verifyToken(token);
    
    if (!payload) {
        res.status(401).json({ message: 'Invalid token' });
        return;
    }

    (req as any).user = { id: payload.sub, user_type: payload.user_type };
    next();
};