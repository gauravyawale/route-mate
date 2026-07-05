import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTheme } from "../hooks/useTheme";
import { fonts } from "../lib/theme";
import { api } from "../lib/api";

interface RideResult {
  id: string;
  origin_address: string;
  destination_address: string;
  scheduled_at: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: string;
}

export default function SearchResultsScreen() {
  const { theme, isDark } = useTheme();
  const params = useLocalSearchParams<{
    originLat: string;
    originLng: string;
    originAddress: string;
    destLat: string;
    destLng: string;
    destAddress: string;
    scheduledAt: string;
  }>();

  const [results, setResults] = useState<RideResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/v1/rides/search", {
          params: {
            origin_lat: params.originLat,
            origin_lng: params.originLng,
            destination_lat: params.destLat,
            destination_lng: params.destLng,
          },
        });
        setResults(res.data.data);
      } catch (err: any) {
        setError(
          err.response?.data?.error?.message ?? "Failed to search rides.",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}
      >
        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 12,
            fontFamily: fonts.medium,
          }}
          numberOfLines={1}
        >
          {params.originAddress} → {params.destAddress}
        </Text>
      </View>

      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={theme.brand} size="large" />
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              color: theme.error,
              fontFamily: fonts.medium,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 17,
              fontFamily: fonts.semibold,
              marginBottom: 6,
            }}
          >
            No rides found
          </Text>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 14,
              fontFamily: fonts.regular,
              textAlign: "center",
            }}
          >
            Try a different route or check back later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 32,
            gap: 12,
          }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/ride/${item.id}`)}
              style={{
                backgroundColor: theme.surface,
                borderRadius: 18,
                padding: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
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
                        fontSize: 14,
                        flex: 1,
                      }}
                    >
                      {item.origin_address}
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
                        fontSize: 14,
                        flex: 1,
                      }}
                    >
                      {item.destination_address}
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      color: theme.actionBg,
                      fontFamily: fonts.bold,
                      fontSize: 18,
                    }}
                  >
                    ₹{item.price_per_seat}
                  </Text>
                  <Text
                    style={{
                      color: theme.textDisabled,
                      fontSize: 11,
                      fontFamily: fonts.regular,
                    }}
                  >
                    per seat
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 14,
                  paddingTop: 14,
                  borderTopWidth: 1,
                  borderTopColor: theme.divider,
                }}
              >
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontSize: 13,
                    fontFamily: fonts.medium,
                  }}
                >
                  {new Date(item.scheduled_at).toLocaleString("en-IN", {
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
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: theme.success,
                      fontSize: 12,
                      fontFamily: fonts.semibold,
                    }}
                  >
                    {item.seats_available} seats left
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
