# AGENTS.md

Guidance for AI agents working in this repository.

## Project overview

Single **React 18 + Vite 7** SPA (`scandic-checklist`): hotel shift checklists (Night / Morning / Evening) backed by **Firebase Firestore** in project `realbase-e7569`. There is no monorepo, no local backend, and no Firebase emulator configuration in-repo.

## Standard commands

See `package.json` and `README.md`:

| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port **5173** per `vite.config.js`; README mentions 5175 — outdated) |
| Production build | `npm run build` |
| Preview build | `npm run preview` or `npm run serve` (port 3000) |

**Tests:** No test runner or `npm test` script. `App_test.jsx` is not wired to CI.

**Lint:** `.eslintrc.json` exists but ESLint packages are **not** in `package.json` and there is no `lint` script. Running `npx eslint src` fails until devDependencies such as `eslint`, `@vitejs/eslint-config-react`, `@babel/eslint-parser`, and `@babel/preset-react` are added.

**Deploy:** `npm run build` then `firebase deploy` (requires Firebase CLI login and project access).

## Dev login (client-side)

Staff login uses `src/users.js` (not Firebase Auth for the main gate). README credentials:

- Username: `719`
- Password: `falkoner`

After login, the app prompts for **initials** before showing the checklist.

## Cursor Cloud specific instructions

### What must run

| Service | Required? | Notes |
|---------|-------------|--------|
| Vite dev server (`npm run dev`) | **Yes** | Bind with `--host 0.0.0.0` if testing from another context on the VM. Default port **5173**. |
| Firebase Firestore (cloud) | **Yes** for full persistence | App talks to remote Firebase; no emulators configured. |
| Firebase Auth / Analytics | Optional | Some admin/audit features; main checklist login is client-side in `users.js`. |
| Open-Meteo API | Optional | Weather widget only. |

### Starting the dev server

Use a **tmux** session so the server stays up (e.g. session name `vite-dev-server`):

```bash
cd /workspace
npm run dev -- --host 0.0.0.0 --port 5173
```

Open `http://127.0.0.1:5173/` on the VM.

### Lint and tests in Cloud Agents

- **Build** is the reliable compile check: `npm run build`.
- **Lint** is not runnable out of the box without adding ESLint to `package.json`.
- **Automated tests** are not defined; validate behavior via build + manual/browser flow.

### Firebase / sync caveats

Cloud Agents may see **“Database sync error: Missing or insufficient permissions”** if Firestore rules or Firebase Auth do not allow the anonymous/unauthenticated client write path. The UI still runs; task toggles may work locally while progress does not persist to Firestore. Fixing that requires Firebase project access (rules, service account, or test user) — not something the repo alone provides.

### Hello-world verification

1. `npm install` && `npm run dev`
2. Log in with `719` / `falkoner`
3. Enter initials (e.g. `TS`)
4. Interact with a checklist task (Work / Stop flow on Night shift)

That exercises login, shift UI, and core task interaction — the app’s primary user flow.
