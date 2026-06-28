import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { lat, lng, currencyCode, currencySymbol } = await req.json();

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `You are a travel data expert. Generate 6 realistic budget hostels near coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}).

Use your knowledge of the actual city/neighborhood at those coordinates. Use real neighborhood names, realistic local prices in ${currencyCode} (${currencySymbol}), and amenities typical for that area.

Each hostel must be within 2-8km of the given coordinates. Vary the distance, price, and quality to give the user meaningful options to compare.

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "id": "h1",
    "name": "actual hostel-style name fitting the neighborhood",
    "lat": <number within ~0.07 degrees of ${lat}>,
    "lng": <number within ~0.07 degrees of ${lng}>,
    "pricePerNight": <realistic integer in ${currencyCode}>,
    "neighborhood": "real neighborhood name",
    "rating": <4.0–4.9>,
    "amenities": ["wifi", "locker", ...up to 5 realistic amenities]
  },
  ...6 total
]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    console.log("[hostels] Gemini raw response:", text);
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const hostels = JSON.parse(cleaned);
    return NextResponse.json(hostels);
  } catch (err) {
    console.error("[hostels] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
