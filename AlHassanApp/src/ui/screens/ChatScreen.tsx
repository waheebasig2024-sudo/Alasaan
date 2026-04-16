import React from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MessageList } from "../components/MessageList";
import { ChatInput } from "../components/ChatInput";
import { QuickActions } from "../components/QuickActions";
import { ConfirmActionModal } from "../components/ConfirmActionModal";
import { useChatSession } from "../../hooks/useChatSession";
import { COLORS } from "../theme/colors";

export function ChatScreen() {
  const { messages, isLoading, pendingConfirmation, sendMessage, confirmAction } =
    useChatSession();
  const insets = useSafeAreaInsets();

  const showQuickActions = messages.length <= 1;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryBg} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.flex}>
          <MessageList messages={[...messages].reverse()} isLoading={isLoading} />
          {showQuickActions && <QuickActions onAction={sendMessage} />}
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </View>
      </KeyboardAvoidingView>

      <ConfirmActionModal
        visible={!!pendingConfirmation}
        message={pendingConfirmation?.message ?? ""}
        onConfirm={() => confirmAction(true)}
        onCancel={() => confirmAction(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
  },
  flex: {
    flex: 1,
  },
});
