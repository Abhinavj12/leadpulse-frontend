# LeadPulse Frontend

Next.js App Router frontend foundation for LeadPulse.

## Stack

- Next.js
- React
- Bootstrap 5
- React-Bootstrap
- Bootstrap Icons
- Axios

## Current milestone

Implemented:

- Next.js App Router structure
- Bootstrap styling foundation
- Axios API client
- HttpOnly refresh-cookie compatible authentication
- In-memory access token
- Automatic access-token refresh on 401
- Loop-safe refresh handling for concurrent 401 responses
- Login
- Campaign Manager registration
- Forgot password
- Reset password
- Role-based protected layouts
- Manager / Executive / Client navigation shells
- Client dashboard connected to the confirmed `/portal/dashboard` endpoint
- Initial route placeholders for the remaining feature pages

The remaining feature pages are intentionally not wired to guessed endpoints. They will be implemented against the actual backend contracts.

## Run

1. Copy `.env.example` to `.env.local`.
2. Set:

```text
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

3. Install dependencies:

```bash
npm install
```

4. Start:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Authentication design

The backend returns the access token in the login response and places the refresh token in an HttpOnly cookie.

The frontend therefore:

- keeps the access token in memory only;
- sends `withCredentials: true`;
- sends `Authorization: Bearer <accessToken>`;
- restores the session by calling `/auth/refresh` followed by `/auth/me`;
- refreshes once after a 401;
- shares one refresh request when multiple requests receive 401 at the same time;
- clears the in-memory session if refresh fails.

The frontend does not put the access token or refresh token in localStorage.

## Backend expected

API base:

```text
http://localhost:4000/api/v1
```

Confirmed auth endpoints used by this milestone:

```text
POST /auth/login
POST /auth/register
POST /auth/refresh
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/me
```

## Verification performed

All plain `.js` source files were parsed successfully with Node.js `--check`.

A full Next.js production build was not run in the execution environment because the npm dependencies are not installed there and external package installation is unavailable in that environment. Run `npm install` and `npm run build` locally to perform the full framework compilation.
