import { describe, expect, it } from "vitest";
import { getQualityLabel, normalizeApolloOutcome } from "@/lib/retrieval/quality";

describe("retrieval quality", () => {
  it("maps verified Apollo business-email outcomes to verified_business_email", () => {
    expect(
      normalizeApolloOutcome({
        email: "avery@acme.com",
        emailStatus: "verified",
        error: null,
        hasPerson: true,
      }),
    ).toBe("verified_business_email");
  });

  it("maps non-verified, unavailable, no-match, and provider-error outcomes into stable internal categories", () => {
    expect(
      normalizeApolloOutcome({
        email: "avery@acme.com",
        emailStatus: "guessed",
        error: null,
        hasPerson: true,
      }),
    ).toBe("unverified_email");
    expect(
      normalizeApolloOutcome({
        email: null,
        emailStatus: "unavailable",
        error: null,
        hasPerson: true,
      }),
    ).toBe("email_unavailable");
    expect(
      normalizeApolloOutcome({
        email: null,
        emailStatus: null,
        error: null,
        hasPerson: false,
      }),
    ).toBe("no_match");
    expect(
      normalizeApolloOutcome({
        email: null,
        emailStatus: null,
        error: "Apollo request failed",
        hasPerson: true,
      }),
    ).toBe("provider_error");
  });

  it("provides operator-facing labels from internal categories without exposing raw Apollo field names", () => {
    expect(getQualityLabel("verified_business_email")).toBe("Verified business email");
    expect(getQualityLabel("provider_error")).toBe("Provider error");
  });
});
