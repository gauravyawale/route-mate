import { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../hooks/useTheme";

interface DateTimeFieldProps {
  value: string | null; // ISO string
  onChange: (iso: string) => void;
}

export default function DateTimeField({ value, onChange }: DateTimeFieldProps) {
  const { theme } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<"date" | "time">("date");
  const [tempDate, setTempDate] = useState<Date>(
    value ? new Date(value) : new Date(),
  );

  const displayValue = value
    ? new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Select date & time";

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);

    if (event.type === "dismissed" || !selectedDate) return;

    if (mode === "date") {
      setTempDate(selectedDate);
      if (Platform.OS === "android") {
        setMode("time");
        setShowPicker(true);
      }
    } else {
      const finalDate = new Date(tempDate);
      finalDate.setHours(selectedDate.getHours());
      finalDate.setMinutes(selectedDate.getMinutes());
      onChange(finalDate.toISOString());
      setMode("date");
    }
  };

  return (
    <View>
      <Text
        style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 6 }}
      >
        Date & Time
      </Text>
      <Pressable
        onPress={() => {
          setMode("date");
          setShowPicker(true);
        }}
        style={{
          backgroundColor: theme.inputBg,
          borderWidth: 1,
          borderColor: theme.inputBorder,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 14,
        }}
      >
        <Text
          style={{
            color: value ? theme.textPrimary : theme.textDisabled,
            fontSize: 15,
          }}
        >
          {displayValue}
        </Text>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={tempDate}
          mode={mode}
          is24Hour={false}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
}
