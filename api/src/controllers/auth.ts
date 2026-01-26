import e, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';

import { prisma } from "../prisma/client";
import { AuthService } from '../services/auth';
import { generateOTP } from '../utils';
import { emitToAdmins } from '../socket';

export class AuthController {

    public async register(req: Request, res: Response): Promise<void> {
        const { name, phone_number, email, password, user_type } = req.body;
        const phoneRegex = /^\+959\d{9}$/;

        // Validate request data
        if (!name || !phone_number || !password || !user_type) {
            res.status(400).json({ message: 'All fields are required' });
            return;
        }

        if (!phoneRegex.test(phone_number)) {
            res.status(400).json({ message: 'Invalid phone number format. Use +959 followed by 9 digits.' });
            return;
        }

        // Check if user already exists
        const existingUser = await prisma.users.findFirst({
            where: {
                OR: [
                    { phone_number },
                    { email }
                ]
            },
        });

        if (existingUser) {
            res.status(409).json({ message: 'User Already Exists' });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.users.create({
            data: {
                name,
                phone_number,
                email,
                password: hashedPassword,
                user_type,
                verificationToken: null,
                verificationTokenExpiresAt: null,
                isVerified: true
            }
        });

        // let otp: string | null = null;
        // let otpExpiry: Date | null = null;

        // if (email) {
        //     otp = generateOTP();
        //     otpExpiry = new Date();
        //     otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);
        // }

        // Create user
        // const user = await prisma.users.create({
        //     data: {
        //         name,
        //         phone_number,
        //         email,
        //         password: hashedPassword,
        //         user_type,
        //         verificationToken: otp,
        //         verificationTokenExpiresAt: otpExpiry,
        //     }
        // });

        // Send OTP via email or phone
        // const isSent = email 
        //     ? await AuthService.sendOTPEmail(user.email!, otp!)
        //     : await AuthService.sendOTP(user.phone_number);

        // if (!isSent) {
        //     try {
        //         await prisma.users.delete({ where: { id: user.id } });
        //     } catch (e) {
        //         console.warn('Failed to rollback user after OTP send failure', e);
        //     }
        //     if (!res.headersSent) {
        //         res.status(500).json({ message: 'Failed to send OTP' });
        //     }
        //     return;
        // }

        if (res.headersSent) return;

        // Generate JWT token
        const token = AuthService.generateToken(user.id, user.user_type);

        // Notify admins
        emitToAdmins('user:registered', { user: { name: user.name, user_type: user.user_type } });

        // return user data without password
        const { password: _pwd, ...userWithoutPassword } = user;
        res.status(201).json({ message: 'User registered successfully', data: { user: userWithoutPassword, token } });
    }

    public async login(req: Request, res: Response): Promise<void> {
        try {
            const { phone_number, email, password } = req.body;

            if (!phone_number && !email) {
                res.status(400).json({ message: 'Phone number or email is required' });
                return;
            }

            let user;
            if (phone_number) {
                user = await prisma.users.findUnique({ where: { phone_number } });
            } else if (email) {
                user = await prisma.users.findUnique({ where: { email } });
            }

            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            
            const isValidPassword = await bcrypt.compare(password, user.password);
            const isVerified = user.isVerified;

            if (!isVerified) {
                res.status(403).json({ message: 'Account not verified. Please verify your account before logging in.' });
                return;
            }

            if (isValidPassword && isVerified) {
                // Generate JWT token
                const token = AuthService.generateToken(user.id, user.user_type);

                await prisma.users.update({
                    where: { id: user.id },
                    data: { last_login: new Date() },
                });

                // return user data without password
                const { password: _pwd, ...userWithoutPassword } = user;
                res.status(200).json({ message: 'Login successful', data: { user: userWithoutPassword, token } });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        } catch (error) {
            res.status(500).json({ message: `Login failed: ${error}` });
            console.error("Login error:", error);
        }
    }

    public async verify(req: Request, res: Response): Promise<void> {
        const { phone_number, email, code } = req.body;
        if (!phone_number || !email || !code) {
            res.status(400).json({ message: 'phone_number or email and code are required' });
            return;
        }

        // Check user exists
        const user = await prisma.users.findUnique({ where: { phone_number } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Verify via Twilio Verify
        const ok = email
            ? await AuthService.verifyOTPEmail(email, code)
            : await AuthService.verifyOTP(phone_number, code);
        if (!ok) {
            res.status(400).json({ message: 'Invalid or expired code' });
            return;
        }

        // mark user as verified
        const updated = await prisma.users.update({
            where: { id: user.id },
            data: { isVerified: true, verificationToken: null, verificationTokenExpiresAt: null },
        });

        // return user without password
        const { password: _pwd, ...userWithoutPassword } = updated;

        // optionally issue a fresh token
        const token = AuthService.generateToken(updated.id, updated.user_type);

        res.status(200).json({ message: 'Verification successful', data: { user: userWithoutPassword, token } });
    }

    public async resendOTP(req: Request, res: Response): Promise<void> {
        const { phone_number, email } = req.body;
        if (!phone_number && !email) {
            res.status(400).json({ message: 'phone_number or email is required' });
            return;
        }

        const user = await prisma.users.findFirst({ 
            where: email ? { email } : { phone_number } 
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        let otp: string | null = null;
        if (email) {
            otp = generateOTP();
            const otpExpiry = new Date();
            otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);
            await prisma.users.update({
                where: { id: user.id },
                data: { verificationToken: otp, verificationTokenExpiresAt: otpExpiry },
            });
        }

        const isSent = email
            ? await AuthService.sendOTPEmail(email, otp!)
            : await AuthService.sendOTP(phone_number);
            
        if (!isSent) {
            if (!res.headersSent) {
                res.status(500).json({ message: 'Failed to send OTP' });
            }
            return;
        }

        if (!res.headersSent) {
            res.status(200).json({ message: 'OTP resent successfully' });
        }
    }

    public async accountUpdate(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { name, email, gender, location, password, user_type } = req.body;
            const file = (req as any).file;

            const data: Record<string, any> = {};
            if (name) data.name = name;
            if (email) data.email = email;
            if (gender) data.gender = gender;
            if (file) data.profile_picture = file.path;
            if (location) data.location = location;
            if (user_type) data.user_type = user_type;
            if (password) data.password = await bcrypt.hash(password, 10);

            if (Object.keys(data).length === 0) {
                res.status(400).json({ message: "No fields to update" });
                return;
            }

            const updated = await prisma.users.update({ where: { id: userId }, data });
            const { password: _pwd, ...userWithoutPassword } = updated;
            res.status(200).json({ message: "Account updated", data: { user: userWithoutPassword } });
        } catch (err) {
            res.status(500).json({ message: "Update failed", error: String(err) });
        }
    }

    public async forgetPassword(req: Request, res: Response): Promise<void>{
        const { phone_number, email } = req.body;
        if (!phone_number && !email) {
            res.status(400).json({ message: 'phone_number or email is required' });
            return;
        }

        const user = await prisma.users.findFirst({ where: email ? { email } : { phone_number } });
        if (!user) {
            res.status(404).json({ message: 'User not found' }); 
            return;
        }

        let otp: string | null = null;
        if (email) {
            otp = generateOTP();
            const expires = new Date();
            expires.setMinutes(expires.getMinutes() + 10);
            await prisma.users.update({
                where: { id: user.id },
                data: { resetPasswordToken: otp, resetPasswordExpiresAt: expires }
            });
        }

        const isSend = email ? await AuthService.sendResetEmail(email, otp!) : await AuthService.sendOTP(phone_number);

        if (!isSend) {
            if (!res.headersSent) {
                res.status(500).json({ message: 'Failed to send reset code' });
            }
            return;
        }

        if (!res.headersSent) {
            res.status(200).json({ message: 'Reset code sent' });
        }
    }

    public async resetPassword(req: Request, res: Response): Promise<void> {
        const { phone_number, email, code, new_password } = req.body;
        if (!phone_number && !email || !code || !new_password) {
            res.status(400).json({ message: 'phone_number or email, code and new_passwod are required' });
            return;
        }

        const user = await prisma.users.findFirst({ where: email ? { email } : { phone_number } });
        if (!user) {
            res.status(404).json({ message: 'User not found' }); 
            return;
        }

        const isValid = email ? await AuthService.verifyResetOTPEmail(email, code) : await AuthService.verifyOTP(phone_number, code);

        if (!isValid) {
            res.status(400).json({ message: 'Invalid or expired code' });
            return;
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await prisma.users.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpiresAt: null
            },
        });

        res.status(200).json({ message: 'Password reset successful' });
    }

    public async accountDeletion(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const user = await prisma.users.findUnique({ where: { id: userId } });
            
            if (user?.profile_picture) {
                const urlParts = user.profile_picture.split('/');
                const uploadIndex = urlParts.indexOf('upload');
                const publicId = urlParts.slice(uploadIndex + 2).join('/').split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            }
            
            await prisma.users.delete({ where: { id: userId } });
            res.status(200).json({ message: "Account deleted" });
        } catch (err) {
            res.status(500).json({ message: "Deletion failed", error: String(err) });
        }
    }
}