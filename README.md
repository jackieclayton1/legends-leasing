# Legends Leasing — Tuscaloosa Maps

An Apple Maps–style app for finding off-campus apartments around The University of Alabama, built with Expo (iOS, Android and web).

- **iOS** uses Apple MapKit through `react-native-maps`; **Android** uses Google Maps.
- **Web** uses MapLibre GL with OpenFreeMap's OpenStreetMap tiles, recolored to Apple's palette (`src/components/maps/apple-style.ts`), opening in a tilted 3D view with extruded buildings.
- Search, filters (beds, price, pets, furnished, shuttle, walk-to-class), apartment cards, detail pages, saved listings, walking/biking/driving directions to campus spots (OSRM via routing.openstreetmap.de), satellite view, and a live weather/AQI badge (Open-Meteo).

## Run it

```bash
pnpm install
npx expo start          # press w for web, or scan the QR code with Expo Go
npx expo start --web    # web only
```

## Where things live

| Path | What |
| --- | --- |
| `src/app/index.tsx` | Map screen: state, selection, directions |
| `src/components/maps/` | Map (native + `.web.tsx`), sheet/side panel, cards, controls |
| `src/data/apartments.ts` | Listings — **sample data**, replace with real inventory |
| `src/data/campus.ts` | Campus landmarks and commute destinations |
| `src/lib/` | Distance/time math, filtering, routing |

Listing names, prices, phone numbers (555) and reviews are placeholders; coordinates are approximate.
