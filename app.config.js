const baseConfig = require("./app.json");

function loadGeminiKeys() {
  try {
    require("dotenv").config({ path: ".env.local" });
  } catch {}
  const keys = [
    process.env.EXPO_PUBLIC_GEMINI_KEY_1 || process.env.GEMINI_KEY_1,
    process.env.EXPO_PUBLIC_GEMINI_KEY_2 || process.env.GEMINI_KEY_2,
    process.env.EXPO_PUBLIC_GEMINI_KEY_3 || process.env.GEMINI_KEY_3,
  ].filter((k) => typeof k === "string" && k.trim().length > 0);
  return keys;
}

module.exports = ({ config }) => {
  const merged = { ...baseConfig.expo };
  const geminiKeys = loadGeminiKeys();

  merged.extra = {
    ...(merged.extra || {}),
    geminiKeys,
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    apiDomain:
      process.env.EXPO_PUBLIC_DOMAIN ||
      process.env.EXPO_PUBLIC_API_DOMAIN ||
      "",
  };

  return merged;
};
