# ziplog

Blank React Native app (Expo).

## Run (WSL)

```bash
source ~/.nvm/nvm.sh && nvm use 24
npm start        # Expo dev server (uses saved data)
npm run android  # Android emulator/device
npm run web      # Browser
```

### Simulate first install (dev only)

Use `:fresh` scripts to reset local storage and seed default locations on each app load:

```bash
npm run start:fresh
npm run web:fresh
npm run android:fresh
```

Or pass the flag directly:

```bash
EXPO_PUBLIC_FORCE_FIRST_RUN=1 npm run web
```

Normal `npm start` / `npm run web` keeps existing user data.
