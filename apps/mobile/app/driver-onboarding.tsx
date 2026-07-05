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
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useTheme } from "../hooks/useTheme";
import { fonts } from "../lib/theme";
import { api } from "../lib/api";

// Validates Indian DL format: SS RR YYYY NNNNNNN
// Accepts with or without space/hyphen between RTO and year
// e.g. DL14 20110012345 or MH12-20210012345
const LICENSE_REGEX = /^[A-Z]{2}\d{2}[\s-]?\d{4}\d{7}$/;

function validateLicense(value: string): string | null {
  const cleaned = value.trim().toUpperCase();
  if (!cleaned) return "License number is required.";
  if (!LICENSE_REGEX.test(cleaned)) {
    return "Invalid format. Use SS RR YYYY NNNNNNN (e.g. MH12 20210012345)";
  }
  return null;
}

export default function DriverOnboardingScreen() {
  const { theme, isDark } = useTheme();

  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [licenseExpiry, setLicenseExpiry] = useState<Date>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5); // default 5 years from now
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLicenseChange = (value: string) => {
    setLicenseNumber(value);
    if (licenseError) setLicenseError(validateLicense(value));
  };

  const handleApply = async () => {
    const error = validateLicense(licenseNumber);
    if (error) {
      setLicenseError(error);
      return;
    }

    if (licenseExpiry <= new Date()) {
      Alert.alert("Error", "License expiry date must be in the future.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/v1/onboarding/apply", {
        license_number: licenseNumber.trim().toUpperCase(),
        license_expiry: licenseExpiry.toISOString().split("T")[0], // YYYY-MM-DD
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
    borderColor: licenseError ? theme.error : theme.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 15,
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
            and approve within 24 hours.
          </Text>
        </View>

        {/* License number */}
        <Text style={labelStyle}>License Number</Text>
        <TextInput
          style={inputStyle}
          placeholder="e.g. MH12 20210012345"
          placeholderTextColor={theme.textDisabled}
          value={licenseNumber}
          onChangeText={handleLicenseChange}
          autoCapitalize="characters"
          maxLength={16}
        />
        {licenseError ? (
          <Text
            style={{
              color: theme.error,
              fontFamily: fonts.regular,
              fontSize: 12,
              marginTop: 4,
              marginBottom: 12,
            }}
          >
            {licenseError}
          </Text>
        ) : (
          <Text
            style={{
              color: theme.textDisabled,
              fontFamily: fonts.regular,
              fontSize: 12,
              marginTop: 4,
              marginBottom: 12,
            }}
          >
            Format: State Code + RTO + Year + Serial (e.g. DL14 20110012345)
          </Text>
        )}

        {/* License expiry — date picker */}
        <Text style={labelStyle}>License Expiry Date</Text>
        <Pressable
          onPress={() => setShowDatePicker(true)}
          style={{
            backgroundColor: theme.inputBg,
            borderWidth: 1,
            borderColor: theme.inputBorder,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginBottom: 32,
          }}
        >
          <Text
            style={{
              color: theme.textSecondary,
              fontFamily: fonts.medium,
              fontSize: 11,
              marginBottom: 2,
            }}
          >
            EXPIRY DATE
          </Text>
          <Text
            style={{
              color: theme.textPrimary,
              fontFamily: fonts.semibold,
              fontSize: 15,
            }}
          >
            {licenseExpiry.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={licenseExpiry}
            mode="date"
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setLicenseExpiry(date);
            }}
          />
        )}

        {/* Submit */}
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
