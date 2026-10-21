import { NextResponse } from "next/server";
import { LEETCODE_USERNAME, normalizeLeetCodeData } from "@lib/leetcode";

const QUERY = `query PortfolioStats($username: String!) {
  allQuestionsCount { difficulty count }
  matchedUser(username: $username) {
    profile { ranking }
    submitStats { acSubmissionNum { difficulty count } }
  }
  activeDailyCodingChallengeQuestion {
    date link
    question { questionFrontendId title difficulty }
  }
}`;

export async function GET() {
  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { username: LEETCODE_USERNAME } }),
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 900 },
    });
    if (!response.ok) throw new Error("LeetCode request failed");
    return NextResponse.json(normalizeLeetCodeData(await response.json()), {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" },
    });
  } catch {
    return NextResponse.json(
      { error: "LeetCode stats are temporarily unavailable. You can still visit the profile." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
