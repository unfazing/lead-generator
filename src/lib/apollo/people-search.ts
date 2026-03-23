import { createHash } from "node:crypto";
import { env } from "@/lib/env";
import {
  peopleSearchPayloadSchema,
  peopleSearchRequestSchema,
  type PeopleSearchRequest,
} from "@/lib/people-search/schema";

export type PeoplePreviewRow = {
  apollo_id: string;
  full_name: string;
  title: string;
  company_name: string;
  location: string;
  seniority: string;
  department: string;
  linkedin_url?: string;
  email_status?: string;
};

export type PeopleSearchResult = {
  signature: string;
  fetchedAt: string;
  request: PeopleSearchRequest;
  rows: PeoplePreviewRow[];
  page: number;
  perPage: number;
  totalDisplayCount: number;
  hasMore: boolean;
  availableColumns: string[];
  source: "live" | "fixture";
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

export function createPeopleSearchSignature(payload: PeopleSearchRequest) {
  return createHash("sha256")
    .update(JSON.stringify(peopleSearchRequestSchema.parse(payload)))
    .digest("hex");
}

function normalizePerson(raw: Record<string, unknown>): PeoplePreviewRow {
  const organization =
    typeof raw.organization === "object" && raw.organization !== null
      ? (raw.organization as Record<string, unknown>)
      : {};
  const departments = Array.isArray(raw.departments)
    ? raw.departments.filter((value) => typeof value === "string")
    : [];

  return {
    apollo_id: String(raw.id ?? raw.contact_id ?? "unknown"),
    full_name: String(raw.name ?? raw.full_name ?? "Unknown person"),
    title: String(raw.title ?? ""),
    company_name: String(
      raw.organization_name ?? organization.name ?? organization.primary_domain ?? "",
    ),
    location: String(raw.city ?? raw.state ?? raw.country ?? raw.location ?? ""),
    seniority: String(raw.seniority ?? ""),
    department: departments.join(", "),
    linkedin_url:
      raw.linkedin_url !== undefined ? String(raw.linkedin_url) : undefined,
    email_status:
      raw.email_status !== undefined ? String(raw.email_status) : undefined,
  };
}

function getFixtureResult(request: PeopleSearchRequest): PeopleSearchResult {
  const normalized = peopleSearchRequestSchema.parse(request);
  const filters = peopleSearchPayloadSchema.parse(request);
  const rows: PeoplePreviewRow[] = [
    {
      apollo_id: "fixture-person-001",
      full_name: "Avery Ng",
      title: filters.personTitles[0] ?? "Head of Sales",
      company_name: normalized.selectedCompanyIds[0] ?? "Acme Analytics",
      location: filters.personLocations[0] ?? "Singapore",
      seniority: filters.personSeniorities[0] ?? "director",
      department: filters.personDepartments[0] ?? "sales",
      linkedin_url: "https://linkedin.com/in/avery-ng",
      email_status: "unavailable_in_people_preview",
    },
    {
      apollo_id: "fixture-person-002",
      full_name: "Jordan Lee",
      title: filters.personTitles[1] ?? "Founder",
      company_name: normalized.selectedCompanyIds[1] ?? "Orbit Ledger",
      location: filters.personLocations[1] ?? "Sydney",
      seniority: filters.personSeniorities[1] ?? "founder",
      department: filters.personDepartments[1] ?? "founder",
      linkedin_url: "https://linkedin.com/in/jordan-lee",
      email_status: "unavailable_in_people_preview",
    },
  ];

  return {
    signature: createPeopleSearchSignature(normalized),
    fetchedAt: new Date().toISOString(),
    request: normalized,
    rows,
    page: normalized.page,
    perPage: normalized.perPage,
    totalDisplayCount: rows.length,
    hasMore: false,
    availableColumns: Object.keys(rows[0] ?? {}),
    source: "fixture",
  };
}

export async function searchPeople(request: PeopleSearchRequest) {
  const normalized = peopleSearchRequestSchema.parse(request);

  if (!env.APOLLO_API_KEY) {
    return getFixtureResult(normalized);
  }

  const requestPayload = compactPayload({
    person_titles: normalized.personTitles,
    person_locations: normalized.personLocations,
    person_seniorities: normalized.personSeniorities,
    person_departments: normalized.personDepartments,
    organization_ids: normalized.selectedCompanyIds,
    page: normalized.page,
    per_page: normalized.perPage,
  });

  const response = await fetch("https://api.apollo.io/api/v1/mixed_people/api_search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": env.APOLLO_API_KEY,
    },
    body: JSON.stringify(requestPayload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Apollo people search failed with status ${response.status}`);
  }

  const payloadJson = (await response.json()) as Record<string, unknown>;
  const people = Array.isArray(payloadJson.people)
    ? payloadJson.people
    : Array.isArray(payloadJson.contacts)
      ? payloadJson.contacts
      : [];
  const pagination = getPagination(payloadJson.pagination);
  const rows = people
    .filter(
      (value): value is Record<string, unknown> =>
        typeof value === "object" && value !== null,
    )
    .map(normalizePerson);

  return {
    signature: createPeopleSearchSignature(normalized),
    fetchedAt: new Date().toISOString(),
    request: normalized,
    rows,
    page: Number(pagination.page ?? normalized.page),
    perPage: Number(pagination.per_page ?? normalized.perPage),
    totalDisplayCount: Number(pagination.total_entries ?? rows.length),
    hasMore: rows.length === normalized.perPage,
    availableColumns: Object.keys(rows[0] ?? {}),
    source: "live" as const,
  };
}
