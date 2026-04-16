import React from "react";
import { TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { RADIUS, SIZES } from "../theme/spacing";

interface Props {
  isListening: boolean;
  onPress: () => void;
}

export function VoiceButton({ isListening, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, isListening && styles.btnActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Feather
        name="mic"
        size={SIZES.iconLg}
        color={isListening ? COLORS.primaryBg : COLORS.accent}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  btnActive: {
    backgroundColor: COLORS.accent,
  },
});
