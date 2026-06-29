import { useState } from "react";
import { View, Text, TextInput, FlatList, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { useTheme } from "../../hooks/useTheme";
import { useSearchStore } from "../../store/searchStore";

export default function LocationSearchScreen() {
  const { theme } = useTheme();
  const { tab, field } = useLocalSearchParams<{
    tab: "to" | "fro";
    field: "origin" | "destination";
  }>();
  const { setLeg, to, fro } = useSearchStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ address: string; lat: number; lng: number }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 3) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const geocoded = await Location.geocodeAsync(text);
      const withAddress = await Promise.all(
        geocoded.slice(0, 5).map(async (g) => {
          const [place] = await Location.reverseGeocodeAsync({
            latitude: g.latitude,
            longitude: g.longitude,
          });
          const address = place
            ? [place.name, place.street, place.city, place.region]
                .filter(Boolean)
                .join(", ")
            : text;
          return { address, lat: g.latitude, lng: g.longitude };
        }),
      );
      setResults(withAddress);
    } catch (err) {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (item: {
    address: string;
    lat: number;
    lng: number;
  }) => {
    setLeg(tab, {
      [field]: { address: item.address, lat: item.lat, lng: item.lng },
    });
    router.back();
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.background, paddingTop: 60 }}
    >
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <Text
          style={{
            color: theme.textPrimary,
            fontSize: 20,
            fontWeight: "700",
            marginBottom: 16,
          }}
        >
          Select {field === "origin" ? "Pickup" : "Drop"} Location
        </Text>
        <TextInput
          autoFocus
          style={{
            backgroundColor: theme.inputBg,
            borderWidth: 1,
            borderColor: theme.inputFocusBorder,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            color: theme.textPrimary,
            fontSize: 15,
          }}
          placeholder="Search for a place..."
          placeholderTextColor={theme.textDisabled}
          value={query}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item, idx) => `${item.lat}-${item.lng}-${idx}`}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleSelect(item)}
            style={{
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: theme.divider,
            }}
          >
            <Text style={{ color: theme.textPrimary, fontSize: 15 }}>
              {item.address}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          !isSearching && query.length >= 3 ? (
            <Text
              style={{
                color: theme.textSecondary,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              No results found.
            </Text>
          ) : null
        }
      />
    </View>
  );
}
