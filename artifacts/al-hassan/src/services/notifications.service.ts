import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { logger } from "../utils/logger";
import { requestPermission } from "./permissions.service";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function scheduleNotification(
  title: string,
  body: string,
  triggerDate: Date
): Promise<string | null> {
  try {
    const granted = await requestPermission("notifications");
    if (!granted) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });

    logger.info("notifications", `Scheduled: ${title}`, { id, triggerDate });
    return id;
  } catch (error) {
    logger.error("notifications", "Failed to schedule", error);
    return null;
  }
}

export async function scheduleReminderInMinutes(
  title: string,
  body: string,
  minutes: number
): Promise<string | null> {
  const date = new Date(Date.now() + minutes * 60 * 1000);
  return scheduleNotification(title, body, date);
}

export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return Notifications.getAllScheduledNotificationsAsync();
}
