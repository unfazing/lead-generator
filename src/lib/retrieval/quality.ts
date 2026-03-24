export const retrievalOutcomeQualities = [
  "verified_business_email",
  "unverified_email",
  "email_unavailable",
  "no_match",
  "provider_error",
] as const;

export type RetrievalOutcomeQuality = (typeof retrievalOutcomeQualities)[number];

export function normalizeApolloOutcome(input: {
  email: string | null;
  emailStatus: string | null;
  error: string | null;
  hasPerson: boolean;
}): RetrievalOutcomeQuality {
  if (input.error) {
    return "provider_error";
  }

  if (!input.hasPerson) {
    return "no_match";
  }

  if (input.email && input.emailStatus === "verified") {
    return "verified_business_email";
  }

  if (input.email) {
    return "unverified_email";
  }

  return "email_unavailable";
}

export function isVerifiedBusinessEmailQuality(
  quality: RetrievalOutcomeQuality | null,
) {
  return quality === "verified_business_email";
}

export function getQualityLabel(quality: RetrievalOutcomeQuality | null) {
  switch (quality) {
    case "verified_business_email":
      return "Verified business email";
    case "unverified_email":
      return "Unverified email";
    case "email_unavailable":
      return "Email unavailable";
    case "no_match":
      return "No Apollo match";
    case "provider_error":
      return "Provider error";
    default:
      return "Pending";
  }
}
