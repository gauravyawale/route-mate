import { z } from "zod";

// v1 — India only. Add more codes here when expanding.
const SUPPORTED_COUNTRY_CODES = ["+91"] as const;

export const sendOtpSchema = z.object({
  country_code: z.enum(SUPPORTED_COUNTRY_CODES, {
    message: "Unsupported country code. Only +91 (India) is supported.",
  }),
  phone: z
    .string()
    .length(10, "Phone number must be 10 digits")
    .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
});

export const verifyOtpSchema = z.object({
  country_code: z.enum(SUPPORTED_COUNTRY_CODES, {
    message: "Unsupported country code. Only +91 (India) is supported.",
  }),
  phone: z
    .string()
    .length(10, "Phone number must be 10 digits")
    .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
