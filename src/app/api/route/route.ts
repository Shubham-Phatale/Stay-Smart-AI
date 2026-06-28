import { NextRequest, NextResponse } from "next/server";
import { getRouteInfo } from "@/lib/osrm";
import { Hostel } from "@/types";

export async function POST(req: NextRequest) {
  const { destinationLat, destinationLng, hostels } = await req.json();

  if (!destinationLat || !destinationLng || !hostels) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const results = await Promise.all(
    (hostels as Hostel[]).map((h) =>
      getRouteInfo(h.lat, h.lng, destinationLat, destinationLng, h.id)
    )
  );

  return NextResponse.json(results);
}
