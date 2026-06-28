const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface MapboxFeature {
  text: string;
  place_name: string;
  place_type: string[];
}

// Reverse-geocode a coordinate into a human label like "Journal Square, Jersey City".
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    // Note: reverse geocoding rejects `limit` when multiple types are requested.
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=neighborhood,locality,place&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const features: MapboxFeature[] = data.features ?? [];
    if (features.length === 0) return null;

    const byType = (t: string) => features.find((f) => f.place_type?.includes(t));
    const area = byType("neighborhood") ?? byType("locality");
    const city = byType("place");

    if (area && city && area.text !== city.text) return `${area.text}, ${city.text}`;
    return (area ?? city ?? features[0]).place_name;
  } catch {
    return null;
  }
}
