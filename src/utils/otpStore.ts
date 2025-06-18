export interface OtpEntry {
  email: string;
  otp: string;
  name: string;
  passwordHash: string;
  expiresAt: Date;
}

export const otpStore = new Map<string, OtpEntry>();