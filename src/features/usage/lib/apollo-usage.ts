import { env } from "@/lib/env";

export type ApolloUsageSummary = {
  status: "configured" | "missing_key" | "error";
  heading: string;
  detail: string;
  stats: Array<{ label: string; value: string }>;
};

type UsageWindow = {
  limit?: unknown;
  consumed?: unknown;
  left_over?: unknown;
};

type UsageEntry = {
  day?: UsageWindow;
  hour?: UsageWindow;
  minute?: UsageWindow;
};

function formatUsageValue(label: string, entry: UsageEntry | undefined) {
  const window = entry?.[label as keyof UsageEntry];

  if (!window || typeof window !== "object") {
    return null;
  }

  const consumed = typeof window.consumed === "number" ? window.consumed : null;
  const limit = typeof window.limit === "number" ? window.limit : null;
  const leftOver =
    typeof window.left_over === "number" ? window.left_over : null;

  if (consumed === null && limit === null && leftOver === null) {
    return null;
  }

  const segments = [
    consumed !== null ? `${consumed} used` : null,
    limit !== null ? `${limit} limit` : null,
    leftOver !== null ? `${leftOver} left` : null,
  ].filter((segment): segment is string => segment !== null);

  return segments.join(" • ");
}

function extractUsageEntry(
  payload: Record<string, unknown>,
  endpoint: string,
  action = "search",
) {
  const candidates = [
    JSON.stringify([endpoint, action]),
    `["${endpoint}", "${action}"]`,
  ];
  const matchingKey = candidates.find((candidate) => candidate in payload);
  const value = matchingKey ? payload[matchingKey] : undefined;

  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  return value as UsageEntry;
}

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
    const response = await fetch(
      "https://api.apollo.io/api/v1/usage_stats/api_usage_stats",
      {
        method: "POST",
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/json",
          "X-Api-Key": env.APOLLO_API_KEY,
        },
        body: JSON.stringify({}),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return fallbackSummary(
        "error",
        `Apollo returned ${response.status}. Usage remains non-blocking while the workspace is configured.`,
      );
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const peopleSearch = extractUsageEntry(
      payload,
      "api/v1/mixed_people",
      "api_search",
    );
    const companySearch = extractUsageEntry(
      payload,
      "api/v1/mixed_companies",
    );
    const normalizedStats = [
      { label: "People search / min", value: formatUsageValue("minute", peopleSearch) },
      { label: "People search / hour", value: formatUsageValue("hour", peopleSearch) },
      { label: "Company search / day", value: formatUsageValue("day", companySearch) },
    ].filter(
      (stat): stat is { label: string; value: string } => stat.value !== null,
    );

    return {
      status: "configured",
      heading: "Apollo usage visibility",
      detail:
        normalizedStats.length > 0
          ? "Live Apollo rate-limit telemetry is available before any search execution."
          : "Apollo responded, but the expected search rate-limit entries were not present in the usage payload.",
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
