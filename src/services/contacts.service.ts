import * as Contacts from "expo-contacts";
import { Platform } from "react-native";
import { logger } from "../utils/logger";
import { requestPermission } from "./permissions.service";
import { normalizeArabic } from "../utils/text";

export interface ContactResult {
  id: string;
  name: string;
  phoneNumber?: string;
}

export async function searchContacts(query: string): Promise<ContactResult[]> {
  if (Platform.OS === "web") return [];

  const granted = await requestPermission("contacts");
  if (!granted) return [];

  try {
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
    });

    const normalized = normalizeArabic(query.toLowerCase());
    return data
      .filter((c) => {
        const name = normalizeArabic((c.name ?? "").toLowerCase());
        return name.includes(normalized);
      })
      .map((c) => ({
        id: c.id ?? "",
        name: c.name ?? "",
        phoneNumber: c.phoneNumbers?.[0]?.number,
      }))
      .slice(0, 5);
  } catch (error) {
    logger.error("contacts", "Search failed", error);
    return [];
  }
}

export async function getContactByName(name: string): Promise<ContactResult | null> {
  const results = await searchContacts(name);
  return results[0] ?? null;
}
