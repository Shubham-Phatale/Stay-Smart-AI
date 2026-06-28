import { TransitInfo, RouteSegment } from "@/types";

const OSRM_BASE = "https://router.project-osrm.org/route/v1";

// Transit fare estimate based on distance (Mumbai local train approximation)
function estimateFare(distanceKm: number): number {
  if (distanceKm < 2) return 0; // walking only
  if (distanceKm < 10) return 10;
  if (distanceKm < 25) return 20;
  return 40;
}

function estimateTransfers(distanceKm: number): number {
  if (distanceKm < 5) return 0;
  if (distanceKm < 15) return 1;
  return 2;
}

export async function getRouteInfo(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  hostelId: string
): Promise<TransitInfo> {
  try {
    const walkUrl = `${OSRM_BASE}/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const driveUrl = `${OSRM_BASE}/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    const [walkRes, driveRes] = await Promise.all([
      fetch(walkUrl),
      fetch(driveUrl),
    ]);

    const [walkData, driveData] = await Promise.all([
      walkRes.json(),
      driveRes.json(),
    ]);

    const walkRoute = walkData.routes?.[0];
    const driveRoute = driveData.routes?.[0];

    const distanceKm = (walkRoute?.distance ?? 0) / 1000;
    const walkingMinutes = Math.round((walkRoute?.duration ?? 0) / 60);
    // Transit is roughly 2x faster than walking for urban distances
    const transitMinutes =
      distanceKm > 2 ? Math.round(walkingMinutes * 0.4 + 10) : walkingMinutes;
    const transfers = estimateTransfers(distanceKm);
    const transitFare = estimateFare(distanceKm);

    return {
      hostelId,
      walkingMinutes,
      transitMinutes,
      transfers,
      transitFare,
      totalMinutes: distanceKm > 2 ? transitMinutes : walkingMinutes,
      distanceKm: Math.round(distanceKm * 10) / 10,
    };
  } catch {
    // Fallback with estimated values
    const distanceKm =
      Math.sqrt(
        Math.pow((fromLat - toLat) * 111, 2) +
          Math.pow((fromLng - toLng) * 111, 2)
      );
    const walkingMinutes = Math.round((distanceKm / 5) * 60);
    return {
      hostelId,
      walkingMinutes,
      transitMinutes: Math.round(walkingMinutes * 0.5),
      transfers: estimateTransfers(distanceKm),
      transitFare: estimateFare(distanceKm),
      totalMinutes: Math.round(walkingMinutes * 0.5),
      distanceKm: Math.round(distanceKm * 10) / 10,
    };
  }
}

export async function getRouteGeometry(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<RouteSegment[]> {
  try {
    const url = `${OSRM_BASE}/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const coords = data.routes?.[0]?.geometry?.coordinates ?? [];
    return [{ coordinates: coords, mode: "walking" }];
  } catch {
    return [
      {
        coordinates: [
          [fromLng, fromLat],
          [toLng, toLat],
        ],
        mode: "walking",
      },
    ];
  }
}
