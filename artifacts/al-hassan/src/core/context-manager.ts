import type { ConversationContext } from "../types/memory.types";
import { getContext, updateContext, addTurn } from "../memory/conversation-memory";
import { findPersonByName } from "../memory/personal-memory";
import type { ParsedIntent } from "../types/intent.types";

export async function enrichIntentWithContext(
  sessionId: string,
  intent: ParsedIntent
): Promise<ParsedIntent> {
  const ctx = await getContext(sessionId);

  const enriched = { ...intent };
  const entities = { ...intent.entities };

  // Resolve contextual references
  if (!entities.contact && !entities.name) {
    if (ctx.lastPerson) {
      entities.contact = ctx.lastPerson;
    }
  }

  if (!entities.app && ctx.lastApp) {
    entities.app = ctx.lastApp;
  }

  if (!entities.location && ctx.lastLocation) {
    entities.location = ctx.lastLocation;
  }

  // Try to resolve contact from memory
  if (entities.contact && !entities.phone) {
    const person = await findPersonByName(entities.contact);
    if (person?.phoneNumber) {
      entities.phone = person.phoneNumber;
    }
  }

  enriched.entities = entities;
  return enriched;
}

export async function updateContextAfterTurn(
  sessionId: string,
  intent: ParsedIntent
): Promise<void> {
  const { entities } = intent;

  const updates: Partial<ConversationContext> = {
    lastAction: intent.toolIntent,
  };

  if (entities.contact || entities.name) {
    updates.lastPerson = entities.contact ?? entities.name;
  }

  if (entities.app) {
    updates.lastApp = entities.app;
  }

  if (entities.location) {
    updates.lastLocation = entities.location;
  }

  await addTurn(sessionId, entities);
  await updateContext(sessionId, updates);
}
