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
  Image,
} from "react-native";
import { router } from "expo-router";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../../hooks/useTheme";
import { fonts } from "../../lib/theme";

export default function LoginScreen() {
  const { theme, isDark } = useTheme();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
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

  const handleDemoLogin = async (role: "rider" | "driver") => {
    setIsLoading(true);
    try {
      const res = await api.post("/api/v1/auth/demo-login", { role });
      const { user, tokens } = res.data.data;
      await setUser(user, tokens.accessToken, tokens.refreshToken);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error?.message ?? "Demo login failed.",
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
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              backgroundColor: theme.brand,
              marginBottom: 16,
              shadowColor: theme.brand,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
              overflow: "hidden",
            }}
          >
            <Image
              source={require("../../assets/icon.png")}
              style={{ width: 64, height: 64 }}
              resizeMode="cover"
            />
          </View>
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 26,
              fontFamily: fonts.bold,
            }}
          >
            Route Mate
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 14,
              marginTop: 4,
              fontFamily: fonts.regular,
            }}
          >
            Share your ride, share the journey
          </Text>
        </View>

        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 20,
            padding: 24,
            gap: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.4 : 0.08,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          {step === "phone" ? (
            <>
              <View>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 13,
                    marginBottom: 8,
                    fontFamily: fonts.medium,
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
                    <Text
                      style={{
                        color: theme.textPrimary,
                        fontFamily: fonts.medium,
                      }}
                    >
                      +91
                    </Text>
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
                      fontFamily: fonts.regular,
                      fontSize: 15,
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
                  shadowColor: theme.actionBg,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.actionText} />
                ) : (
                  <Text
                    style={{
                      color: theme.actionText,
                      fontFamily: fonts.semibold,
                      fontSize: 15,
                    }}
                  >
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
                    fontSize: 13,
                    marginBottom: 8,
                    fontFamily: fonts.medium,
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
                    fontSize: 20,
                    letterSpacing: 6,
                    fontFamily: fonts.semibold,
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
                  shadowColor: theme.actionBg,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.actionText} />
                ) : (
                  <Text
                    style={{
                      color: theme.actionText,
                      fontFamily: fonts.semibold,
                      fontSize: 15,
                    }}
                  >
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
                    fontFamily: fonts.medium,
                  }}
                >
                  Change phone number
                </Text>
              </Pressable>
            </>
          )}
        </View>
        {step === "phone" && (
          <View style={{ marginTop: 24 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View
                style={{ flex: 1, height: 1, backgroundColor: theme.border }}
              />
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 12,
                  marginHorizontal: 12,
                  fontFamily: fonts.medium,
                }}
              >
                OR TRY DEMO
              </Text>
              <View
                style={{ flex: 1, height: 1, backgroundColor: theme.border }}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => handleDemoLogin("rider")}
                disabled={isLoading}
                style={{
                  flex: 1,
                  backgroundColor: theme.brand + "15",
                  borderWidth: 1,
                  borderColor: theme.brand,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>🧳</Text>
                <Text
                  style={{
                    color: theme.brand,
                    fontFamily: fonts.semibold,
                    fontSize: 12,
                  }}
                >
                  Rider
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleDemoLogin("driver")}
                disabled={isLoading}
                style={{
                  flex: 1,
                  backgroundColor: theme.actionBg + "15",
                  borderWidth: 1,
                  borderColor: theme.actionBg,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>🚗</Text>
                <Text
                  style={{
                    color: theme.actionBg,
                    fontFamily: fonts.semibold,
                    fontSize: 12,
                  }}
                >
                  Driver
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
