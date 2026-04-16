# الحسن - مساعد ذكي | AlHassan AI Assistant

## Project Overview
Native Android AI personal assistant built with React Native + Expo + TypeScript.
- **Language**: Arabic (RTL first), supports English fallback
- **Platform**: Android (min SDK 28), web preview via Expo Go
- **AI Backend**: Gemini 1.5 Flash via API server proxy

## Architecture

### Decision Pipeline (Strict Order)
```
User Input → Command Parser → Intent Classifier
    ↓
1. TOOLS FIRST   → Execute native device tools
2. MEMORY SECOND → Search personal memory store
3. GEMINI THIRD  → Ask AI for general questions
4. NO HALLUCINATION → Return honest failure message
```

### Monorepo Structure
```
/artifacts/al-hassan/     ← Expo React Native app
  /app/                   ← Expo Router screens
    index.tsx             ← Entry (redirects to onboarding or chat)
    chat.tsx              ← Main chat interface
    settings.tsx          ← App settings
    memory.tsx            ← Memory & notes viewer
    tools.tsx             ← Tools status page
    onboarding.tsx        ← First-run setup
  /src/
    /core/                ← Brain (router, pipeline, gemini, intent)
    /tools/               ← 18+ native Android tools
    /memory/              ← AsyncStorage persistence layer
    /security/            ← Validator, safe mode, whitelist
    /store/               ← Zustand state management
    /providers/           ← React context providers
    /services/            ← Native API wrappers
    /ui/                  ← Components, screens, theme
    /data/                ← Seeds (apps, intents, prompts)
    /hooks/               ← Custom React hooks
    /types/               ← TypeScript types
    /constants/           ← App-wide constants

/artifacts/api-server/    ← Express API server
  /src/routes/
    gemini.ts             ← POST /api/gemini/chat (Gemini proxy)
    health.ts             ← GET /health
```

## Tools Available (18+)
- Camera, Gallery, Audio Recording, Speech Output
- Phone Calls, Contacts Search, Share Content
- Location, Google Maps
- Reminders, Notifications, Calendar Events, Notes
- Files Browser
- Web Search, Browser Launch
- App Launcher, App Aliases

## Design Tokens
- **Primary BG**: `#0B0F1A` (Deep Navy)
- **Accent**: `#D4A853` (Gold)
- **Font**: Inter (Arabic-compatible)
- **Direction**: RTL (Arabic first)

## Environment Variables Required
- `GEMINI_API_KEY` - Google Gemini API key (set in Replit Secrets for api-server)
- `PORT` - Auto-set by Replit
- `REPLIT_DEV_DOMAIN` - Auto-set by Replit
- `EXPO_PUBLIC_DOMAIN` - Auto-set via workflow config

## Key Dependencies
- expo-router (navigation)
- zustand (state management)
- @tanstack/react-query (server state)
- expo-notifications, expo-contacts, expo-location
- expo-image-picker, expo-media-library
- expo-speech, expo-calendar, expo-local-authentication
- @google/generative-ai (server-side only)
- @react-native-async-storage/async-storage

## Status
- Onboarding screen: ✅ Complete
- Chat screen: ✅ Complete
- Memory screen: ✅ Complete
- Tools screen: ✅ Complete
- Settings screen: ✅ Complete
- Core pipeline: ✅ Complete
- Gemini API proxy: ✅ Complete (needs GEMINI_API_KEY secret)
- 18+ tools: ✅ Complete
- Memory system: ✅ Complete
