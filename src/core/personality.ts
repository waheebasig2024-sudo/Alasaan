import { getProfile } from "../memory/personal-memory";
import { SYSTEM_PROMPT, getGreeting } from "../data/prompts.seed";

export async function buildSystemPrompt(): Promise<string> {
  const profile = await getProfile();
  let prompt = SYSTEM_PROMPT;

  if (profile.name) {
    prompt += `\n\nاسم المستخدم: ${profile.name}`;
  }

  if (profile.preferences && Object.keys(profile.preferences).length > 0) {
    const prefs = Object.entries(profile.preferences)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");
    prompt += `\n\nتفضيلات المستخدم:\n${prefs}`;
  }

  if (profile.importantPeople.length > 0) {
    const people = profile.importantPeople
      .map((p) => `- ${p.name}${p.relationship ? ` (${p.relationship})` : ""}`)
      .join("\n");
    prompt += `\n\nأشخاص مهمون:\n${people}`;
  }

  return prompt;
}

export async function buildWelcomeMessage(): Promise<string> {
  const profile = await getProfile();
  return getGreeting(profile.name);
}

export const ASSISTANT_PERSONA = {
  name: "الحسن",
  role: "مساعد شخصي ذكي",
  language: "ar",
  dialect: "يمني",
  creator: "وهيب عساج",
  description: "الحسن مساعد عربي ذكي للأندرويد يفهم اللهجة اليمنية، تمت برمجته وتطويره بواسطة وهيب عساج.",
};
