import React, { useRef } from "react";
import {
  FlatList,
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
} from "react-native";
import type { ChatMessage } from "../../types/chat.types";
import { MessageBubble } from "./MessageBubble";
import { COLORS } from "../theme/colors";
import { SPACING } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
}

function TypingIndicator() {
  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <ActivityIndicator size="small" color={COLORS.accent} />
        <Text style={styles.typingText}>يفكر...</Text>
      </View>
    </View>
  );
}

export function MessageList({ messages, isLoading }: Props) {
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MessageBubble message={item} />}
      inverted
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      scrollEnabled={messages.length > 0}
      ListHeaderComponent={isLoading ? <TypingIndicator /> : null}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: SPACING.md,
  },
  typingContainer: {
    paddingHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    flexDirection: "row",
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.assistantBubble,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.assistantBubbleBorder,
  },
  typingText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
  },
});
