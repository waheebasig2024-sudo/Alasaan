import React, { useRef, useEffect } from "react";
import {
  FlatList,
  View,
  StyleSheet,
  Animated,
  Text,
} from "react-native";
import type { ChatMessage } from "../../types/chat.types";
import { MessageBubble } from "./MessageBubble";
import { COLORS } from "../theme/colors";
import { SPACING, RADIUS } from "../theme/spacing";
import { TYPOGRAPHY } from "../theme/typography";

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
}

function Dot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: -6, duration: 300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[dotStyles.dot, { transform: [{ translateY: anim }] }]}
    />
  );
}

const dotStyles = StyleSheet.create({
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginHorizontal: 2,
  },
});

function TypingIndicator() {
  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingAvatar}>
        <Text style={styles.typingAvatarText}>ح</Text>
      </View>
      <View style={styles.typingBubble}>
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
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
    alignItems: "flex-end",
  },
  typingAvatar: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
    marginBottom: 4,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  typingAvatarText: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.primaryBg,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.assistantBubble,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.assistantBubbleBorder,
    height: 44,
  },
  typingText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
  },
});
