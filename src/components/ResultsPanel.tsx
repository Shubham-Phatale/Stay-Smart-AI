"use client";

import { ScoredHostel } from "@/types";
import HostelCard from "./HostelCard";

interface Props {
  results: ScoredHostel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  currencySymbol: string;
}

export default function ResultsPanel({ results, selectedId, onSelect, currencySymbol }: Props) {
  if (results.length === 0) return null;

  const best = results[0];

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-4 text-white">
        <div className="text-xs font-semibold uppercase tracking-wide opacity-80">Best Value Pick</div>
        <div className="text-xl font-bold mt-0.5">{best.hostel.name}</div>
        <div className="text-sm opacity-90 mt-1">
          {currencySymbol}{best.hostel.pricePerNight}/night · {best.transit.totalMinutes} min transit · {currencySymbol}{best.totalCost} total
        </div>
        <div className="text-xs opacity-75 mt-1 italic">{best.aiReason}</div>
      </div>

      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
        All Options ({results.length})
      </div>

      <div className="space-y-2">
        {results.map((sh) => (
          <HostelCard
            key={sh.hostel.id}
            hostel={sh}
            selected={sh.hostel.id === selectedId}
            onClick={() => onSelect(sh.hostel.id)}
            currencySymbol={currencySymbol}
          />
        ))}
      </div>
    </div>
  );
}
