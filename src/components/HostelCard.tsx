"use client";

import { ScoredHostel } from "@/types";

interface Props {
  hostel: ScoredHostel;
  selected: boolean;
  onClick: () => void;
  currencySymbol: string;
}

const RANK_COLORS = ["bg-yellow-400", "bg-gray-300", "bg-orange-400"];

export default function HostelCard({ hostel, selected, onClick, currencySymbol }: Props) {
  const { hostel: h, transit, totalCost, aiScore, aiReason, rank } = hostel;

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
        selected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {rank <= 3 && (
            <span className={`${RANK_COLORS[rank - 1]} text-xs font-bold px-2 py-0.5 rounded-full text-gray-800`}>
              #{rank}
            </span>
          )}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{h.name}</h3>
            <p className="text-xs text-gray-500">{h.neighborhood}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-gray-900">
            {currencySymbol}{h.pricePerNight}
            <span className="text-xs font-normal text-gray-500">/night</span>
          </div>
          <div className="text-xs text-blue-600 font-medium">Score: {aiScore}/100</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-lg py-1.5">
          <div className="text-xs font-bold text-gray-800">{transit.totalMinutes}m</div>
          <div className="text-xs text-gray-500">transit</div>
        </div>
        <div className="bg-gray-50 rounded-lg py-1.5">
          <div className="text-xs font-bold text-gray-800">{transit.transfers}</div>
          <div className="text-xs text-gray-500">transfers</div>
        </div>
        <div className="bg-gray-50 rounded-lg py-1.5">
          <div className="text-xs font-bold text-gray-800">{currencySymbol}{totalCost}</div>
          <div className="text-xs text-gray-500">total</div>
        </div>
      </div>

      {selected && (
        <p className="mt-2 text-xs text-gray-600 italic border-t border-gray-100 pt-2">
          {aiReason}
        </p>
      )}

      <div className="mt-2 flex flex-wrap gap-1">
        {h.amenities.slice(0, 4).map((a) => (
          <span key={a} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
            {a}
          </span>
        ))}
      </div>
    </div>
  );
}
