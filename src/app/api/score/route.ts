import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Hostel, TransitInfo, UserPreferences } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { hostels, transitData, preferences }: {
    hostels: Hostel[];
    transitData: TransitInfo[];
    preferences: UserPreferences;
  } = await req.json();

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const sym = preferences.currencySymbol ?? "$";

  const hostelSummaries = hostels.map((h) => {
    const t = transitData.find((td) => td.hostelId === h.id);
    const totalCost = h.pricePerNight * preferences.nights + (t?.transitFare ?? 0) * 2;
    return `- [${h.id}] ${h.name} (${h.neighborhood}): ${sym}${h.pricePerNight}/night, ${t?.distanceKm ?? "?"}km away, ${t?.totalMinutes ?? "?"} min transit, ${t?.transfers ?? "?"} transfers, ${sym}${t?.transitFare ?? 0} fare, amenities: ${h.amenities.join(", ")}, rating: ${h.rating}/5, total ${preferences.nights}-night real cost: ${sym}${totalCost}`;
  }).join("\n");

  const prompt = `You are StaySmart AI — a hostel advisor that scores hostels on TRUE total value, not just nightly rate.

User profile:
- Destination: ${preferences.destination}
- Nights: ${preferences.nights}
- Total budget: ${sym}${preferences.budget}
- Check-in: ${preferences.checkInTime}
- Priorities: ${preferences.priorities.join(", ")}

Hostels (real total cost = nightly × nights + transit fare × 2):
${hostelSummaries}

Score each hostel 0–100 considering:
1. True total cost vs budget (not just nightly rate)
2. Transit time and transfers to destination
3. Match to user priorities
4. Value for money (amenities + rating vs price)
5. Neighborhood fit for their destination

A cheap hostel far away may score lower than a pricier one nearby with fewer transfers. Penalize hostels over budget. Reward hostels that nail the user's priorities.

Return ONLY valid JSON array, no markdown:
[{"hostelId":"h1","score":85,"reason":"one sharp sentence on WHY this hostel wins or loses for this user"},...]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const scores = JSON.parse(cleaned);
    return NextResponse.json(scores);
  } catch {
    const fallback = hostels.map((h) => {
      const t = transitData.find((td) => td.hostelId === h.id);
      const totalCost = h.pricePerNight * preferences.nights + (t?.transitFare ?? 0) * 2;
      const budgetScore = Math.max(0, 100 - ((totalCost / preferences.budget) * 60));
      const transitScore = Math.max(0, 100 - (t?.totalMinutes ?? 60) * 1.5);
      const ratingScore = h.rating * 15;
      return {
        hostelId: h.id,
        score: Math.min(100, Math.round((budgetScore + transitScore + ratingScore) / 3)),
        reason: "Scored by total cost vs budget, transit time, and rating.",
      };
    });
    return NextResponse.json(fallback);
  }
}
