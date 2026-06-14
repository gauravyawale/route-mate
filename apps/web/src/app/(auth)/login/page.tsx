"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ─── Schemas ───────────────────────────────────────────────

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Enter a valid phone number")
    .regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number"),
});

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^[0-9]+$/, "OTP must be numeric"),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;

// ─── Component ─────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const initialized = useRef(false);

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    setStep("phone");
    setPhone("");
    phoneForm.reset();
    otpForm.reset();
  }, []);

  // ── Step 1: send OTP ──────────────────────────────────────
  const onSendOtp = async (data: PhoneForm) => {
    setIsLoading(true);
    try {
      await api.post("/api/v1/auth/send-otp", { phone: data.phone });
      setPhone(data.phone);
      setStep("otp");
      toast.success("OTP sent to your phone.");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────
  const onVerifyOtp = async (data: OtpForm) => {
    setIsLoading(true);
    try {
      const res = await api.post("/api/v1/auth/verify-otp", {
        phone,
        otp: data.otp,
      });

      const { user, tokens } = res.data.data;
      const { accessToken, refreshToken } = tokens;

      // block non-admin users
      if (user.role !== "admin") {
        toast.error("Access denied. Admin accounts only.");
        return;
      }

      setUser(user, accessToken, refreshToken);
      toast.success(`Welcome, ${user.full_name || "Admin"}`);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ?? "Invalid OTP. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "hsl(var(--primary))" }}
            >
              <span
                style={{ color: "hsl(var(--primary-foreground))" }}
                className="text-sm font-bold"
              >
                R
              </span>
            </div>
            <span className="font-semibold text-zinc-900">Route Mate</span>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
          <CardDescription>
            {step === "phone"
              ? "Enter your admin phone number to continue."
              : `Enter the OTP sent to ${phone}`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === "phone" ? (
            <form
              onSubmit={phoneForm.handleSubmit(onSendOtp)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+919876543210"
                  {...phoneForm.register("phone")}
                  disabled={isLoading}
                />
                {phoneForm.formState.errors.phone && (
                  <p className="text-sm text-red-500">
                    {phoneForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={otpForm.handleSubmit(onVerifyOtp)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Password</Label>
                <Input
                  id="otp"
                  placeholder="123456"
                  maxLength={6}
                  {...otpForm.register("otp")}
                  disabled={isLoading}
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-sm text-red-500">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep("phone")}
                disabled={isLoading}
              >
                Change phone number
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
