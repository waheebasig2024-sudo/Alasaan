# System Manual — Al-Hassan V2

## 1) Server Initialization

This repository is a monorepo. The screenshot proves `aiden.py` does not exist here.
Use the real launcher for the runtime you want.

Fast path:

1. Enter the project root:
   - `cd ~/aiden_project/aiden-main`
2. Inspect the real launch targets:
   - `ls`
   - `find . -maxdepth 3 -type f | grep -E 'serve|start|server|launch|aiden|index\.js|main\.py'`
3. For the Kali Aiden runtime, the real launcher is:
   - `npm start`
4. That script runs `node dist-bundle/index.js serve`.
5. If `dist-bundle/index.js` does not exist yet, build first:
   - `npm run build:api`
6. If you need the Electron shell, use:
   - `npm run dev`
7. `server/serve.js` is only for the Expo static build in this repo, not the Kali Aiden runtime.
8. Verify the API with:
   - `curl http://127.0.0.1:4200/healthz`

If `python3 aiden.py` fails, stop using that filename.
If `node server/serve.js` says `MODULE_NOT_FOUND`, you are in the wrong project tree for that command.
If `npm start` fails because `dist-bundle/index.js` is missing, run `npm run build:api` first.
If `ss -ltnp` says permission denied, that is a shell restriction; the bigger issue is the wrong entry file or wrong folder.

## 2) Connection Protocol

The app uses both HTTP and WebSocket:

- **HTTP** for health checks and voice requests.
- **WebSocket** for live chat, status updates, activity feed, and pings.

Handshake flow:

1. The app loads `AIDEN_SERVER_URL` from storage.
2. `WebSocketProvider` connects to `${serverUrl}/ws`.
3. The provider sends periodic `ping` messages.
4. The server returns `pong` and optional `activity` events.
5. The status light turns green when connected.

If the status light stays red:

- Confirm the correct server is running.
- Confirm the host is correct.
- For the same phone, use `http://127.0.0.1:4200`.
- For another device, use `http://<LAN-IP>:4200` or Ngrok.
- Check `/healthz` first.
- If HTTP works but the light stays red, `/ws` is failing.
- Re-save the server URL in **Connection Settings**.

## 3) Voice Engine Maintenance

Voice assets live in:

- `assets/hassan_voice/`

Suggested structure:

- `responses/greeting.mp3`
- `responses/thinking.mp3`
- `responses/done.mp3`
- `responses/error.mp3`
- `responses/alert.mp3`

Rules:

- Use `mp3` or `wav` only.
- Keep files short and clean.
- Prefer a warm Arabic male voice.
- Update `src/services/hassan-tts.service.ts` if server audio format changes.
- System TTS is only an emergency fallback.

## 4) Skill Execution

The app exposes the 62 Aiden skills through the Tactical Toolbox and command screens.

Trigger flow:

- A UI action calls the assistant router, tools store, or chat session.
- The command becomes a tool request.
- The tool executor runs the matching skill.
- Results return to the dashboard, chat, or activity feed.

Useful locations:

- `src/tools/`
- `src/core/`
- `src/store/tools.store.ts`
- `src/services/websocket.service.ts`

Logs:

- App activity appears in the Command Center Dashboard feed.
- Server logs are in the Aiden terminal in Kali or Termux.
- Expo client logs are in the `artifacts/al-hassan: expo` workflow logs.

## 5) Environment Variables

Current IP / port values in this build:

- `AIDEN_DEFAULT_IP = 127.0.0.1`
- `AIDEN_DEFAULT_PORT = 4200`
- `AIDEN_DEFAULT_URL = http://127.0.0.1:4200`
- WebSocket path: `/ws`
- Health path: `/healthz`
- TTS path: `/api/tts`
- Replit app port: `PORT`
- Expo dev domain: `REPLIT_EXPO_DEV_DOMAIN`
- Preview domain: `REPLIT_DEV_DOMAIN`
- Replit ID: `REPL_ID`

Saved config key:

- `STORAGE_KEYS.AIDEN_SERVER_URL`

## First Boot Checklist

1. Open `~/aiden_project/aiden-main`.
2. Find the real launcher file.
3. Start the correct server.
4. Confirm `curl http://127.0.0.1:4200/healthz` works.
5. Open the app.
6. Go to **المزيد** → **إعدادات الاتصال**.
7. Save the correct IP or Ngrok URL.
8. Wait for the status light to turn green.
9. Test voice from the app.
