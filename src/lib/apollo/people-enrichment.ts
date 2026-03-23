import { env } from "@/lib/env";

export type EnrichmentTarget = {
  personApolloId: string;
  fullName: string;
  title: string;
  companyName: string;
};

export type EnrichmentOutcome = {
  personApolloId: string;
  email: string | null;
  emailStatus: string | null;
  quality: "verified_business_email" | "unverified_email" | "unavailable";
  error: string | null;
};

export type EnrichmentBatchResult =
  | {
      type: "completed";
      mode: "bulk_match" | "match";
      outcomes: EnrichmentOutcome[];
    }
  | {
      type: "rate_limited";
      mode: "bulk_match" | "match";
      retryAfterMs: number;
      message: string;
    };

function normalizeOutcome(
  target: EnrichmentTarget,
  payload: Record<string, unknown> | null,
): EnrichmentOutcome {
  const email = typeof payload?.email === "string" ? payload.email : null;
  const emailStatus =
    typeof payload?.email_status === "string" ? payload.email_status : null;
  const quality =
    email && emailStatus === "verified"
      ? "verified_business_email"
      : email
        ? "unverified_email"
        : "unavailable";

  return {
    personApolloId: target.personApolloId,
    email,
    emailStatus,
    quality,
    error: payload ? null : "Apollo returned no matching person",
  };
}

function buildFixtureBatchResult(targets: EnrichmentTarget[]): EnrichmentBatchResult {
  return {
    type: "completed",
    mode: targets.length === 1 ? "match" : "bulk_match",
    outcomes: targets.map((target, index) => ({
      personApolloId: target.personApolloId,
      email:
        index % 2 === 0
          ? `${target.fullName.toLowerCase().replace(/\s+/g, ".")}@example.com`
          : null,
      emailStatus: index % 2 === 0 ? "verified" : "unavailable",
      quality: index % 2 === 0 ? "verified_business_email" : "unavailable",
      error: index % 2 === 0 ? null : "No verified business email found",
    })),
  };
}

export async function enrichPeopleBatch(
  targets: EnrichmentTarget[],
): Promise<EnrichmentBatchResult> {
  if (targets.length === 0) {
    return { type: "completed", mode: "match", outcomes: [] };
  }

  if (!env.APOLLO_API_KEY) {
    return buildFixtureBatchResult(targets);
  }

  const mode = targets.length === 1 ? "match" : "bulk_match";
  const endpoint =
    mode === "match"
      ? "https://api.apollo.io/api/v1/people/match"
      : "https://api.apollo.io/api/v1/people/bulk_match";
  const body =
    mode === "match"
      ? {
          id: targets[0]?.personApolloId,
          run_waterfall_email: false,
          run_waterfall_phone: false,
          reveal_personal_emails: false,
          reveal_phone_number: false,
        }
      : {
          details: targets.map((target) => ({ id: target.personApolloId })),
          reveal_personal_emails: false,
          reveal_phone_number: false,
          run_waterfall_email: false,
          run_waterfall_phone: false,
        };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Api-Key": env.APOLLO_API_KEY,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (response.status === 429) {
    return {
      type: "rate_limited",
      mode,
      retryAfterMs: 1000,
      message: "Apollo rate limited the enrichment request",
    };
  }

  if (!response.ok) {
    throw new Error(`Apollo enrichment failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  if (mode === "match") {
    const person =
      typeof payload.person === "object" && payload.person !== null
        ? (payload.person as Record<string, unknown>)
        : null;

    return {
      type: "completed",
      mode,
      outcomes: [normalizeOutcome(targets[0]!, person)],
    };
  }

  const matches = Array.isArray(payload.matches)
    ? payload.matches
    : Array.isArray(payload.people)
      ? payload.people
      : [];
  const personMap = new Map<string, Record<string, unknown>>();

  for (const value of matches) {
    if (typeof value !== "object" || value === null) {
      continue;
    }
    const person = value as Record<string, unknown>;
    const id = typeof person.id === "string" ? person.id : null;
    if (id) {
      personMap.set(id, person);
    }
  }

  return {
    type: "completed",
    mode,
    outcomes: targets.map((target) =>
      normalizeOutcome(target, personMap.get(target.personApolloId) ?? null),
    ),
  };
}
