import type { CompanySearchPayload } from "@/lib/company-search/schema";

type FilterOption = {
  label: string;
  value: string;
};

type FilterDefinition = {
  key: keyof CompanySearchPayload;
  label: string;
  description: string;
  input: "text" | "multi-text" | "single-select" | "multi-select";
  apiParam: string;
  placeholder?: string;
  options?: FilterOption[];
};

export const employeeRangeOptions: FilterOption[] = [
  { label: "1-10", value: "1,10" },
  { label: "11-20", value: "11,20" },
  { label: "21-50", value: "21,50" },
  { label: "51-100", value: "51,100" },
  { label: "101-200", value: "101,200" },
  { label: "201-500", value: "201,500" },
  { label: "501-1000", value: "501,1000" },
  { label: "1001-5000", value: "1001,5000" },
  { label: "5001-10000", value: "5001,10000" },
];

export const companyFilterDefinitions: FilterDefinition[] = [
  {
    key: "organizationName",
    label: "Company name",
    description: "Open-ended text for a specific organization name.",
    input: "text",
    apiParam: "q_organization_name",
    placeholder: "Linear",
  },
  {
    key: "organizationWebsite",
    label: "Company website",
    description: "Open-ended text for a known company domain.",
    input: "text",
    apiParam: "organization_website",
    placeholder: "linear.app",
  },
  {
    key: "organizationLocations",
    label: "Locations",
    description: "City, state, or country values to narrow organizations geographically.",
    input: "multi-text",
    apiParam: "organization_locations",
    placeholder: "Singapore",
  },
  {
    key: "organizationNumEmployeesRanges",
    label: "Employee ranges",
    description: "Constrained employee bands mapped to Apollo range values.",
    input: "multi-select",
    apiParam: "organization_num_employees_ranges",
    options: employeeRangeOptions,
  },
  {
    key: "organizationIds",
    label: "Apollo organization IDs",
    description: "Direct Apollo organization identifiers when you already know the exact companies.",
    input: "multi-text",
    apiParam: "organization_ids",
    placeholder: "66f6e1f9f3b2b20001c0f001",
  },
  {
    key: "qOrganizationKeywordTags",
    label: "Include keywords",
    description: "Open-ended company keywords or tags to include.",
    input: "multi-text",
    apiParam: "q_organization_keyword_tags",
    placeholder: "saas",
  },
  {
    key: "organizationNotKeywordTags",
    label: "Exclude keywords",
    description: "Open-ended company keywords or tags to exclude.",
    input: "multi-text",
    apiParam: "organization_not_keyword_tags",
    placeholder: "agency",
  },
  {
    key: "organizationIndustryTagIds",
    label: "Industry tag IDs",
    description: "Apollo industry tag identifiers for exact industry filtering.",
    input: "multi-text",
    apiParam: "organization_industry_tag_ids",
    placeholder: "5567ce5f7369641f6c1eced7",
  },
];

export const defaultCompanyPreviewColumns = [
  "name",
  "website_url",
  "primary_domain",
  "linkedin_url",
  "founded_year",
  "apollo_id",
] as const;

export type CompanyPreviewColumn = (typeof defaultCompanyPreviewColumns)[number];
