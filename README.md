# Jewish Community NYC — Next.js App

A full-featured community hub for NYC's Jewish community, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Interactive Map** — Google Maps integration with custom markers, tooltips/info windows, and category filtering
- **Itinerary Planner** — drag-and-drop stop management with drive-time calculations
- **Drive Time Calculator** — select any two locations and get estimated drive time + distance
- **Synagogues Directory** — filterable by denomination with detailed info
- **Kosher Food Guide** — restaurants, groceries, bakeries, butchers with certification info
- **Resources Page** — events calendar, online resources, schools & community orgs

## Mock / Real API Toggle

All data fetching is centralized in `src/lib/api/index.ts`.  
Mock data lives in `src/lib/mock/data.ts`.

**To use mock data** (default): `NEXT_PUBLIC_USE_MOCK_DATA=true`  
**To use real APIs**: `NEXT_PUBLIC_USE_MOCK_DATA=false`

When switching to real APIs, implement the functions in `src/lib/api/index.ts` — the interface is already defined, just replace the mock branches.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create env file
cp .env.example .env.local

# 3. Edit .env.local:
#    - Set NEXT_PUBLIC_USE_MOCK_DATA=true for mock data
#    - Add your Google Maps API key when ready
#    - Add your backend API URL when ready

# 4. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_USE_MOCK_DATA` | `true` | Use mock data (true) or real APIs (false) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | — | Google Maps JavaScript API key |
| `NEXT_PUBLIC_API_BASE_URL` | — | Your backend API base URL |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page
│   ├── map/page.tsx          # Interactive community map
│   ├── synagogues/page.tsx   # Synagogue directory
│   ├── kosher/page.tsx       # Kosher food guide
│   └── resources/page.tsx    # Community resources
├── components/
│   ├── layout/               # Navbar, Footer
│   ├── map/                  # MapComponent, Filters, ItinerarySidebar
│   └── ui/                   # AmenityCard, CategoryBadge, etc.
├── lib/
│   ├── api/index.ts          # ← Centralized API layer (mock/real toggle)
│   └── mock/data.ts          # ← All mock data lives here
└── types/index.ts            # TypeScript types
```

## Google Maps Setup

1. Enable the **Maps JavaScript API** and **Distance Matrix API** in Google Cloud Console
2. Create an API key and add it to `.env.local`
3. Set `NEXT_PUBLIC_USE_MOCK_DATA=false`

The map will show a stylized placeholder until a Google Maps API key is provided.

## Connecting Your Backend

Replace the real API branches in `src/lib/api/index.ts`:

```typescript
// Example: replace mock branch with real call
export async function getAmenities(categories?: AmenityCategory[]): Promise<Amenity[]> {
  if (USE_MOCK) { /* ... existing mock ... */ }
  // Your real API:
  const query = categories ? `?categories=${categories.join(',')}` : '';
  return apiFetch<Amenity[]>(`/api/amenities${query}`);
}
```

The `apiFetch` helper uses `NEXT_PUBLIC_API_BASE_URL` as the base.
