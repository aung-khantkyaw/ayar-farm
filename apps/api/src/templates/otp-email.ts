export const otpEmailTemplate = (otp: string): string => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="background-color: #4CAF50; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">AyarFarm Link MSME</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                                Your AyarFarm Link MSME verification code is:
                            </p>
                            <div style="background-color: #f8f8f8; border: 2px dashed #4CAF50; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 30px 0;">
                                <span style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 8px;">${otp}</span>
                            </div>
                            <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">
                                This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                © ${new Date().getFullYear()} AyarFarm Link MSME. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
