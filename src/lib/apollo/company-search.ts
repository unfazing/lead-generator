import { createHash } from "node:crypto";
import { env } from "@/lib/env";
import {
  companySearchPayloadSchema,
  type CompanySearchPayload,
} from "@/lib/company-search/schema";

export type CompanyPreviewRow = {
  apollo_id: string;
  name: string;
  website_url: string;
  primary_domain?: string;
  primary_location: string;
  employee_range: string;
  industry: string;
  status: string;
  founded_year?: string;
  keywords?: string;
  linkedin_url?: string;
  estimated_num_employees?: string;
  short_description?: string;
} & Record<string, string | undefined>;

export type CompanySearchWarning = {
  level: "info" | "warning";
  message: string;
};

export type CompanySearchResult = {
  signature: string;
  fetchedAt: string;
  request: CompanySearchPayload;
  rows: CompanyPreviewRow[];
  page: number;
  perPage: number;
  totalDisplayCount: number;
  hasMore: boolean;
  availableColumns: string[];
  warnings: CompanySearchWarning[];
  source: "live" | "fixture";
  usageCheck: {
    supported: boolean;
    before: null;
    after: null;
    note: string;
  };
};

type ApolloPagination = {
  total_entries?: unknown;
  page?: unknown;
  per_page?: unknown;
};

function getPagination(value: unknown): ApolloPagination {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return value as ApolloPagination;
}

export function createCompanySearchSignature(payload: CompanySearchPayload) {
  return createHash("sha256")
    .update(JSON.stringify(companySearchPayloadSchema.parse(payload)))
    .digest("hex");
}

function compactPayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      if (typeof value === "string") {
        return value.trim().length > 0;
      }

      return true;
    }),
  );
}

function createApolloCompanySearchPayload(payload: CompanySearchPayload) {
  return compactPayload({
    q_organization_name: payload.organizationName,
    organization_website: payload.organizationWebsite,
    q_organization_domains_list: payload.qOrganizationDomainsList,
    organization_locations: payload.organizationLocations,
    organization_not_locations: payload.organizationNotLocations,
    organization_num_employees_ranges: payload.organizationNumEmployeesRanges,
    organization_ids: payload.organizationIds,
    currently_using_any_of_technology_uids:
      payload.currentlyUsingAnyOfTechnologyUids,
    q_organization_keyword_tags: payload.qOrganizationKeywordTags,
    q_organization_job_titles: payload.qOrganizationJobTitles,
    organization_job_locations: payload.organizationJobLocations,
    organization_not_keyword_tags: payload.organizationNotKeywordTags,
    organization_industry_tag_ids: payload.organizationIndustryTagIds,
    "revenue_range[min]": payload.revenueRangeMin,
    "revenue_range[max]": payload.revenueRangeMax,
    "latest_funding_amount_range[min]": payload.latestFundingAmountRangeMin,
    "latest_funding_amount_range[max]": payload.latestFundingAmountRangeMax,
    "total_funding_range[min]": payload.totalFundingRangeMin,
    "total_funding_range[max]": payload.totalFundingRangeMax,
    "organization_num_jobs_range[min]": payload.organizationNumJobsRangeMin,
    "organization_num_jobs_range[max]": payload.organizationNumJobsRangeMax,
    "latest_funding_date_range[min]": payload.latestFundingDateRangeMin,
    "latest_funding_date_range[max]": payload.latestFundingDateRangeMax,
    "organization_job_posted_at_range[min]":
      payload.organizationJobPostedAtRangeMin,
    "organization_job_posted_at_range[max]":
      payload.organizationJobPostedAtRangeMax,
    page: payload.page,
    per_page: payload.perPage,
  });
}

