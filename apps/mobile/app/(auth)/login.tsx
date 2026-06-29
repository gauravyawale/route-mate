import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../../hooks/useTheme";

export default function LoginScreen() {
  const { theme } = useTheme();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    console.log("Send OTP tapped, phone:", phone);
    if (!/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert("Invalid number", "Enter a valid 10-digit mobile number.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/v1/auth/send-otp", { country_code: "+91", phone });
      setStep("otp");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error?.message ?? "Failed to send OTP.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "Enter the 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/api/v1/auth/verify-otp", {
        country_code: "+91",
        phone,
        otp,
      });

      const { user, tokens } = res.data.data;
      await setUser(user, tokens.accessToken, tokens.refreshToken);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error?.message ?? "Invalid OTP. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}
      >
        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: theme.brand,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: theme.textInverse,
                fontSize: 24,
                fontWeight: "bold",
              }}
            >
              R
            </Text>
          </View>
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 24,
              fontWeight: "bold",
            }}
          >
            Route Mate
          </Text>
          <Text
            style={{ color: theme.textSecondary, fontSize: 14, marginTop: 4 }}
          >
            Share your ride, share the journey
          </Text>
        </View>

        {/* Card */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 16,
          }}
        >
          {step === "phone" ? (
            <>
              <View>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                >
                  Mobile Number
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View
                    style={{
                      backgroundColor: theme.inputBg,
                      borderWidth: 1,
                      borderColor: theme.inputBorder,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: theme.textPrimary }}>+91</Text>
                  </View>
                  <TextInput
                    style={{
                      flex: 1,
                      backgroundColor: theme.inputBg,
                      borderWidth: 1,
                      borderColor: theme.inputBorder,
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      color: theme.textPrimary,
                    }}
                    placeholder="9876543210"
                    placeholderTextColor={theme.textDisabled}
                    keyboardType="number-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <Pressable
                onPress={handleSendOtp}
                disabled={isLoading}
                style={{
                  backgroundColor: theme.actionBg,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.actionText} />
                ) : (
                  <Text style={{ color: theme.actionText, fontWeight: "600" }}>
                    Send OTP
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <View>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                >
                  Enter OTP sent to +91 {phone}
                </Text>
                <TextInput
                  style={{
                    backgroundColor: theme.inputBg,
                    borderWidth: 1,
                    borderColor: theme.inputBorder,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: theme.textPrimary,
                    textAlign: "center",
                    fontSize: 18,
                    letterSpacing: 4,
                  }}
                  placeholder="123456"
                  placeholderTextColor={theme.textDisabled}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  editable={!isLoading}
                />
              </View>

              <Pressable
                onPress={handleVerifyOtp}
                disabled={isLoading}
                style={{
                  backgroundColor: theme.actionBg,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.actionText} />
                ) : (
                  <Text style={{ color: theme.actionText, fontWeight: "600" }}>
                    Verify OTP
                  </Text>
                )}
              </Pressable>

              <Pressable onPress={() => setStep("phone")} disabled={isLoading}>
                <Text
                  style={{
                    color: theme.textSecondary,
                    textAlign: "center",
                    fontSize: 14,
                  }}
                >
                  Change phone number
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
