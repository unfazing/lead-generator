export const peopleExportColumnOptions = [
  { label: "Full name", value: "full_name" },
  { label: "Title", value: "title" },
  { label: "Company name", value: "company_name" },
  { label: "Location", value: "location" },
  { label: "Seniority", value: "seniority" },
  { label: "Department", value: "department" },
  { label: "LinkedIn URL", value: "linkedin_url" },
  { label: "Email status", value: "email_status" },
  { label: "Apollo person ID", value: "apollo_id" },
] as const;

export const defaultPeopleExportColumns = [
  "full_name",
  "title",
  "company_name",
  "email_status",
] as const;

export type PeopleExportColumn = (typeof peopleExportColumnOptions)[number]["value"];
