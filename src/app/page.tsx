"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import SearchPanel from "@/components/SearchPanel";
import ResultsPanel from "@/components/ResultsPanel";
import { Hostel, ScoredHostel, UserPreferences, RouteSegment, TransitInfo } from "@/types";
import { getRouteGeometry } from "@/lib/osrm";
import { detectCurrency, CurrencyConfig } from "@/lib/currency";
import { reverseGeocode } from "@/lib/geocode";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

interface Destination {
  label: string;
  lat: number;
  lng: number;
}

const DEFAULT_CURRENCY: CurrencyConfig = { code: "USD", symbol: "$", basePricePerNight: 35 };

// Great-circle distance in km between two coordinates.
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Beyond this, your live location is treated as "not in this city" and the route
// falls back to the destination pin instead.
const LIVE_ROUTE_MAX_KM = 100;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [results, setResults] = useState<ScoredHostel[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currency, setCurrency] = useState<CurrencyConfig>(DEFAULT_CURRENCY);
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setCurrency(detectCurrency(loc.lat, loc.lng));
      },
      () => {
        setUserLocation({ lat: 40.7128, lng: -74.006 });
      }
    );
  }, []);

  const handleSearch = useCallback(
    async (prefs: UserPreferences) => {
      setLoading(true);
      setError(null);
      setResults([]);
      setSelectedId(null);
      setRouteSegments([]);

      try {
        // Step 1: AI generates real hostels for this location
        setLoadingStep("Finding hostels in this area...");
        const hostelRes = await fetch("/api/hostels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: prefs.destinationLat,
            lng: prefs.destinationLng,
            currencyCode: prefs.currencyCode,
            currencySymbol: prefs.currencySymbol,
          }),
        });

        if (!hostelRes.ok) throw new Error("Hostel generation failed");
        const hostels: Hostel[] = await hostelRes.json();

        // Step 2: Get real transit data from OSRM
        setLoadingStep("Calculating transit routes...");
        const routeRes = await fetch("/api/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinationLat: prefs.destinationLat,
            destinationLng: prefs.destinationLng,
            hostels,
          }),
        });
        const transitData: TransitInfo[] = await routeRes.json();

        // Step 3: AI scores hostels on true total value
        setLoadingStep("AI scoring by real total cost...");
        const scoreRes = await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostels, transitData, preferences: prefs }),
        });
        const scores: { hostelId: string; score: number; reason: string }[] =
          await scoreRes.json();

        const scored: ScoredHostel[] = hostels
          .map((h) => {
            const t = transitData.find((td) => td.hostelId === h.id)!;
            const s = scores.find((sc) => sc.hostelId === h.id);
            return {
              hostel: h,
              transit: t,
              totalCost: h.pricePerNight * prefs.nights + (t?.transitFare ?? 0) * 2,
              aiScore: s?.score ?? 50,
              aiReason: s?.reason ?? "No AI reason available.",
              rank: 0,
            };
          })
          .sort((a, b) => b.aiScore - a.aiScore)
          .map((sh, i) => ({ ...sh, rank: i + 1 }));

        setResults(scored);
        setSelectedId(scored[0]?.hostel.id ?? null);
      } catch (e) {
        setError("Something went wrong. Check your Gemini API key and try again.");
      } finally {
        setLoading(false);
        setLoadingStep("");
      }
    },
    [currency]
  );

  const handleSetDestination = useCallback(async (dest: Destination) => {
    // Show the pin/coords immediately, then resolve a human-readable place name.
    setDestination(dest);
    // Currency follows the place you're searching, not where your device is.
    setCurrency(detectCurrency(dest.lat, dest.lng));
    const label = await reverseGeocode(dest.lat, dest.lng);
    if (!label) return;
    setDestination((prev) =>
      prev && prev.lat === dest.lat && prev.lng === dest.lng ? { ...prev, label } : prev
    );
  }, []);

  const handleSelectHostel = useCallback(
    async (id: string) => {
      setSelectedId(id);
      const sh = results.find((r) => r.hostel.id === id);
      if (!sh || !destination) return;
      // Route from your live location when you're actually in the city; otherwise
      // (e.g. searching another continent) fall back to the destination pin.
      const origin =
        userLocation && distanceKm(userLocation, sh.hostel) <= LIVE_ROUTE_MAX_KM
          ? userLocation
          : destination;
      const segments = await getRouteGeometry(
        origin.lat,
        origin.lng,
        sh.hostel.lat,
        sh.hostel.lng
      );
      setRouteSegments(segments);
    },
    [results, destination, userLocation]
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <div>
          <h1 className="font-bold text-gray-900 leading-none">StaySmart AI</h1>
          <p className="text-xs text-gray-500">Real total cost · AI-ranked hostels</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {userLocation && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
              Location detected
            </span>
          )}
          <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-1 rounded-full">
            {currency.code}
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-96 shrink-0 flex flex-col border-r border-gray-100 bg-white overflow-y-auto">
          <div className="p-4 space-y-4">
            <SearchPanel
              onSearch={handleSearch}
              loading={loading}
              destination={destination}
              currency={currency}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
                {error}
              </div>
            )}

            {loading && (
              <div className="text-center py-8 text-gray-400">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">{loadingStep}</p>
              </div>
            )}

            <ResultsPanel
              results={results}
              selectedId={selectedId}
              onSelect={handleSelectHostel}
              currencySymbol={currency.symbol}
            />
          </div>
        </aside>

        <main className="flex-1 p-3 relative">
          <MapView
            hostels={results}
            selectedId={selectedId}
            onSelectHostel={handleSelectHostel}
            destination={destination}
            onSetDestination={handleSetDestination}
            userLocation={userLocation}
            routeSegments={routeSegments}
            currencySymbol={currency.symbol}
          />
          {!destination && !loading && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="bg-white/95 backdrop-blur rounded-full px-5 py-2.5 text-sm font-medium text-gray-700 shadow-lg border border-gray-100 flex items-center gap-2">
                <span>🖱️</span> Click anywhere on the map to set your destination
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
