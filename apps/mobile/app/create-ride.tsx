import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTheme } from "../hooks/useTheme";
import { fonts } from "../lib/theme";
import { api } from "../lib/api";
import { useLocationPickerStore } from "../store/locationPickerStore";
import DateTimePicker from "@react-native-community/datetimepicker";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plate_number: string;
  vehicle_type: string;
  total_seats: number;
}

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

export default function CreateRideScreen() {
  const { theme, isDark } = useTheme();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // location state
  const [origin, setOrigin] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);

  // form state
  const [seatsTotal, setSeatsTotal] = useState("3");
  const [pricePerSeat, setPricePerSeat] = useState("");

  const { result, forField, clear } = useLocationPickerStore();
  const [scheduledAt, setScheduledAt] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // when selected vehicle changes, auto-set seats for bike
  useEffect(() => {
    if (selectedVehicle?.vehicle_type === "bike") {
      setSeatsTotal("1");
    } else if (selectedVehicle?.vehicle_type === "car") {
      setSeatsTotal("3"); // default for car
    }
  }, [selectedVehicle]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (result && forField) {
        if (forField === "origin") {
          setOrigin({
            address: result.address,
            lat: result.lat,
            lng: result.lng,
          });
        } else if (forField === "destination") {
          setDestination({
            address: result.address,
            lat: result.lat,
            lng: result.lng,
          });
        }
        clear();
      }
    }, [result, forField]),
  );

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/api/v1/users/me/vehicles");
      const v = res.data.data ?? [];
      setVehicles(v);
      if (v.length > 0) setSelectedVehicle(v[0]);
    } catch {
      Alert.alert("Error", "Failed to load vehicles.");
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handlePickLocation = (type: "origin" | "destination") => {
    // reuse the existing location-search screen
    // pass a callback via router params
    router.push({
      pathname: "/location-search",
      params: { mode: type, from: "create-ride" },
    });
  };

  const handleCreate = async () => {
    if (!origin) {
      Alert.alert("Error", "Please select a pickup location.");
      return;
    }
    if (!destination) {
      Alert.alert("Error", "Please select a destination.");
      return;
    }
    if (!selectedVehicle) {
      Alert.alert("Error", "Please select a vehicle.");
      return;
    }

    if (!pricePerSeat || isNaN(parseFloat(pricePerSeat))) {
      Alert.alert("Error", "Please enter a valid price.");
      return;
    }

    const seats = parseInt(seatsTotal);
    if (isNaN(seats) || seats < 1) {
      Alert.alert("Error", "Please enter valid seat count.");
      return;
    }

    if (new Date(scheduledAt) <= new Date()) {
      Alert.alert("Error", "Scheduled time must be in the future.");
      return;
    }

    if (scheduledAt <= new Date()) {
      Alert.alert("Error", "Scheduled time must be in the future.");
      return;
    }

    setIsCreating(true);
    try {
      await api.post("/api/v1/rides", {
        vehicle_id: selectedVehicle.id,
        origin_address: origin.address,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_address: destination.address,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        scheduled_at: scheduledAt.toISOString(),
        seats_total: seats,
        price_per_seat: parseFloat(pricePerSeat),
      });

      Alert.alert(
        "Ride Created! 🎉",
        "Your ride is now live and riders can start booking.",
        [{ text: "OK", onPress: () => router.replace("/my-rides") }],
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error?.message ?? "Failed to create ride.",
      );
    } finally {
      setIsCreating(false);
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
  };

  const labelStyle = {
    color: theme.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginBottom: 6,
  };

  const cardStyle = {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.06,
    shadowRadius: 8,
    elevation: 3,
  };

  if (isLoadingVehicles) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator color={theme.brand} size="large" />
      </View>
    );
  }

  if (vehicles.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
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
            Create Ride
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🚗</Text>
          <Text
            style={{
              color: theme.textPrimary,
              fontFamily: fonts.semibold,
              fontSize: 18,
              marginBottom: 8,
            }}
          >
            No Vehicles Added
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontFamily: fonts.regular,
              fontSize: 14,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Add a vehicle from your profile before creating a ride.
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={{
              backgroundColor: theme.brand,
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 32,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: fonts.semibold,
                fontSize: 15,
              }}
            >
              Go to Profile
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
          Create Ride
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Route section */}
        <View style={cardStyle}>
          <Text style={[labelStyle, { marginBottom: 12 }]}>ROUTE</Text>

          {/* Origin */}
          <Pressable
            onPress={() => handlePickLocation("origin")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.divider,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: theme.mapPickup,
              }}
            />
            <Text
              style={{
                flex: 1,
                color: origin ? theme.textPrimary : theme.textDisabled,
                fontFamily: fonts.medium,
                fontSize: 14,
              }}
            >
              {origin?.address ?? "Select pickup location"}
            </Text>
          </Pressable>

          {/* Destination */}
          <Pressable
            onPress={() => handlePickLocation("destination")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 12,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: theme.mapDestination,
              }}
            />
            <Text
              style={{
                flex: 1,
                color: destination ? theme.textPrimary : theme.textDisabled,
                fontFamily: fonts.medium,
                fontSize: 14,
              }}
            >
              {destination?.address ?? "Select destination"}
            </Text>
          </Pressable>
        </View>

        {/* Date & Time */}
        <View style={cardStyle}>
          <Text style={[labelStyle, { marginBottom: 12 }]}>DATE & TIME</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {/* Date button */}
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={{
                flex: 1,
                backgroundColor: theme.inputBg,
                borderWidth: 1,
                borderColor: theme.inputBorder,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
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
                DATE
              </Text>
              <Text
                style={{
                  color: theme.textPrimary,
                  fontFamily: fonts.semibold,
                  fontSize: 14,
                }}
              >
                {scheduledAt.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </Pressable>

            {/* Time button */}
            <Pressable
              onPress={() => setShowTimePicker(true)}
              style={{
                flex: 1,
                backgroundColor: theme.inputBg,
                borderWidth: 1,
                borderColor: theme.inputBorder,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
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
                TIME
              </Text>
              <Text
                style={{
                  color: theme.textPrimary,
                  fontFamily: fonts.semibold,
                  fontSize: 14,
                }}
              >
                {scheduledAt.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Pressable>
          </View>

          {/* Date picker */}
          {showDatePicker && (
            <DateTimePicker
              value={scheduledAt}
              mode="date"
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  const updated = new Date(scheduledAt);
                  updated.setFullYear(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate(),
                  );
                  setScheduledAt(updated);
                }
              }}
            />
          )}

          {/* Time picker */}
          {showTimePicker && (
            <DateTimePicker
              value={scheduledAt}
              mode="time"
              is24Hour={true}
              onChange={(event, date) => {
                setShowTimePicker(false);
                if (date) {
                  const updated = new Date(scheduledAt);
                  updated.setHours(date.getHours(), date.getMinutes());
                  setScheduledAt(updated);
                }
              }}
            />
          )}
        </View>

        {/* Seats & Price */}
        <View style={cardStyle}>
          <Text style={[labelStyle, { marginBottom: 12 }]}>SEATS & PRICE</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={labelStyle}>Seats Available</Text>
              <TextInput
                style={inputStyle}
                placeholder="e.g. 3"
                placeholderTextColor={theme.textDisabled}
                value={seatsTotal}
                onChangeText={setSeatsTotal}
                keyboardType="numeric"
                editable={selectedVehicle?.vehicle_type !== "bike"}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={labelStyle}>Price per Seat (₹)</Text>
              <TextInput
                style={inputStyle}
                placeholder="e.g. 80"
                placeholderTextColor={theme.textDisabled}
                value={pricePerSeat}
                onChangeText={setPricePerSeat}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Vehicle picker */}
        <View style={cardStyle}>
          <Text style={[labelStyle, { marginBottom: 12 }]}>VEHICLE</Text>
          {vehicles.map((v) => (
            <Pressable
              key={v.id}
              onPress={() => setSelectedVehicle(v)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 10,
                marginBottom: 8,
                backgroundColor:
                  selectedVehicle?.id === v.id
                    ? theme.brand + "15"
                    : theme.elevated,
                borderWidth: 1.5,
                borderColor:
                  selectedVehicle?.id === v.id ? theme.brand : "transparent",
              }}
            >
              <Text style={{ fontSize: 20 }}>
                {v.vehicle_type === "bike" ? "🏍️" : "🚗"}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.textPrimary,
                    fontFamily: fonts.semibold,
                    fontSize: 14,
                  }}
                >
                  {v.make} {v.model} ({v.year})
                </Text>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontFamily: fonts.regular,
                    fontSize: 12,
                  }}
                >
                  {v.plate_number} · {v.total_seats} seats
                </Text>
              </View>
              {selectedVehicle?.id === v.id && (
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: theme.brand,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 12 }}>✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Create button */}
        <Pressable
          onPress={handleCreate}
          disabled={isCreating}
          style={{
            backgroundColor: theme.actionBg,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 32,
            shadowColor: theme.actionBg,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {isCreating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={{ color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 16 }}
            >
              Create Ride
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
