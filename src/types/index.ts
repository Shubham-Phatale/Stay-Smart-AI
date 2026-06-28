export interface Hostel {
  id: string;
  name: string;
  lat: number;
  lng: number;
  pricePerNight: number;
  neighborhood: string;
  rating: number;
  amenities: string[];
}

export interface TransitInfo {
  hostelId: string;
  walkingMinutes: number;
  transitMinutes: number;
  transfers: number;
  transitFare: number;
  totalMinutes: number;
  distanceKm: number;
}

export interface ScoredHostel {
  hostel: Hostel;
  transit: TransitInfo;
  totalCost: number;
  aiScore: number;
  aiReason: string;
  rank: number;
}

export interface UserPreferences {
  destination: string;
  destinationLat: number;
  destinationLng: number;
  nights: number;
  budget: number;
  priorities: string[];
  checkInTime: string;
  currencySymbol: string;
  currencyCode: string;
}

export interface RouteSegment {
  coordinates: [number, number][];
  mode: "walking" | "transit";
}
