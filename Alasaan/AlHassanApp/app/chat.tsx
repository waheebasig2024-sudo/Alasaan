import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ChatScreen } from "@/src/ui/screens/ChatScreen";
import { COLORS } from "@/src/ui/theme/colors";
import { SPACING } from "@/src/ui/theme/spacing";
import { TYPOGRAPHY } from "@/src/ui/theme/typography";
import { useAssistant } from "@/src/providers/AssistantProvider";

function HeaderRight() {
  const { clearChat } = useAssistant();

  const handleClearChat = () => {
    Alert.alert(
      "مسح المحادثة",
      "هل تريد مسح المحادثة الحالية؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "مسح",
          style: "destructive",
          onPress: () => clearChat(),
        },
      ]
    );
  };

  return (
    <View style={styles.headerBtns}>
      <TouchableOpacity
        onPress={handleClearChat}
        style={styles.headerBtn}
        activeOpacity={0.7}
      >
        <Feather name="trash-2" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/memory")}
        style={styles.headerBtn}
        activeOpacity={0.7}
      >
        <Feather name="database" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/tools")}
        style={styles.headerBtn}
        activeOpacity={0.7}
      >
        <Feather name="tool" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.push("/settings")}
        style={styles.headerBtn}
        activeOpacity={0.7}
      >
        <Feather name="settings" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

function HeaderTitle() {
  return (
    <View style={styles.headerTitle}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>ح</Text>
      </View>
      <View>
        <Text style={styles.name}>الحسن</Text>
        <Text style={styles.subtitle}>مساعدك الذكي</Text>
      </View>
    </View>
  );
}

export default function ChatRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <HeaderTitle />,
          headerRight: () => <HeaderRight />,
          headerStyle: { backgroundColor: COLORS.secondaryBg },
          headerShadowVisible: false,
        }}
      />
      <ChatScreen />
    </>
  );
}

const styles = StyleSheet.create({
  headerBtns: {
    flexDirection: "row",
    gap: SPACING.xs,
    paddingRight: SPACING.xs,
  },
  headerBtn: {
    padding: SPACING.xs + 2,
    borderRadius: 8,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    color: COLORS.primaryBg,
    fontWeight: "bold",
  },
  name: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.accent,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
  },
});
