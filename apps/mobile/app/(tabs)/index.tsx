import { View, Text, Pressable, ScrollView, StatusBar } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { useSearchStore } from "../../store/searchStore";
import { useAuthStore } from "../../store/authStore";
import { fonts } from "../../lib/theme";
import LocationInput from "../../components/LocationInput";
import DateTimeField from "../../components/DateTimeField";

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { to, fro, activeTab, setActiveTab, setLeg } = useSearchStore();
  const { user } = useAuthStore();

  const isDriverMode = user?.active_mode === "driver";
  const currentLeg = activeTab === "to" ? to : fro;
  const canSearch = !!currentLeg.origin && !!currentLeg.destination;

  const handleSearch = () => {
    if (!canSearch) return;
    router.push({
      pathname: "/search-results",
      params: {
        tab: activeTab,
        originLat: currentLeg.origin!.lat.toString(),
        originLng: currentLeg.origin!.lng.toString(),
        originAddress: currentLeg.origin!.address,
        destLat: currentLeg.destination!.lat.toString(),
        destLng: currentLeg.destination!.lng.toString(),
        destAddress: currentLeg.destination!.address,
        scheduledAt: currentLeg.scheduledAt ?? "",
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View
        style={{
          backgroundColor: isDriverMode ? theme.actionBg : theme.brand,
          paddingTop: 64,
          paddingBottom: 28,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: 13,
            fontFamily: fonts.medium,
          }}
        >
          {isDriverMode ? "Driver Mode 🚗" : "Good day 👋"}
        </Text>
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 26,
            fontFamily: fonts.bold,
            marginTop: 2,
          }}
        >
          {isDriverMode ? "Manage your rides" : "Where are you headed?"}
        </Text>
      </View>

      {isDriverMode ? (
        <DriverHome theme={theme} isDark={isDark} />
      ) : (
        <RiderHome
          theme={theme}
          isDark={isDark}
          to={to}
          fro={fro}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setLeg={setLeg}
          currentLeg={currentLeg}
          canSearch={canSearch}
          handleSearch={handleSearch}
        />
      )}
    </View>
  );
}

// ─── Driver Home ────────────────────────────────────────────────────────────

function DriverHome({ theme, isDark }: { theme: any; isDark: boolean }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 0 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Quick actions card */}
      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: 20,
          padding: 18,
          marginTop: -20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.4 : 0.1,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        <Text
          style={{
            color: theme.textSecondary,
            fontFamily: fonts.semibold,
            fontSize: 11,
            marginBottom: 14,
          }}
        >
          QUICK ACTIONS
        </Text>

        {/* Create ride */}
        <Pressable
          onPress={() => router.push("/create-ride")}
          style={{
            backgroundColor: theme.actionBg,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 12,
            shadowColor: theme.actionBg,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text
            style={{ color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 16 }}
          >
            + Create New Ride
          </Text>
        </Pressable>

        {/* My rides */}
        <Pressable
          onPress={() => router.push("/my-rides")}
          style={{
            backgroundColor: theme.elevated,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: theme.textPrimary,
              fontFamily: fonts.semibold,
              fontSize: 15,
            }}
          >
            📋 My Rides
          </Text>
        </Pressable>
      </View>

      {/* Tips card */}
      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: 16,
          padding: 16,
          marginTop: 16,
          borderLeftWidth: 3,
          borderLeftColor: theme.actionBg,
        }}
      >
        <Text
          style={{
            color: theme.textPrimary,
            fontFamily: fonts.semibold,
            fontSize: 14,
            marginBottom: 4,
          }}
        >
          💡 Driver Tips
        </Text>
        <Text
          style={{
            color: theme.textSecondary,
            fontFamily: fonts.regular,
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          Create a ride and riders along your route can book seats. Confirm or
          reject bookings from My Rides.
        </Text>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Rider Home ─────────────────────────────────────────────────────────────

function RiderHome({
  theme,
  isDark,
  to,
  fro,
  activeTab,
  setActiveTab,
  setLeg,
  currentLeg,
  canSearch,
  handleSearch,
}: any) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 0 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: 20,
          padding: 18,
          marginTop: -20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.4 : 0.1,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        {/* To / Fro toggle */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.elevated,
            borderRadius: 14,
            padding: 4,
            marginBottom: 18,
          }}
        >
          {(["to", "fro"] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingVertical: 11,
                borderRadius: 11,
                alignItems: "center",
                backgroundColor:
                  activeTab === tab ? theme.brand : "transparent",
              }}
            >
              <Text
                style={{
                  color: activeTab === tab ? "#FFFFFF" : theme.textSecondary,
                  fontFamily: fonts.semibold,
                  fontSize: 14,
                }}
              >
                {tab === "to" ? "To" : "Fro (Return)"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 12 }}>
          <LocationInput
            label="Pickup"
            value={currentLeg.origin}
            dotColor={theme.mapPickup}
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
            dotColor={theme.mapDestination}
            onPress={() =>
              router.push({
                pathname: "/location-search",
                params: { tab: activeTab, field: "destination" },
              })
            }
          />
          <DateTimeField
            value={currentLeg.scheduledAt}
            onChange={(iso: string) => setLeg(activeTab, { scheduledAt: iso })}
          />
        </View>

        <Pressable
          onPress={handleSearch}
          disabled={!canSearch}
          style={{
            backgroundColor: canSearch ? theme.actionBg : theme.textDisabled,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            marginTop: 18,
            shadowColor: canSearch ? theme.actionBg : "transparent",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: canSearch ? 4 : 0,
          }}
        >
          <Text
            style={{ color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 16 }}
          >
            Search {activeTab === "to" ? "Rides" : "Return Rides"}
          </Text>
        </Pressable>
      </View>

      {/* Saved leg banners */}
      {activeTab === "to" && fro.origin && fro.destination && (
        <SavedLegBanner
          label="Return trip saved"
          text={`${fro.origin.address} → ${fro.destination.address}`}
          theme={theme}
        />
      )}
      {activeTab === "fro" && to.origin && to.destination && (
        <SavedLegBanner
          label="Onward trip saved"
          text={`${to.origin.address} → ${to.destination.address}`}
          theme={theme}
        />
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function SavedLegBanner({
  label,
  text,
  theme,
}: {
  label: string;
  text: string;
  theme: any;
}) {
  return (
    <View
      style={{
        marginTop: 16,
        backgroundColor: theme.elevated,
        borderRadius: 14,
        padding: 14,
      }}
    >
      <Text
        style={{
          color: theme.textSecondary,
          fontSize: 11,
          fontFamily: fonts.semibold,
          marginBottom: 3,
        }}
      >
        {label.toUpperCase()}
      </Text>
      <Text
        style={{
          color: theme.textPrimary,
          fontSize: 13,
          fontFamily: fonts.medium,
        }}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}
