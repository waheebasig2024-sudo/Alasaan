import type { UserProfile, PersonEntry } from "../types/memory.types";
import { generateId } from "../utils/text";
import { now } from "../utils/time";
import { loadUserProfile, saveUserProfile } from "./schemas";

const DEFAULT_PROFILE: UserProfile = {
  id: generateId(),
  name: "",
  preferredLanguage: "ar",
  preferredApps: [],
  importantPeople: [],
  preferences: {},
  createdAt: now(),
  updatedAt: now(),
};

let _profile: UserProfile | null = null;

export async function getProfile(): Promise<UserProfile> {
  if (_profile) return _profile;
  const stored = await loadUserProfile();
  _profile = stored ?? DEFAULT_PROFILE;
  return _profile;
}

export async function updateProfile(updates: Partial<UserProfile>): Promise<void> {
  const profile = await getProfile();
  _profile = { ...profile, ...updates, updatedAt: now() };
  await saveUserProfile(_profile);
}

export async function setUserName(name: string): Promise<void> {
  await updateProfile({ name });
}

export async function addImportantPerson(person: PersonEntry): Promise<void> {
  const profile = await getProfile();
  const existing = profile.importantPeople.findIndex(
    (p) => p.name === person.name
  );
  if (existing >= 0) {
    profile.importantPeople[existing] = person;
  } else {
    profile.importantPeople.push(person);
  }
  await updateProfile({ importantPeople: profile.importantPeople });
}

export async function findPersonByName(name: string): Promise<PersonEntry | null> {
  const profile = await getProfile();
  const normalized = name.trim().toLowerCase();
  return (
    profile.importantPeople.find(
      (p) =>
        p.name.toLowerCase() === normalized ||
        p.aliases.some((a) => a.toLowerCase() === normalized)
    ) ?? null
  );
}

export async function setPreference(key: string, value: string): Promise<void> {
  const profile = await getProfile();
  const preferences = { ...profile.preferences, [key]: value };
  await updateProfile({ preferences });
}