function stringifyCompanyField(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    return value.trim() || undefined;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    const simpleValues = value.filter(
      (entry) =>
        typeof entry === "string" ||
        typeof entry === "number" ||
        typeof entry === "boolean",
    );

    if (simpleValues.length === value.length) {
      return simpleValues.map(String).join(", ") || undefined;
    }

    return JSON.stringify(value);
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function normalizeCompany(raw: Record<string, unknown>): CompanyPreviewRow {
  const locations = Array.isArray(raw.organization_locations)
    ? raw.organization_locations.filter((value) => typeof value === "string")
    : [];
  const keywords = Array.isArray(raw.organization_keywords)
    ? raw.organization_keywords.filter((value) => typeof value === "string")
    : [];

  const normalized: CompanyPreviewRow = {
    apollo_id: String(raw.id ?? raw.organization_id ?? "unknown"),
    name: String(raw.name ?? raw.organization_name ?? "Unknown company"),
    website_url: String(raw.website_url ?? raw.organization_website_url ?? ""),
    primary_domain:
      raw.primary_domain !== undefined ? String(raw.primary_domain) : undefined,
    primary_location:
      locations.length > 0 ? locations.join(", ") : String(raw.location ?? ""),
    employee_range: String(
      raw.organization_num_employees_range ??
        raw.estimated_num_employees ??
        "",
    ),
    industry: String(raw.industry ?? raw.primary_industry ?? ""),
    status: String(raw.status ?? "available"),
    founded_year:
      raw.founded_year !== undefined ? String(raw.founded_year) : undefined,
    keywords: keywords.length > 0 ? keywords.join(", ") : undefined,
    linkedin_url:
      raw.linkedin_url !== undefined ? String(raw.linkedin_url) : undefined,
    estimated_num_employees:
      raw.estimated_num_employees !== undefined
        ? String(raw.estimated_num_employees)
        : undefined,
    short_description:
      raw.short_description !== undefined
        ? String(raw.short_description)
        : undefined,
  };

  for (const [key, value] of Object.entries(raw)) {
    if (normalized[key] !== undefined) {
      continue;
    }

    const stringValue = stringifyCompanyField(value);
    if (stringValue !== undefined) {
      normalized[key] = stringValue;
    }
  }

  return normalized;
}

function buildWarnings(
  totalDisplayCount: number,
  page: number,
): CompanySearchWarning[] {
  const warnings: CompanySearchWarning[] = [];

  if (totalDisplayCount >= 1000) {
    warnings.push({
      level: "warning",
      message:
        "This search is broad enough to consume meaningful credits. Continue reviewing results, but consider narrowing filters or reusing snapshots.",
    });
  }

  if (totalDisplayCount >= 50000 || page >= 500) {
    warnings.push({
      level: "warning",
      message:
        "Apollo display results may be approaching the 50,000-record cap. You can continue, but the visible result set may be incomplete without narrower filters.",
    });
  }

  return warnings;
}

function getFixtureResult(payload: CompanySearchPayload): CompanySearchResult {
  const normalized = companySearchPayloadSchema.parse(payload);
  const rows: CompanyPreviewRow[] = [
    {
      apollo_id: "fixture-acme-001",
      name: "Acme Analytics",
      website_url: "acme-analytics.example",
      primary_location: normalized.organizationLocations[0] ?? "Singapore",
      employee_range:
        normalized.organizationNumEmployeesRanges[0] ?? "51,100",
      industry: "Software",
      status: "fixture",
      founded_year: "2018",
      keywords: normalized.qOrganizationKeywordTags.join(", ") || "analytics, saas",
      linkedin_url: "https://linkedin.com/company/acme-analytics",
      estimated_num_employees: "84",
      short_description: "Fixture result for credit-safe preview development.",
    },
    {
      apollo_id: "fixture-orbit-002",
      name: "Orbit Ledger",
      website_url: "orbit-ledger.example",
      primary_location: normalized.organizationLocations[1] ?? "Sydney",
      employee_range: "101,200",
      industry: "Fintech",
      status: "fixture",
      founded_year: "2020",
      keywords: "finance, workflow",
      linkedin_url: "https://linkedin.com/company/orbit-ledger",
      estimated_num_employees: "126",
      short_description: "Second fixture row to exercise preview pagination and columns.",
    },
  ];

  return {
    signature: createCompanySearchSignature(normalized),
    fetchedAt: new Date().toISOString(),
    request: normalized,
    rows,
    page: normalized.page,
    perPage: normalized.perPage,
    totalDisplayCount: rows.length,
    hasMore: false,
    availableColumns: Object.keys(rows[0] ?? {}),
    warnings: buildWarnings(rows.length, normalized.page),
    source: "fixture",
    usageCheck: {
      supported: false,
      before: null,
      after: null,
      note: "Fixture fallback used to avoid live credit consumption during routine verification.",
    },
  };
}

export async function searchCompanies(payload: CompanySearchPayload) {
  const normalized = companySearchPayloadSchema.parse(payload);

  if (!env.APOLLO_API_KEY) {
    return getFixtureResult(normalized);
  }

  const requestPayload = createApolloCompanySearchPayload(normalized);

  const response = await fetch("https://api.apollo.io/api/v1/mixed_companies/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": env.APOLLO_API_KEY,
    },
    body: JSON.stringify(requestPayload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Apollo company search failed with status ${response.status}`);
  }

  const payloadJson = (await response.json()) as Record<string, unknown>;
  const organizations = Array.isArray(payloadJson.organizations)
    ? payloadJson.organizations
    : [];
  const accounts = Array.isArray(payloadJson.accounts) ? payloadJson.accounts : [];
  const sourceRows = organizations.length > 0 ? organizations : accounts;
  const pagination = getPagination(payloadJson.pagination);
  const rows = sourceRows
    .filter(
      (value): value is Record<string, unknown> =>
        typeof value === "object" && value !== null,
    )
    .map(normalizeCompany);
  const totalDisplayCount = Number(pagination.total_entries ?? rows.length);
  const page = Number(pagination.page ?? normalized.page);
  const perPage = Number(pagination.per_page ?? normalized.perPage);

  return {
    signature: createCompanySearchSignature(normalized),
    fetchedAt: new Date().toISOString(),
    request: normalized,
    rows,
    page,
    perPage,
    totalDisplayCount,
    hasMore: rows.length === perPage,
    availableColumns: Object.keys(rows[0] ?? {}),
    warnings: buildWarnings(totalDisplayCount, page),
    source: "live" as const,
    usageCheck: {
      supported: true,
      before: null,
      after: null,
      note: "Live Apollo search used. Keep smoke tests narrow and compare usage stats before and after manually if needed.",
    },
  };
}
