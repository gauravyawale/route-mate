import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, {
  Polyline,
  Marker,
  Region,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { useLocalSearchParams, router } from "expo-router";
import * as Location from "expo-location";
import { useTheme } from "../../hooks/useTheme";
import { fonts } from "../../lib/theme";
import { api } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";

interface RideDetail {
  id: string;
  origin_address: string;
  destination_address: string;
  scheduled_at: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: string;
  created_at: string;
  route_coordinates: Array<{ latitude: number; longitude: number }> | null;
  driver: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    rating: number;
    total_rides: number;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    color: string;
    plate_number: string;
    vehicle_type: string;
    total_seats: number;
  };
}

interface HopPin {
  lat: number;
  lng: number;
  address: string;
  fraction: number;
}

type SelectionStep = "hop_in" | "hop_off" | "done";

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const mapRef = useRef<MapView>(null);

  const [ride, setRide] = useState<RideDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectionStep, setSelectionStep] = useState<SelectionStep>("hop_in");
  const [hopIn, setHopIn] = useState<HopPin | null>(null);
  const [hopOff, setHopOff] = useState<HopPin | null>(null);
  const [isSnapping, setIsSnapping] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/v1/rides/${id}`);
        setRide(res.data.data);
        // fit map to route once loaded
        if (res.data.data.route_coordinates?.length > 1) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(res.data.data.route_coordinates, {
              edgePadding: { top: 80, right: 40, bottom: 300, left: 40 },
              animated: true,
            });
          }, 500);
        }
      } catch (err) {
        Alert.alert("Error", "Failed to load ride details.");
        router.back();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleMapPress = async (event: any) => {
    if (selectionStep === "done" || isSnapping) return;

    const { latitude, longitude } = event.nativeEvent.coordinate;

    setIsSnapping(true);
    try {
      // snap tap to nearest point on route
      const res = await api.post(`/api/v1/rides/${id}/snap-to-route`, {
        lat: latitude,
        lng: longitude,
      });

      const { snapped_lat, snapped_lng, fraction_along_route } = res.data.data;

      // validate hop-off comes after hop-in
      if (selectionStep === "hop_off" && hopIn) {
        if (fraction_along_route <= hopIn.fraction) {
          Alert.alert(
            "Invalid selection",
            "Drop point must be further along the route than your pickup point.",
          );
          setIsSnapping(false);
          return;
        }
      }

      // reverse-geocode the snapped point for display
      const [place] = await Location.reverseGeocodeAsync({
        latitude: snapped_lat,
        longitude: snapped_lng,
      });

      const address = place
        ? [place.name, place.street, place.city].filter(Boolean).join(", ")
        : `${snapped_lat.toFixed(5)}, ${snapped_lng.toFixed(5)}`;

      const pin: HopPin = {
        lat: snapped_lat,
        lng: snapped_lng,
        address,
        fraction: fraction_along_route,
      };

      if (selectionStep === "hop_in") {
        setHopIn(pin);
        setSelectionStep("hop_off");
      } else {
        setHopOff(pin);
        setSelectionStep("done");
      }
    } catch (err) {
      Alert.alert("Error", "Could not select point on route. Try again.");
    } finally {
      setIsSnapping(false);
    }
  };

  const handleRequestBooking = async () => {
    if (!hopIn || !hopOff || !ride) return;

    setIsBooking(true);
    try {
      await api.post("/api/v1/bookings", {
        ride_id: ride.id,
        seats_booked: 1,
        hop_in_address: hopIn.address,
        hop_in_lat: hopIn.lat,
        hop_in_lng: hopIn.lng,
        hop_off_address: hopOff.address,
        hop_off_lat: hopOff.lat,
        hop_off_lng: hopOff.lng,
      });

      Alert.alert(
        "Booking Requested!",
        "The driver will confirm your booking. You'll be notified.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error?.message ?? "Failed to request booking.",
      );
    } finally {
      setIsBooking(false);
    }
  };

  const handleReset = () => {
    setHopIn(null);
    setHopOff(null);
    setSelectionStep("hop_in");
  };

  if (isLoading || !ride) {
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

  const stepInstruction = {
    hop_in: "Tap your pickup point on the route",
    hop_off: "Now tap your drop point on the route",
    done: "Review your journey below",
  }[selectionStep];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Map — takes upper 55% of screen */}
      <View style={{ height: "55%" }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          onPress={handleMapPress}
          initialRegion={{
            latitude: 20.5937, // center of India — reasonable fallback
            longitude: 78.9629,
            latitudeDelta: 10,
            longitudeDelta: 10,
          }}
        >
          {/* Route polyline */}
          {ride.route_coordinates && (
            <Polyline
              coordinates={ride.route_coordinates}
              strokeColor={theme.mapRoute}
              strokeWidth={4}
            />
          )}

          {/* Driver origin marker */}
          {ride.route_coordinates && (
            <Marker
              coordinate={ride.route_coordinates[0]}
              pinColor={theme.brand}
              title="Driver starts here"
            />
          )}

          {/* Driver destination marker */}
          {ride.route_coordinates && (
            <Marker
              coordinate={
                ride.route_coordinates[ride.route_coordinates.length - 1]
              }
              pinColor={theme.brand}
              title="Driver ends here"
            />
          )}

          {/* Rider hop-in pin */}
          {hopIn && (
            <Marker
              coordinate={{ latitude: hopIn.lat, longitude: hopIn.lng }}
              pinColor={theme.mapPickup}
              title="Your pickup"
            />
          )}

          {/* Rider hop-off pin */}
          {hopOff && (
            <Marker
              coordinate={{ latitude: hopOff.lat, longitude: hopOff.lng }}
              pinColor={theme.mapDestination}
              title="Your drop"
            />
          )}
        </MapView>

        {/* Instruction overlay */}
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            right: 12,
            backgroundColor: theme.surface,
            borderRadius: 14,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          {isSnapping && <ActivityIndicator size="small" color={theme.brand} />}
          <Text
            style={{
              color: theme.textPrimary,
              fontFamily: fonts.medium,
              fontSize: 13,
              flex: 1,
            }}
          >
            {isSnapping ? "Snapping to route..." : stepInstruction}
          </Text>
          {selectionStep !== "hop_in" && (
            <Pressable onPress={handleReset}>
              <Text
                style={{
                  color: theme.brand,
                  fontFamily: fonts.semibold,
                  fontSize: 13,
                }}
              >
                Reset
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Bottom panel */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Ride info */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.mapPickup,
                    marginRight: 8,
                  }}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    color: theme.textPrimary,
                    fontFamily: fonts.medium,
                    fontSize: 13,
                    flex: 1,
                  }}
                >
                  {ride.origin_address}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.mapDestination,
                    marginRight: 8,
                  }}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    color: theme.textSecondary,
                    fontFamily: fonts.medium,
                    fontSize: 13,
                    flex: 1,
                  }}
                >
                  {ride.destination_address}
                </Text>
              </View>
            </View>
            <Text
              style={{
                color: theme.actionBg,
                fontFamily: fonts.bold,
                fontSize: 20,
                marginLeft: 12,
              }}
            >
              ₹{ride.price_per_seat}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: theme.divider,
            }}
          >
            <Text
              style={{
                color: theme.textSecondary,
                fontFamily: fonts.regular,
                fontSize: 12,
              }}
            >
              {new Date(ride.scheduled_at).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            <View
              style={{
                backgroundColor: theme.success + "20",
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: theme.success,
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                }}
              >
                {ride.seats_available} seats left
              </Text>
            </View>
          </View>
        </View>

        {/* Driver info */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.brand,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{ color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 18 }}
            >
              {ride.driver.full_name?.charAt(0)?.toUpperCase() ?? "D"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.textPrimary,
                fontFamily: fonts.semibold,
                fontSize: 15,
              }}
            >
              {ride.driver.full_name}
            </Text>
            <Text
              style={{
                color: theme.textSecondary,
                fontFamily: fonts.regular,
                fontSize: 13,
              }}
            >
              ⭐ {ride.driver.rating?.toFixed(1)} · {ride.driver.total_rides}{" "}
              rides
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                color: theme.textPrimary,
                fontFamily: fonts.medium,
                fontSize: 13,
              }}
            >
              {ride.vehicle.make} {ride.vehicle.model}
            </Text>
            <Text
              style={{
                color: theme.textSecondary,
                fontFamily: fonts.regular,
                fontSize: 12,
              }}
            >
              {ride.vehicle.plate_number}
            </Text>
          </View>
        </View>

        {/* Selected hop-in/hop-off summary */}
        {(hopIn || hopOff) && (
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 16,
              gap: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 11,
                fontFamily: fonts.semibold,
              }}
            >
              YOUR JOURNEY
            </Text>
            {hopIn && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: theme.mapPickup,
                    marginTop: 3,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: 11,
                      fontFamily: fonts.medium,
                    }}
                  >
                    PICKUP
                  </Text>
                  <Text
                    style={{
                      color: theme.textPrimary,
                      fontSize: 14,
                      fontFamily: fonts.medium,
                    }}
                  >
                    {hopIn.address}
                  </Text>
                </View>
              </View>
            )}
            {hopOff && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: theme.mapDestination,
                    marginTop: 3,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: 11,
                      fontFamily: fonts.medium,
                    }}
                  >
                    DROP
                  </Text>
                  <Text
                    style={{
                      color: theme.textPrimary,
                      fontSize: 14,
                      fontFamily: fonts.medium,
                    }}
                  >
                    {hopOff.address}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Book button */}
        <Pressable
          onPress={handleRequestBooking}
          disabled={selectionStep !== "done" || isBooking}
          style={{
            backgroundColor:
              selectionStep === "done" ? theme.actionBg : theme.textDisabled,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            shadowColor:
              selectionStep === "done" ? theme.actionBg : "transparent",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: selectionStep === "done" ? 4 : 0,
          }}
        >
          {isBooking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={{ color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 16 }}
            >
              {selectionStep === "done"
                ? "Request Booking"
                : selectionStep === "hop_in"
                  ? "Select Pickup First"
                  : "Select Drop Point"}
            </Text>
          )}
        </Pressable>

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}
