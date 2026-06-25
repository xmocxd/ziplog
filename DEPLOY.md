# Deploy ziplog PWA to iPhone

This guide covers building the web app, hosting it over HTTPS, and installing it on an iPhone as a home-screen app (PWA). The same codebase also builds native iOS/Android apps via Expo; this doc is **web/PWA only**.

## Prerequisites

- Node.js 24 (see README for `nvm` setup)
- A static host with **HTTPS** (required for a reliable install on iPhone)
- An iPhone with Safari (install must be done from Safari, not Chrome or other browsers on iOS)

## 1. Build the production web app

From the project root:

```bash
npm install
npm run build:web
```

This writes a static site to `dist/`. Re-run this command before every deploy so changes are included.

Optional local preview (HTTP only — not suitable for final iPhone install testing):

```bash
npx serve dist
```

## 2. Deploy to a static host (HTTPS)

Upload or CI-deploy the **contents** of `dist/` to your host. Pick one option below.

### Netlify (recommended for simplicity)

1. Connect the repo at [netlify.com](https://www.netlify.com/)
2. Build command: `npm run build:web`
3. Publish directory: `dist`
4. Deploy — Netlify provides HTTPS automatically
5. Note your site URL (e.g. `https://ziplog.netlify.app`)

SPA routing is handled by `public/_redirects` (copied into `dist/` on build).

### Vercel

1. Import the repo at [vercel.com](https://vercel.com/)
2. Build command: `npm run build:web`
3. Output directory: `dist`
4. Deploy — Vercel provides HTTPS automatically

SPA routing is handled by `vercel.json` at the repo root.

### Other hosts

Any static host works if it serves `index.html` for unknown paths and uses HTTPS. See README for GitHub Pages and nginx examples.

## 3. Verify the deploy before iPhone install

On a desktop browser, open your HTTPS URL and confirm:

1. The app loads (trip planner + time log tabs)
2. **Chrome DevTools → Application → Manifest** shows `ziplog`, icons, and no errors  
   (Safari on Mac: **Develop → Show Web Inspector** if testing in Safari)

On iPhone Safari, open the same URL and confirm the page loads without certificate warnings.

## 4. Install on iPhone (Add to Home Screen)

iOS does not show a Chrome-style “Install app” banner for this setup. Install manually from Safari:

1. Open **Safari** on the iPhone
2. Go to your deployed HTTPS URL (e.g. `https://ziplog.netlify.app`)
3. Tap the **Share** button (square with arrow pointing up)
4. Scroll down and tap **Add to Home Screen**
5. Edit the name if desired (defaults to **ziplog**), then tap **Add**

The app icon appears on the home screen. Launching it opens ziplog in **standalone** mode (no Safari address bar), using the manifest `theme_color` and portrait orientation.

### If “Add to Home Screen” is missing

- Confirm you are in **Safari**, not Chrome/Firefox/Edge on iOS
- Confirm the site uses **HTTPS** with a valid certificate
- Try a hard refresh, or clear Safari cache for the site and reload

## 5. After install — what to expect on iPhone

| Topic | Behavior |
|-------|----------|
| Data storage | Settings, locations, and time logs persist in the browser profile via `localStorage` |
| vs native app | PWA data is **separate** from the Expo native iOS app — no automatic sync |
| Offline | Limited without a service worker; you need network for the first load after install |
| Updates | Re-deploy `dist/`, then on iPhone open the installed app — Safari may cache; force-refresh by removing and re-adding to home screen if needed |
| Orientation | Portrait (per `manifest.json`) |
| Backup | Use **App Settings** (gear icon) → **Back up now** → **Save to Files** (or iCloud Drive) |
| Restore | **App Settings** → **Restore from backup** → pick your saved JSON file |

### Backing up data on iPhone (recommended)

ziplog stores everything locally in Safari. If you clear website data or reinstall the PWA, that data is lost unless you have a backup file saved outside the browser.

1. Open the home-screen app (or Safari)
2. Tap the **gear** icon on the Time Log or Trip Planner screen
3. Tap **Back up now**
4. In the share sheet, tap **Save to Files** (choose iCloud Drive or On My iPhone)
5. Keep the `ziplog-backup-YYYY-MM-DD.json` file somewhere safe

### Restoring from a backup on iPhone

1. Open ziplog at the same HTTPS URL you use normally (same origin matters)
2. Tap the **gear** icon → **Restore from backup**
3. Select your saved JSON backup file
4. Confirm **Restore** — this replaces all locations, trip settings, and time log entries on this device

After restore, your lists and settings should match the backup. If the app looks empty, confirm you are on the **same URL** as when you created the backup (e.g. `https://ziplog.netlify.app` vs a different host).

## 6. Updating the installed PWA

Whenever you change the app:

```bash
npm run build:web
```

Redeploy `dist/` to your host (same Netlify/Vercel project — push to `main` if CI is connected).

On iPhone:

1. Open the home-screen app — it should pick up the new bundle after cache expires, or
2. Remove the home-screen icon, open the URL in Safari again, and **Add to Home Screen** once more for a clean install

## Quick reference

```bash
# Build
npm run build:web

# Deploy (example: Netlify CLI)
npx netlify deploy --prod --dir=dist

# iPhone install
# Safari → your HTTPS URL → Share → Add to Home Screen
```

For general web deploy options and PWA asset details, see [README.md](README.md).
