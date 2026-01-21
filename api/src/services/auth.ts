import jwt from "jsonwebtoken";
import Twilio from "twilio";
import nodemailer from "nodemailer";
import { prisma } from "../prisma/client";
import { otpEmailTemplate } from "../templates/otp-email";

export class AuthService {
    private static twilioClient: ReturnType<typeof Twilio> | null = null;

    public static generateToken(userId: string, userType: string): string {
        const payload = { sub: userId, user_type: userType };
        const secret: jwt.Secret = process.env.JWT_SECRET ?? "changeme";
        const expiresIn: jwt.SignOptions['expiresIn'] = (process.env.JWT_ACCESS_TOKEN_EXPIRES ?? "1h") as jwt.SignOptions['expiresIn'];
        return jwt.sign(payload, secret, { expiresIn });
    }

    public static verifyToken(token: string): any {
        const secret: jwt.Secret = process.env.JWT_SECRET ?? "changeme";
        try {
            return jwt.verify(token, secret);
        } catch (err) {
            return null;
        }
    }

    private static getTwilioClient() {
        if (this.twilioClient) return this.twilioClient;
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        if (!sid || !token) return null;
        this.twilioClient = Twilio(sid, token);
        return this.twilioClient;
    }

    /**
     * Request an SMS verification via Twilio Verify (async).
     * Requires TWILIO_VERIFY_SERVICE_SID in .env.
     * Returns true if request accepted by Twilio.
     */
    public static async sendOTP(phoneNumber: string): Promise<boolean> {
        const client = this.getTwilioClient();
        const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
        if (!client || !serviceSid) {
            console.warn("Twilio Verify not configured (missing SID/ACCOUNT/AUTH).");
            return false;
        }
        try {
            await client.verify.v2.services(serviceSid)
                .verifications
                .create({ to: phoneNumber, channel: 'sms' });
            return true;
        } catch (err) {
            console.error("Twilio Verify send failed:", err);
            return false;
        }
    }

    /**
     * Verify an OTP code previously sent via Twilio Verify.
     * Returns true if code is valid.
     */
    public static async verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
        const client = this.getTwilioClient();
        const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
        if (!client || !serviceSid) {
            console.warn("Twilio Verify not configured (missing SID/ACCOUNT/AUTH).");
            return false;
        }
        try {
            const verification_check = await client.verify.v2.services(serviceSid)
                .verificationChecks
                .create({ to: phoneNumber, code });
            return verification_check.status === "approved";
        } catch (err) {
            console.error("Twilio Verify check failed:", err);
            return false;
        }
    }

    public static async sendOTPEmail(toEmail: string, otp: string): Promise<boolean> {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_USE_TLS === 'true',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,   // 10 seconds
            socketTimeout: 20000,     // 20 seconds
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM_NAME,
            to: toEmail,
            subject: 'AyarFarm Link MSME - Account Verification',
            html: otpEmailTemplate(otp),
        };

        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (err) {
            console.error("Email send failed:", err);
            return false;
        }
    }

    public static async verifyOTPEmail(email: string, otp: string): Promise<boolean> {
        const user = await prisma.users.findFirst({ 
            where: { email, verificationToken: otp } 
        });
        
        if (!user || !user.verificationTokenExpiresAt) return false;
        
        return user.verificationTokenExpiresAt > new Date();
    }

    public static async sendResetEmail(toEmail: string, otp: string): Promise<boolean> {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_USE_TLS === 'true',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,   // 10 seconds
            socketTimeout: 20000,     // 20 seconds
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM_NAME,
            to: toEmail,
            subject: 'AyarFarm Link MSME - Reset your AyarFarm password',
            html: otpEmailTemplate(otp),
        };

        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (err) {
            console.error("Email send failed:", err);
            return false;
        }
    }

    public static async verifyResetOTPEmail(email: string, otp: string): Promise<boolean> {
        const user = await prisma.users.findFirst({
            where: { email, resetPasswordToken: otp },
        });
        if (!user || !user.resetPasswordExpiresAt) return false;
        
        return user.resetPasswordExpiresAt > new Date();
    }
}