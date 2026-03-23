import { env } from "@/lib/env";

export type ApolloUsageSummary = {
  status: "configured" | "missing_key" | "error";
  heading: string;
  detail: string;
  stats: Array<{ label: string; value: string }>;
};

function fallbackSummary(
  status: ApolloUsageSummary["status"],
  detail: string,
): ApolloUsageSummary {
  return {
    status,
    heading: "Apollo usage visibility",
    detail,
    stats: [],
  };
}

export async function getApolloUsageSummary(): Promise<ApolloUsageSummary> {
  if (!env.APOLLO_API_KEY) {
    return fallbackSummary(
      "missing_key",
      "Set APOLLO_API_KEY to display live usage before company search work begins.",
    );
  }

  try {
    const response = await fetch("https://api.apollo.io/api/v1/usage_stats", {
      method: "GET",
      headers: {
        "Cache-Control": "no-store",
        "X-Api-Key": env.APOLLO_API_KEY,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return fallbackSummary(
        "error",
        `Apollo returned ${response.status}. Usage remains non-blocking while the workspace is configured.`,
      );
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const stats = [
      ["Daily", payload.daily_requests],
      ["Hourly", payload.hourly_requests],
      ["Minute", payload.minute_requests],
    ] as const;

    const normalizedStats = stats
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([label, value]) => ({
        label,
        value: String(value),
      }));

    return {
      status: "configured",
      heading: "Apollo usage visibility",
      detail:
        normalizedStats.length > 0
          ? "Live usage telemetry is available before any search execution."
          : "Apollo responded, but the payload did not include the expected usage counters.",
      stats: normalizedStats,
    };
  } catch (error) {
    return fallbackSummary(
      "error",
      error instanceof Error
        ? error.message
        : "Unable to reach Apollo for usage telemetry.",
    );
  }
}
