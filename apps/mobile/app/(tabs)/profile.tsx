import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { fonts } from "../../lib/theme";
import { api } from "../../lib/api";
import { disconnectSocket } from "../../lib/socket";

const themeOptions: Array<{
  label: string;
  value: "light" | "dark" | "system";
}> = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
  total_seats: number;
  vehicle_type: string;
  is_active: boolean;
}

interface OnboardingStatus {
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
}

export default function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const { mode, setMode } = useThemeStore();
  const { user, updateUser, logout } = useAuthStore();

  const [isTogglingMode, setIsTogglingMode] = useState(false);
  const [onboardingStatus, setOnboardingStatus] =
    useState<OnboardingStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  // vehicle form state
  const [vMake, setVMake] = useState("");
  const [vModel, setVModel] = useState("");
  const [vYear, setVYear] = useState("");
  const [vColor, setVColor] = useState("");
  const [vPlate, setVPlate] = useState("");
  const [vSeats, setVSeats] = useState("4");
  const [vType, setVType] = useState<"car" | "bike">("car");

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.full_name ?? "");
  const [editEmail, setEditEmail] = useState(user?.email ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const isDriver = user?.is_driver_approved;
  const currentMode = user?.active_mode ?? "rider";

  useEffect(() => {
    fetchOnboardingStatus();
    if (isDriver) fetchVehicles();
  }, [isDriver]);

  const fetchOnboardingStatus = async () => {
    try {
      const res = await api.get("/api/v1/onboarding/status");
      setOnboardingStatus(res.data.data);
    } catch {
      // 404 means no application yet — that's fine
      setOnboardingStatus(null);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/api/v1/users/me/vehicles");
      setVehicles(res.data.data ?? []);
    } catch {
      setVehicles([]);
    }
  };

  const handleModeToggle = async (newMode: "rider" | "driver") => {
    if (newMode === currentMode) return;
    setIsTogglingMode(true);
    try {
      await api.patch("/api/v1/users/me/mode", { mode: newMode });
      updateUser({ ...user!, active_mode: newMode });
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error?.message ?? "Failed to switch mode.",
      );
    } finally {
      setIsTogglingMode(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!vMake || !vModel || !vYear || !vColor || !vPlate) {
      Alert.alert("Error", "Please fill in all vehicle details.");
      return;
    }
    const year = parseInt(vYear);
    if (isNaN(year) || year < 1990 || year > new Date().getFullYear() + 1) {
      Alert.alert("Error", "Please enter a valid year.");
      return;
    }
    const seats = parseInt(vSeats);
    if (vType === "bike" && seats !== 1) {
      Alert.alert("Error", "Bikes can only have 1 seat.");
      return;
    }

    setIsAddingVehicle(true);
    try {
      await api.post("/api/v1/users/me/vehicles", {
        make: vMake.trim(),
        model: vModel.trim(),
        year,
        color: vColor.trim(),
        plate_number: vPlate.trim().toUpperCase(),
        total_seats: seats,
        vehicle_type: vType,
      });
      // reset form
      setVMake("");
      setVModel("");
      setVYear("");
      setVColor("");
      setVPlate("");
      setVSeats("4");
      setVType("car");
      setShowAddVehicle(false);
      fetchVehicles();
      Alert.alert("Success", "Vehicle added successfully!");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error?.message ?? "Failed to add vehicle.",
      );
    } finally {
      setIsAddingVehicle(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          disconnectSocket();
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const inputStyle = {
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 14,
    marginBottom: 10,
  };

  const renderDriverSection = () => {
    if (isLoadingStatus) {
      return (
        <ActivityIndicator color={theme.brand} style={{ marginBottom: 28 }} />
      );
    }

    // approved driver
    if (isDriver) {
      return (
        <>
          {/* Mode toggle */}
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 13,
              marginBottom: 10,
              fontFamily: fonts.medium,
            }}
          >
            MODE
          </Text>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: theme.elevated,
              borderRadius: 14,
              padding: 4,
              marginBottom: 28,
            }}
          >
            {(["rider", "driver"] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => handleModeToggle(m)}
                disabled={isTogglingMode}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 11,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                  backgroundColor:
                    currentMode === m ? theme.brand : "transparent",
                }}
              >
                {isTogglingMode && currentMode !== m ? (
                  <ActivityIndicator size="small" color={theme.brand} />
                ) : (
                  <Text
                    style={{
                      color:
                        currentMode === m
                          ? theme.textInverse
                          : theme.textSecondary,
                      fontFamily: fonts.semibold,
                      fontSize: 13,
                    }}
                  >
                    {m === "rider" ? "🧳 Rider" : "🚗 Driver"}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>

          {/* My Vehicles */}
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 13,
              marginBottom: 10,
              fontFamily: fonts.medium,
            }}
          >
            MY VEHICLES
          </Text>
          {vehicles.map((v) => (
            <View
              key={v.id}
              style={{
                backgroundColor: theme.surface,
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View>
                <Text
                  style={{
                    color: theme.textPrimary,
                    fontFamily: fonts.semibold,
                    fontSize: 15,
                  }}
                >
                  {v.make} {v.model} ({v.year})
                </Text>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontFamily: fonts.regular,
                    fontSize: 13,
                  }}
                >
                  {v.plate_number} · {v.total_seats} seats · {v.vehicle_type}
                </Text>
              </View>
              <Text style={{ fontSize: 24 }}>
                {v.vehicle_type === "bike" ? "🏍️" : "🚗"}
              </Text>
            </View>
          ))}

          {/* Add vehicle button */}
          <Pressable
            onPress={() => setShowAddVehicle(!showAddVehicle)}
            style={{
              backgroundColor: "transparent",
              borderWidth: 1.5,
              borderColor: theme.brand,
              borderRadius: 14,
              paddingVertical: 13,
              alignItems: "center",
              marginBottom: showAddVehicle ? 16 : 28,
            }}
          >
            <Text
              style={{
                color: theme.brand,
                fontFamily: fonts.semibold,
                fontSize: 14,
              }}
            >
              {showAddVehicle ? "✕ Cancel" : "+ Add Vehicle"}
            </Text>
          </Pressable>

          {/* Add vehicle form */}
          {showAddVehicle && (
            <View
              style={{
                backgroundColor: theme.surface,
                borderRadius: 16,
                padding: 16,
                marginBottom: 28,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  color: theme.textPrimary,
                  fontFamily: fonts.semibold,
                  fontSize: 15,
                  marginBottom: 14,
                }}
              >
                Add New Vehicle
              </Text>

              {/* Vehicle type toggle */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: theme.elevated,
                  borderRadius: 10,
                  padding: 3,
                  marginBottom: 12,
                }}
              >
                {(["car", "bike"] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => {
                      setVType(t);
                      if (t === "bike") setVSeats("1");
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      alignItems: "center",
                      backgroundColor:
                        vType === t ? theme.brand : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color: vType === t ? "#fff" : theme.textSecondary,
                        fontFamily: fonts.medium,
                        fontSize: 13,
                      }}
                    >
                      {t === "car" ? "🚗 Car" : "🏍️ Bike"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={inputStyle}
                placeholder="Make (e.g. Tata)"
                placeholderTextColor={theme.textDisabled}
                value={vMake}
                onChangeText={setVMake}
              />
              <TextInput
                style={inputStyle}
                placeholder="Model (e.g. Harrier)"
                placeholderTextColor={theme.textDisabled}
                value={vModel}
                onChangeText={setVModel}
              />
              <TextInput
                style={inputStyle}
                placeholder="Year (e.g. 2021)"
                placeholderTextColor={theme.textDisabled}
                value={vYear}
                onChangeText={setVYear}
                keyboardType="numeric"
              />
              <TextInput
                style={inputStyle}
                placeholder="Color (e.g. Black)"
                placeholderTextColor={theme.textDisabled}
                value={vColor}
                onChangeText={setVColor}
              />
              <TextInput
                style={inputStyle}
                placeholder="Plate Number (e.g. MH12AB1234)"
                placeholderTextColor={theme.textDisabled}
                value={vPlate}
                onChangeText={setVPlate}
                autoCapitalize="characters"
              />
              {vType === "car" && (
                <TextInput
                  style={inputStyle}
                  placeholder="Total Seats (e.g. 4)"
                  placeholderTextColor={theme.textDisabled}
                  value={vSeats}
                  onChangeText={setVSeats}
                  keyboardType="numeric"
                />
              )}

              <Pressable
                onPress={handleAddVehicle}
                disabled={isAddingVehicle}
                style={{
                  backgroundColor: theme.actionBg,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                {isAddingVehicle ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: fonts.bold,
                      fontSize: 15,
                    }}
                  >
                    Add Vehicle
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </>
      );
    }

    // pending application
    if (onboardingStatus?.status === "pending") {
      return (
        <View
          style={{
            backgroundColor: "#F59E0B" + "15",
            borderRadius: 14,
            padding: 16,
            marginBottom: 28,
            borderWidth: 1,
            borderColor: "#F59E0B" + "40",
          }}
        >
          <Text
            style={{
              color: "#F59E0B",
              fontFamily: fonts.semibold,
              fontSize: 15,
              marginBottom: 4,
            }}
          >
            🕐 Application Under Review
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontFamily: fonts.regular,
              fontSize: 13,
              lineHeight: 20,
            }}
          >
            Your driver application is being reviewed. We'll notify you once
            it's approved (usually within 24 hours).
          </Text>
        </View>
      );
    }

    // rejected application
    if (onboardingStatus?.status === "rejected") {
      return (
        <View style={{ marginBottom: 28 }}>
          <View
            style={{
              backgroundColor: theme.error + "15",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: theme.error + "40",
            }}
          >
            <Text
              style={{
                color: theme.error,
                fontFamily: fonts.semibold,
                fontSize: 15,
                marginBottom: 4,
              }}
            >
              ❌ Application Rejected
            </Text>
            {onboardingStatus.rejection_reason && (
              <Text
                style={{
                  color: theme.textSecondary,
                  fontFamily: fonts.regular,
                  fontSize: 13,
                }}
              >
                Reason: {onboardingStatus.rejection_reason}
              </Text>
            )}
          </View>
          <Pressable
            onPress={() => router.push("/driver-onboarding")}
            style={{
              backgroundColor: theme.brand,
              borderRadius: 14,
              paddingVertical: 13,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: fonts.semibold,
                fontSize: 14,
              }}
            >
              Reapply as Driver
            </Text>
          </Pressable>
        </View>
      );
    }

    // no application yet
    return (
      <Pressable
        onPress={() => router.push("/driver-onboarding")}
        style={{
          backgroundColor: theme.surface,
          borderWidth: 1.5,
          borderColor: theme.brand,
          borderRadius: 14,
          paddingVertical: 15,
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <Text
          style={{
            color: theme.brand,
            fontFamily: fonts.semibold,
            fontSize: 15,
          }}
        >
          🚗 Become a Driver
        </Text>
      </Pressable>
    );
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await api.patch("/api/v1/users/me", {
        full_name: editName.trim(),
        email: editEmail.trim() || null,
      });
      updateUser({
        ...user!,
        full_name: editName.trim(),
        email: editEmail.trim() || null,
      });
      setIsEditing(false);
      Alert.alert("Success", "Profile updated!");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error?.message ?? "Failed to update profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 60,
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            color: theme.textPrimary,
            fontSize: 26,
            fontFamily: fonts.bold,
            marginBottom: 24,
          }}
        >
          Profile
        </Text>

        {/* User card */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 18,
            padding: 18,
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          {!isEditing ? (
            // view mode
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: theme.brand,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: theme.textInverse,
                    fontSize: 22,
                    fontFamily: fonts.bold,
                  }}
                >
                  {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.textPrimary,
                    fontSize: 17,
                    fontFamily: fonts.semibold,
                  }}
                >
                  {user?.full_name || "Add your name"}
                </Text>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 14,
                    marginTop: 2,
                    fontFamily: fonts.regular,
                  }}
                >
                  {user?.phone}
                </Text>
                {user?.email && (
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: 13,
                      marginTop: 1,
                      fontFamily: fonts.regular,
                    }}
                  >
                    {user.email}
                  </Text>
                )}
              </View>
              <View style={{ alignItems: "flex-end", gap: 8 }}>
                <View
                  style={{
                    backgroundColor:
                      currentMode === "driver"
                        ? theme.actionBg + "20"
                        : theme.brand + "20",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color:
                        currentMode === "driver" ? theme.actionBg : theme.brand,
                      fontFamily: fonts.semibold,
                      fontSize: 12,
                    }}
                  >
                    {currentMode === "driver" ? "Driver" : "Rider"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setEditName(user?.full_name ?? "");
                    setEditEmail(user?.email ?? "");
                    setIsEditing(true);
                  }}
                >
                  <Text
                    style={{
                      color: theme.brand,
                      fontFamily: fonts.medium,
                      fontSize: 13,
                    }}
                  >
                    Edit
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            // edit mode
            <View style={{ gap: 12 }}>
              <Text
                style={{
                  color: theme.textPrimary,
                  fontFamily: fonts.semibold,
                  fontSize: 15,
                  marginBottom: 4,
                }}
              >
                Edit Profile
              </Text>
              <View>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontFamily: fonts.medium,
                    fontSize: 12,
                    marginBottom: 6,
                  }}
                >
                  FULL NAME
                </Text>
                <TextInput
                  style={{
                    backgroundColor: theme.inputBg,
                    borderWidth: 1,
                    borderColor: theme.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    color: theme.textPrimary,
                    fontFamily: fonts.regular,
                    fontSize: 15,
                  }}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your full name"
                  placeholderTextColor={theme.textDisabled}
                />
              </View>
              <View>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontFamily: fonts.medium,
                    fontSize: 12,
                    marginBottom: 6,
                  }}
                >
                  EMAIL (optional)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: theme.inputBg,
                    borderWidth: 1,
                    borderColor: theme.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    color: theme.textPrimary,
                    fontFamily: fonts.regular,
                    fontSize: 15,
                  }}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={theme.textDisabled}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => setIsEditing(false)}
                  style={{
                    flex: 1,
                    backgroundColor: theme.elevated,
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontFamily: fonts.semibold,
                      fontSize: 14,
                    }}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    backgroundColor: theme.brand,
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: fonts.semibold,
                        fontSize: 14,
                      }}
                    >
                      Save
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Driver section — renders based on status */}
        {renderDriverSection()}

        {/* Appearance */}
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 13,
            marginBottom: 10,
            fontFamily: fonts.medium,
          }}
        >
          APPEARANCE
        </Text>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.elevated,
            borderRadius: 14,
            padding: 4,
            marginBottom: 28,
          }}
        >
          {themeOptions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setMode(opt.value)}
              style={{
                flex: 1,
                paddingVertical: 11,
                borderRadius: 11,
                alignItems: "center",
                backgroundColor:
                  mode === opt.value ? theme.brand : "transparent",
              }}
            >
              <Text
                style={{
                  color:
                    mode === opt.value
                      ? theme.textInverse
                      : theme.textSecondary,
                  fontFamily: fonts.semibold,
                  fontSize: 13,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={handleLogout}
          style={{
            backgroundColor: theme.surface,
            borderWidth: 1.5,
            borderColor: theme.error,
            borderRadius: 14,
            paddingVertical: 15,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              color: theme.error,
              fontFamily: fonts.semibold,
              fontSize: 15,
            }}
          >
            Log Out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
