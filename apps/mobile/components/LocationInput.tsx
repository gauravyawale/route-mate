import { View, Text, Pressable } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { fonts } from "../lib/theme";
import { LocationPoint } from "../store/searchStore";

interface LocationInputProps {
  label: string;
  value: LocationPoint | null;
  onPress: () => void;
  dotColor: string;
}

export default function LocationInput({
  label,
  value,
  onPress,
  dotColor,
}: LocationInputProps) {
  const { theme } = useTheme();

  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.inputBg,
          borderWidth: 1,
          borderColor: theme.inputBorder,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: dotColor,
            marginRight: 12,
          }}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: theme.textSecondary,
              fontSize: 11,
              fontFamily: fonts.medium,
              marginBottom: 2,
            }}
          >
            {label.toUpperCase()}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              color: value ? theme.textPrimary : theme.textDisabled,
              fontSize: 15,
              fontFamily: fonts.medium,
            }}
          >
            {value?.address ?? `Select ${label.toLowerCase()}`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
