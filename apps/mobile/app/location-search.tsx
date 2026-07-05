import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { useTheme } from "../hooks/useTheme";
import { fonts } from "../lib/theme";
import { useSearchStore } from "../store/searchStore";
import { useLocationPickerStore } from "../store/locationPickerStore";

const DEFAULT_REGION: Region = {
  // Pune as a fallback center — adjust if your primary market is elsewhere
  latitude: 18.5204,
  longitude: 73.8567,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function LocationSearchScreen() {
  const { theme } = useTheme();
  const { tab, field, from, mode } = useLocalSearchParams<{
    tab: "to" | "fro";
    field: "origin" | "destination";
    from?: string;
    mode?: string;
  }>();
  const { setLeg } = useSearchStore();
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number }>({
    lat: DEFAULT_REGION.latitude,
    lng: DEFAULT_REGION.longitude,
  });
  const [address, setAddress] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  const { setResult } = useLocationPickerStore();

  // On mount — try to center on current location for a better starting point
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const newRegion: Region = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          };
          setRegion(newRegion);
          setPinCoords({ lat: newRegion.latitude, lng: newRegion.longitude });
          resolveAddress(newRegion.latitude, newRegion.longitude);
        } else {
          resolveAddress(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude);
        }
      } catch {
        resolveAddress(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude);
      } finally {
        setIsLoadingLocation(false);
      }
    })();
  }, []);

  // Reverse-geocode the pin's current position
  const resolveAddress = async (lat: number, lng: number) => {
    setIsResolvingAddress(true);
    try {
      const [place] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      const formatted = place
        ? [place.name, place.street, place.city, place.region]
            .filter(Boolean)
            .join(", ")
        : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(formatted);
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsResolvingAddress(false);
    }
  };

  // Called when user drags the map — pin stays centered, we resolve on release
  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    setPinCoords({ lat: newRegion.latitude, lng: newRegion.longitude });
    resolveAddress(newRegion.latitude, newRegion.longitude);
  };

  // Text search — moves the map to the matched place, pin follows
  const handleTextSearch = async () => {
    if (searchQuery.length < 3) return;
    try {
      const geocoded = await Location.geocodeAsync(searchQuery);
      if (geocoded.length > 0) {
        const newRegion: Region = {
          latitude: geocoded[0].latitude,
          longitude: geocoded[0].longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        mapRef.current?.animateToRegion(newRegion, 500);
        setRegion(newRegion);
        setPinCoords({ lat: newRegion.latitude, lng: newRegion.longitude });
        resolveAddress(newRegion.latitude, newRegion.longitude);
      }
    } catch {
      // silently fail — user can still drag the map manually
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setIsLoadingLocation(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const newRegion: Region = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      mapRef.current?.animateToRegion(newRegion, 500);
      setRegion(newRegion);
      setPinCoords({ lat: newRegion.latitude, lng: newRegion.longitude });
      resolveAddress(newRegion.latitude, newRegion.longitude);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleConfirm = () => {
    if (!address) return;

    if (from === "create-ride" && mode) {
      // driver create ride flow — store in picker store
      setResult(mode, {
        address,
        lat: pinCoords.lat,
        lng: pinCoords.lng,
      });
      router.back();
      return;
    }

    setLeg(tab, {
      [field]: { address, lat: pinCoords.lat, lng: pinCoords.lng },
    });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Search bar overlay */}
      <View
        style={{
          position: "absolute",
          top: Platform.OS === "ios" ? 60 : 44,
          left: 16,
          right: 16,
          zIndex: 10,
          flexDirection: "row",
          gap: 8,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.surface,
            borderRadius: 14,
            paddingHorizontal: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              paddingVertical: 12,
              color: theme.textPrimary,
              fontFamily: fonts.regular,
              fontSize: 14,
            }}
            placeholder={`Search ${(mode ?? field) === "origin" ? "pickup" : "drop"} location...`}
            placeholderTextColor={theme.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleTextSearch}
            returnKeyType="search"
          />
        </View>
        <Pressable
          onPress={() => router.back()}
          style={{
            backgroundColor: theme.surface,
            borderRadius: 14,
            width: 44,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Text style={{ color: theme.textPrimary, fontSize: 16 }}>✕</Text>
        </Pressable>
      </View>

      {/* Map */}
      {isLoadingLocation ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={theme.brand} size="large" />
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={region}
          onRegionChangeComplete={handleRegionChangeComplete}
        />
      )}

      {/* Fixed center pin — map moves underneath it */}
      {!isLoadingLocation && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            marginLeft: -18,
            marginTop: -36,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor:
                field === "origin" ? theme.mapPickup : theme.mapDestination,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: "#FFFFFF",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 16 }}>📍</Text>
          </View>
          <View
            style={{
              width: 2,
              height: 14,
              backgroundColor:
                (mode ?? field) === "origin"
                  ? theme.mapPickup
                  : theme.mapDestination,
            }}
          />
        </View>
      )}

      {/* Current location button */}
      <Pressable
        onPress={handleUseCurrentLocation}
        style={{
          position: "absolute",
          bottom: 200,
          right: 16,
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: theme.surface,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Text style={{ fontSize: 18 }}>🎯</Text>
      </Pressable>

      {/* Bottom confirm panel */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 20,
          paddingBottom: 32,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 10,
        }}
      >
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 11,
            fontFamily: fonts.semibold,
            marginBottom: 6,
          }}
        >
          {(mode ?? field) === "origin" ? "PICKUP LOCATION" : "DROP LOCATION"}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
            minHeight: 40,
          }}
        >
          {isResolvingAddress ? (
            <ActivityIndicator color={theme.brand} size="small" />
          ) : (
            <Text
              style={{
                color: theme.textPrimary,
                fontSize: 16,
                fontFamily: fonts.semibold,
                flex: 1,
              }}
              numberOfLines={2}
            >
              {address ?? "Move the map to select a location"}
            </Text>
          )}
        </View>

        <Pressable
          onPress={handleConfirm}
          disabled={!address || isResolvingAddress}
          style={{
            backgroundColor:
              address && !isResolvingAddress
                ? theme.actionBg
                : theme.textDisabled,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 16 }}
          >
            Confirm Location
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
