import { View, Text, TextInput, Pressable } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { LocationPoint } from "../store/searchStore";

interface LocationInputProps {
  label: string;
  value: LocationPoint | null;
  onPress: () => void;
  iconColor: string;
}

export default function LocationInput({
  label,
  value,
  onPress,
  iconColor,
}: LocationInputProps) {
  const { theme } = useTheme();

  return (
    <Pressable onPress={onPress}>
      <Text
        style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 6 }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.inputBg,
          borderWidth: 1,
          borderColor: theme.inputBorder,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 14,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: iconColor,
            marginRight: 10,
          }}
        />
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            color: value ? theme.textPrimary : theme.textDisabled,
            fontSize: 15,
          }}
        >
          {value?.address ?? `Select ${label.toLowerCase()}`}
        </Text>
      </View>
    </Pressable>
  );
}
