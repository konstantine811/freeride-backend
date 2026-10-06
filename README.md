# FREERIDE backend

Install dependencies with `npm install`. Configure `.env` using `.env.example` and set
`FIREBASE_SERVICE_ACCOUNT_PATH` to the local Firebase service account JSON file.
Keep this key on the server.

Run `npm run dev` for development. For production, run `npm run build` followed by
`npm start`. Run `npm test` to check administrator access logic.

## Administrator access by email

Create Firestore database `(default)` and publish the frontend Firestore/Storage
rules before using the admin panel. Users must first register or sign in on `/login`.

To grant the initial owner role from this trusted backend directory:

```sh
npm run owner:grant -- constainabrams@gmail.com
```

The command looks up an existing Firebase Authentication user by email and writes
`owners/{uid}`. It does not create an account or expose an owner bootstrap endpoint.

The owner can then open `/admin`, select «Адміністратори», and submit an email.
`POST /api/admins` requires a Firebase ID token in the `Authorization: Bearer` header.
The server checks `owners/{callerUid}`, resolves the email using Firebase Admin,
and writes `admins/{resolvedUid}` with the canonical account email and `enabled: true`.
Ownership is checked again in the write transaction. Unknown or disabled accounts
are rejected. Revocation uses the existing owner-only Firestore rules in the panel.

Vite proxies `/api` to `http://127.0.0.1:4000` during development; run both frontend
and backend and restart Vite after changing its config. In production, configure a
reverse proxy for `/api`, or set frontend `VITE_API_BASE_URL` to the HTTPS backend
origin before building. Firebase Hosting alone does not run this Node.js backend.

The frontend emulator admin test builds this backend and starts a separate API
connected only to project `demo-freeride` and local Auth/Firestore emulators.
