import { useState, useEffect } from "react";
import * as Location from "expo-location";

interface CurrentLocation {
  lat: number;
  lng: number;
  address: string | null;
}

export function useCurrentLocation() {
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setErrorMsg("Location permission denied.");
          setIsLoading(false);
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const [place] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        const address = place
          ? [place.name, place.city, place.region].filter(Boolean).join(", ")
          : null;

        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address,
        });
      } catch (err) {
        setErrorMsg("Failed to get current location.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { location, errorMsg, isLoading };
}
