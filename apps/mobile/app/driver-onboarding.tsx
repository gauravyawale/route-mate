import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "../hooks/useTheme";
import { fonts } from "../lib/theme";
import { api } from "../lib/api";

export default function DriverOnboardingScreen() {
  const { theme, isDark } = useTheme();
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApply = async () => {
    if (!licenseNumber.trim()) {
      Alert.alert("Error", "Please enter your license number.");
      return;
    }
    if (!licenseExpiry.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(licenseExpiry)) {
      Alert.alert("Error", "Please enter expiry date in YYYY-MM-DD format.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/v1/onboarding/apply", {
        license_number: licenseNumber.trim(),
        license_expiry: licenseExpiry.trim(),
      });
      Alert.alert(
        "Application Submitted! 🎉",
        "Your driver application is under review. We'll notify you once approved.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error?.message ?? "Failed to submit application.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 15,
    marginBottom: 16,
  };

  const labelStyle = {
    color: theme.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginBottom: 6,
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Text
            style={{
              color: theme.brand,
              fontFamily: fonts.medium,
              fontSize: 16,
            }}
          >
            ← Back
          </Text>
        </Pressable>
        <Text
          style={{
            color: theme.textPrimary,
            fontFamily: fonts.bold,
            fontSize: 20,
          }}
        >
          Become a Driver
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Info card */}
        <View
          style={{
            backgroundColor: theme.brand + "15",
            borderRadius: 14,
            padding: 16,
            marginBottom: 28,
            borderWidth: 1,
            borderColor: theme.brand + "30",
          }}
        >
          <Text
            style={{
              color: theme.brand,
              fontFamily: fonts.semibold,
              fontSize: 14,
              marginBottom: 4,
            }}
          >
            🚗 Driver Application
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontFamily: fonts.regular,
              fontSize: 13,
              lineHeight: 20,
            }}
          >
            Submit your driving license details to apply. Our team will review
            your application and approve it within 24 hours.
          </Text>
        </View>

        {/* License number */}
        <Text style={labelStyle}>License Number</Text>
        <TextInput
          style={inputStyle}
          placeholder="e.g. MH12 20210012345"
          placeholderTextColor={theme.textDisabled}
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          autoCapitalize="characters"
        />

        {/* License expiry */}
        <Text style={labelStyle}>License Expiry Date</Text>
        <TextInput
          style={inputStyle}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.textDisabled}
          value={licenseExpiry}
          onChangeText={setLicenseExpiry}
          keyboardType="numeric"
        />

        <Text
          style={{
            color: theme.textDisabled,
            fontFamily: fonts.regular,
            fontSize: 12,
            marginTop: -8,
            marginBottom: 32,
          }}
        >
          Enter date in YYYY-MM-DD format (e.g. 2029-12-31)
        </Text>

        {/* Submit button */}
        <Pressable
          onPress={handleApply}
          disabled={isSubmitting}
          style={{
            backgroundColor: theme.actionBg,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            shadowColor: theme.actionBg,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={{ color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 16 }}
            >
              Submit Application
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
