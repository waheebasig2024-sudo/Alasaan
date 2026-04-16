import * as Calendar from "expo-calendar";
import { Platform } from "react-native";
import { logger } from "../utils/logger";
import { requestPermission } from "./permissions.service";

export interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  location?: string;
}

export async function createEvent(event: CalendarEvent): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const granted = await requestPermission("calendar");
  if (!granted) return null;

  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCal = calendars.find((c) => c.allowsModifications);
    if (!defaultCal) return null;

    const id = await Calendar.createEventAsync(defaultCal.id, {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      notes: event.notes,
      location: event.location,
    });

    logger.info("calendar", `Created event: ${event.title}`, { id });
    return id;
  } catch (error) {
    logger.error("calendar", "Failed to create event", error);
    return null;
  }
}

export async function getUpcomingEvents(): Promise<Calendar.Event[]> {
  if (Platform.OS === "web") return [];

  const granted = await requestPermission("calendar");
  if (!granted) return [];

  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calIds = calendars.map((c) => c.id);
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return Calendar.getEventsAsync(calIds, now, nextWeek);
  } catch {
    return [];
  }
}
