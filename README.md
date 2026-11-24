# Gatherly

Your all-in-one event planner for local events in Timisoara.

## Repository layout

```
backend/   .NET API (see below)
frontend/  React + Vite + TypeScript + Material UI (see below)
```

## Frontend

Lives in `frontend/`. React 19 + Vite + TypeScript, Material UI, React Router,
TanStack Query, Leaflet/OpenStreetMap for maps.

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000 (port fixed to match backend CORS)
npm run build   # typecheck + production build
npm run lint
npm test        # Vitest + React Testing Library
```

The API URL defaults to `http://localhost:5115`; override it with `VITE_API_URL`
in `frontend/.env.local` (see `.env.example`). `VITE_SUPPORT_EMAIL` sets the
contact address in the Help dialog.

Pages: discover (search as you type, categories, Today / This weekend / This week,
date range, radius filter, sort by date / price / popularity, free only, pagination),
event details (RSVP, favorites, map, directions, add to Google Calendar / .ics,
tickets link), create/edit/delete events, My events / Attending / Favorites with
upcoming/past split, profile, sign in / sign up, help & contact.

Design: dark theme with a pink→peach accent, Michroma (headings) + Poppins (body),
tokens in `src/theme/theme.ts`. Events without an image use a category stock photo
from Unsplash (`src/lib/images.ts`); the map uses OpenStreetMap tiles inverted for night mode.

The UI is in English by default, with Romanian one click away (top bar). Strings
live in `src/i18n/messages.ts`; a test checks both languages have the same keys.

Notes on data handled in the browser (the API has no equivalent filters):
- "Free only" and price/popularity sorting fetch up to 100 matching events and
  sort/filter them client-side.
- A local event with no price is treated as free (as in the seed data);
  for imported (Ticketmaster) events an empty price means "unknown".

## Backend

Lives in `backend/`. Run all commands below from that folder.

.NET 10 Web API, EF Core (code-first) + PostgreSQL, ASP.NET Identity + JWT.

### Structure

```
backend/
  src/
    Gatherly.API             Controllers, middleware, Program.cs
    Gatherly.Application     DTOs, validators, interfaces
    Gatherly.Domain          Entities, enums (no dependencies)
    Gatherly.Infrastructure  ApplicationDbContext, Identity, EF migrations,
                             JWT token service, Ticketmaster sync, seeder
  tests/
    Gatherly.UnitTests       Validators + Ticketmaster mapping (32 tests)
    Gatherly.IntegrationTests
```

### API overview

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Users | `GET/PUT /api/users/me` |
| Events | `GET /api/events` (filters: `category`, `from`, `to`, `search`, `latitude`/`longitude`/`radiusKm`, pagination), `GET /api/events/{id}`, `POST/PUT/DELETE /api/events`, `GET /api/events/mine` |
| RSVP | `POST/DELETE /api/events/{id}/rsvp` (`Interested`/`Going`/`NotGoing`, capacity enforced), `GET /api/events/attending` |
| Favorites | `POST/DELETE /api/events/{id}/favorite`, `GET /api/events/favorites` |
| Integrations | `POST /api/integrations/ticketmaster/sync` — imports Timisoara events from Ticketmaster Discovery API |

### Local setup

```bash
# PostgreSQL (no Docker needed)
brew install postgresql@17
brew services start postgresql@17
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
createuser -s postgres
createdb -U postgres gatherly_dev

# Apply migrations (from backend/)
dotnet ef database update -p src/Gatherly.Infrastructure -s src/Gatherly.API

# Run
dotnet run --project src/Gatherly.API
```

In Development, the app auto-migrates and seeds a demo organizer
(`organizer@gatherly.dev` / `Gatherly123`) plus 12 sample Timisoara events.

### API docs

- Swagger UI: `http://localhost:5217/swagger` (dev only, Bearer auth supported)
- Scalar: `http://localhost:5217/scalar/v1`

### Config

`src/Gatherly.API/appsettings.json` holds the dev connection string and JWT settings.
Override secrets via user-secrets:

```bash
dotnet user-secrets set "Jwt:Key" "<strong-key>" --project src/Gatherly.API
dotnet user-secrets set "Ticketmaster:ApiKey" "<key>" --project src/Gatherly.API
```

Get a free Ticketmaster API key at https://developer.ticketmaster.com.

### Tests

```bash
dotnet test
```
