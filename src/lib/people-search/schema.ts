import { z } from "zod";

export const peopleSeniorityOptions = [
  "owner",
  "founder",
  "c_suite",
  "partner",
  "vp",
  "head",
  "director",
  "manager",
  "senior",
  "entry",
] as const;

export const peopleDepartmentOptions = [
  "c_suite",
  "engineering",
  "finance",
  "founder",
  "hr",
  "it",
  "legal",
  "marketing",
  "operations",
  "product",
  "sales",
  "support",
] as const;

export const peopleSearchPayloadSchema = z.object({
  page: z.number().int().min(1).max(500).default(1),
  perPage: z.number().int().min(1).max(100).default(25),
  personTitles: z.array(z.string().trim().min(1)).max(25).default([]),
  personLocations: z.array(z.string().trim().min(1)).max(15).default([]),
  personSeniorities: z.array(z.enum(peopleSeniorityOptions)).max(10).default([]),
  personDepartments: z.array(z.enum(peopleDepartmentOptions)).max(10).default([]),
});

export const peopleSearchModeSchema = z.enum(["selected", "all"]);

export const peopleSearchRequestSchema = peopleSearchPayloadSchema.extend({
  companyRecipeId: z.string().min(1),
  companySnapshotId: z.string().min(1),
  peopleRecipeId: z.string().min(1),
  mode: peopleSearchModeSchema,
  selectedCompanyIds: z.array(z.string().min(1)).default([]),
});

export type PeopleSearchPayload = z.infer<typeof peopleSearchPayloadSchema>;
export type PeopleSearchMode = z.infer<typeof peopleSearchModeSchema>;
export type PeopleSearchRequest = z.infer<typeof peopleSearchRequestSchema>;
