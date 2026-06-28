# StaySmart AI

**Find the hostel that's actually the cheapest — once you count the commute.**

The lowest nightly rate is rarely the best deal. A ₹500 hostel that's an hour and two transfers away from where you actually need to be can easily cost you more (in fares, and in your time) than a ₹900 place around the corner. StaySmart AI looks past the sticker price and ranks hostels by their **true total cost** — nightly rate plus real transit to your destination — and explains *why* each one ranks where it does.

Drop a pin on the map where you want to be, and the app finds nearby hostels, works out the real route and fare to your pin, and ranks them with an AI that weighs cost, transit time, transfers, amenities and your own priorities.

![StaySmart AI](docs/screenshot.png)

## Features

- 📍 **Pin-based search** — click anywhere on the map to set your destination; it reverse-geocodes to a real area + city name.
- 🧮 **True total cost ranking** — `nightly × nights + transit fare`, not just the headline price.
- 🤖 **AI scoring with reasons** — every hostel gets a 0–100 score and a one-line explanation tailored to your priorities.
- 🗺️ **Real routing** — walking/transit routes and distances via OSRM, drawn from your live location to the hostel.
- 💱 **Location-aware currency** — prices follow the city you're searching (₹ for Mumbai, $ for New York, and so on).
- 🎚️ **Your priorities** — tune for low cost, fast transit, fewer transfers, ratings, nightlife, quiet, or amenities.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router) + React 19
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) for the map, markers and routes
- [Google Gemini](https://ai.google.dev/) for hostel generation and value scoring
- [OSRM](https://project-osrm.org/) for routing and distances
- TypeScript

## Getting started

### Prerequisites

- **Node.js 20+** and npm
- A **Google Gemini API key** — free from [Google AI Studio](https://aistudio.google.com/app/apikey)
- A **Mapbox access token** — free from [Mapbox](https://account.mapbox.com/access-tokens/)

### Installation

1. **Clone the repo**

   ```bash
   git clone https://github.com/Shubham-Phatale/Stay-Smart-AI.git
   cd Stay-Smart-AI
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Add your API keys**

   Copy the example env file and fill in your own keys:

   ```bash
   cp .env.example .env.local
   ```

   Then open `.env.local` and set:

   ```bash
   GEMINI_API_KEY=your_gemini_key_here
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
   ```

   > `.env.local` is gitignored — your keys never get committed.

4. **Run the dev server**

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000), allow location access, click a spot on the map, and hit **Find Best Hostels**.

## How it works

Each search runs a three-step pipeline:

1. **Find** — Gemini generates realistic hostels near your pin, using local neighborhood names and prices.
2. **Route** — OSRM computes the real distance, time and an estimated fare from each hostel to your destination.
3. **Score** — Gemini ranks every hostel 0–100 on true total cost, transit, amenities and your priorities, with a short reason for each.

The results land in a ranked list and as numbered markers on the map; pick one to draw the route to it.

## Notes & limitations

This is a personal project / proof of concept, so a couple of honest caveats:

- **Hostels are AI-generated**, not pulled from a live booking provider — they're realistic but not bookable. Swapping in a real inventory API (Hostelworld / Booking.com) is the natural next step to make this production-ready.
- **Transit fares are estimated** from distance rather than from a live transit API.
- The free Gemini tier is rate-limited, so a search can occasionally fail under heavy demand — just retry.

## Roadmap

- [ ] Real hostel inventory + "Book now" handoff
- [ ] Live transit fares and schedules
- [ ] Save / shortlist and compare hostels
- [ ] "Open in Google Maps" for turn-by-turn directions
