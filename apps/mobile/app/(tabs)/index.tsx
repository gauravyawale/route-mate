import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { useSearchStore } from "../../store/searchStore";
import LocationInput from "../../components/LocationInput";
import DateTimeField from "../../components/DateTimeField";

export default function HomeScreen() {
  const { theme } = useTheme();
  const { to, fro, activeTab, setActiveTab, setLeg } = useSearchStore();

  const currentLeg = activeTab === "to" ? to : fro;

  const handleSearch = () => {
    if (!currentLeg.origin || !currentLeg.destination) {
      return; // button is disabled in this case, but guard anyway
    }

    router.push({
      pathname: "/search-results",
      params: {
        tab: activeTab,
        originLat: currentLeg.origin.lat.toString(),
        originLng: currentLeg.origin.lng.toString(),
        destLat: currentLeg.destination.lat.toString(),
        destLng: currentLeg.destination.lng.toString(),
        scheduledAt: currentLeg.scheduledAt ?? "",
      },
    });
  };

  const canSearch = !!currentLeg.origin && !!currentLeg.destination;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 20 }}>
        <Text
          style={{
            color: theme.textPrimary,
            fontSize: 24,
            fontWeight: "700",
            marginBottom: 20,
          }}
        >
          Where are you headed?
        </Text>

        {/* To / Fro toggle */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.elevated,
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
          }}
        >
          {(["to", "fro"] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor:
                  activeTab === tab ? theme.brand : "transparent",
              }}
            >
              <Text
                style={{
                  color:
                    activeTab === tab ? theme.textInverse : theme.textSecondary,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                {tab === "to" ? "To" : "Fro (Return)"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Form */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            gap: 16,
          }}
        >
          <LocationInput
            label="Pickup"
            value={currentLeg.origin}
            iconColor={theme.mapPickup}
            onPress={() =>
              router.push({
                pathname: "/location-search",
                params: { tab: activeTab, field: "origin" },
              })
            }
          />
          <LocationInput
            label="Drop"
            value={currentLeg.destination}
            iconColor={theme.mapDestination}
            onPress={() =>
              router.push({
                pathname: "/location-search",
                params: { tab: activeTab, field: "destination" },
              })
            }
          />
          <DateTimeField
            value={currentLeg.scheduledAt}
            onChange={(iso) => setLeg(activeTab, { scheduledAt: iso })}
          />
        </View>

        <Pressable
          onPress={handleSearch}
          disabled={!canSearch}
          style={{
            backgroundColor: canSearch ? theme.actionBg : theme.textDisabled,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <Text
            style={{ color: theme.actionText, fontWeight: "700", fontSize: 16 }}
          >
            Search {activeTab === "to" ? "Rides" : "Return Rides"}
          </Text>
        </Pressable>

        {/* Quick status of other leg */}
        {activeTab === "to" && fro.origin && fro.destination && (
          <View
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: theme.elevated,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              Return trip saved: {fro.origin.address} →{" "}
              {fro.destination.address}
            </Text>
          </View>
        )}
        {activeTab === "fro" && to.origin && to.destination && (
          <View
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: theme.elevated,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              Onward trip saved: {to.origin.address} → {to.destination.address}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
