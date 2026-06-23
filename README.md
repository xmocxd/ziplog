# ziplog

React Native app (Expo) with trip planner and time logging. Runs on iOS, Android, and web (installable PWA).

## Run (WSL)

```bash
source ~/.nvm/nvm.sh && nvm use 24
npm start        # Expo dev server (uses saved data)
npm run android  # Android emulator/device
npm run ios      # iOS simulator/device
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

## PWA (web production build)

Build a static web app for deployment:

```bash
npm run build:web
```

Output is written to `dist/`. Preview locally:

```bash
npx serve dist
```

PWA installability requires **HTTPS** in production (localhost is fine for dev).

For iPhone setup and install steps, see [DEPLOY.md](DEPLOY.md).

### Deploy to a static host

Upload the contents of `dist/` after each build.

**Netlify**

- Build command: `npm run build:web`
- Publish directory: `dist`
- SPA fallback: `public/_redirects` is copied into `dist/` automatically

**Vercel**

- Build command: `npm run build:web`
- Output directory: `dist`
- SPA fallback: `vercel.json` at repo root

**GitHub Pages**

- Build with `npm run build:web`, deploy `dist/` to `gh-pages` branch
- Enable HTTPS in repository Settings

**Own server (nginx)**

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Verify PWA

After HTTPS deploy:

1. Chrome DevTools → Application → Manifest
2. Lighthouse → Progressive Web App audit
3. Mobile: browser menu → Add to Home Screen / Install app

