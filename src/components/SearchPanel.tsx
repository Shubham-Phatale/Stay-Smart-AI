"use client";

import { useState, useEffect, useRef } from "react";
import { UserPreferences } from "@/types";
import { CurrencyConfig } from "@/lib/currency";

const PRIORITY_OPTIONS = [
  "low cost",
  "fast transit",
  "few transfers",
  "good rating",
  "near nightlife",
  "quiet area",
  "good amenities",
];

interface Destination {
  label: string;
  lat: number;
  lng: number;
}

interface Props {
  onSearch: (prefs: UserPreferences) => void;
  loading: boolean;
  destination: Destination | null;
  currency: CurrencyConfig;
}

export default function SearchPanel({ onSearch, loading, destination, currency }: Props) {
  const [nights, setNights] = useState(3);
  const [budget, setBudget] = useState(currency.basePricePerNight * 5);
  const [priorities, setPriorities] = useState<string[]>(["low cost", "fast transit"]);
  const [checkInTime, setCheckInTime] = useState("14:00");

  // Keep the budget default in sync with the detected currency, unless the user has edited it.
  const budgetEdited = useRef(false);
  useEffect(() => {
    if (!budgetEdited.current) setBudget(currency.basePricePerNight * 5);
  }, [currency]);

  function togglePriority(p: string) {
    setPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!destination) return;
    onSearch({
      destination: destination.label,
      destinationLat: destination.lat,
      destinationLng: destination.lng,
      nights,
      budget,
      priorities,
      checkInTime,
      currencySymbol: currency.symbol,
      currencyCode: currency.code,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-lg p-5 space-y-4 w-full"
    >
      <h2 className="text-lg font-bold text-gray-800">Find Best Hostel</h2>

      <div className={`rounded-xl border-2 px-3 py-2.5 flex items-center gap-2 transition-colors ${
        destination
          ? "border-green-400 bg-green-50 text-green-800"
          : "border-dashed border-gray-300 bg-gray-50 text-gray-400"
      }`}>
        <span className="text-base">{destination ? "📍" : "🖱️"}</span>
        <span className="text-xs font-medium">
          {destination
            ? destination.label !== "Custom pin"
              ? destination.label
              : `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`
            : "Click on the map to set your destination"}
        </span>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Nights
          </label>
          <input
            type="number"
            min={1}
            max={30}
            value={nights}
            onChange={(e) => setNights(Number(e.target.value))}
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Budget ({currency.symbol})
          </label>
          <input
            type="number"
            min={1}
            step="any"
            value={budget}
            onChange={(e) => {
              budgetEdited.current = true;
              setBudget(Number(e.target.value));
            }}
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Check-in Time
        </label>
        <input
          type="time"
          value={checkInTime}
          onChange={(e) => setCheckInTime(e.target.value)}
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Priorities
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePriority(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                priorities.includes(p)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !destination}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
      >
        {loading ? "Searching..." : !destination ? "Pin a destination on the map" : "Find Best Hostels"}
      </button>
    </form>
  );
}
