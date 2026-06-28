import { Hostel } from "@/types";

// Offsets in degrees from destination — spreads hostels in a ~2-8km radius
const HOSTEL_TEMPLATES: Omit<Hostel, "id" | "lat" | "lng">[] = [
  {
    name: "Downtown Backpackers",
    pricePerNight: 0,
    neighborhood: "Downtown",
    rating: 4.3,
    amenities: ["wifi", "locker", "common-room", "breakfast"],
  },
  {
    name: "Riverside Social Hostel",
    pricePerNight: 0,
    neighborhood: "Riverside",
    rating: 4.6,
    amenities: ["wifi", "ac", "rooftop", "café"],
  },
  {
    name: "Central Heritage Stay",
    pricePerNight: 0,
    neighborhood: "City Centre",
    rating: 4.1,
    amenities: ["wifi", "locker", "kitchen"],
  },
  {
    name: "East Side Budget Inn",
    pricePerNight: 0,
    neighborhood: "East Side",
    rating: 3.8,
    amenities: ["wifi", "locker"],
  },
  {
    name: "Uptown Loft Hostel",
    pricePerNight: 0,
    neighborhood: "Uptown",
    rating: 4.7,
    amenities: ["wifi", "ac", "gym", "café", "rooftop"],
  },
  {
    name: "Midtown Travellers Hub",
    pricePerNight: 0,
    neighborhood: "Midtown",
    rating: 4.0,
    amenities: ["wifi", "kitchen", "locker"],
  },
];

// Scatter offsets around the destination (in degrees, ~1–8km)
const OFFSETS: [number, number][] = [
  [-0.018, -0.012],
  [0.032, 0.015],
  [0.008, -0.025],
  [0.055, 0.04],
  [-0.005, 0.038],
  [0.022, -0.048],
];

export function generateHostels(
  destLat: number,
  destLng: number,
  pricePerNight: number // base price in local currency
): Hostel[] {
  return HOSTEL_TEMPLATES.map((t, i) => ({
    ...t,
    id: `h${i + 1}`,
    lat: destLat + OFFSETS[i][0],
    lng: destLng + OFFSETS[i][1],
    // Vary price ±40% around the base
    pricePerNight: Math.round(pricePerNight * (0.7 + i * 0.12)),
  }));
}
