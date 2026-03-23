import type { PeopleSearchPayload } from "@/lib/people-search/schema";
import {
  contactEmailStatusOptions,
  peopleSeniorityOptions,
} from "@/lib/people-search/schema";

type FilterOption = {
  label: string;
  value: string;
};

type FilterDefinition = {
  key: keyof PeopleSearchPayload;
  label: string;
  description: string;
  input: "text" | "multi-text" | "single-select" | "multi-select";
  apiParam: string;
  placeholder?: string;
  options?: FilterOption[];
};

const labelize = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const peopleSeniorityFilterOptions: FilterOption[] =
  peopleSeniorityOptions.map((value) => ({
    label: labelize(value),
    value,
  }));

export const contactEmailStatusFilterOptions: FilterOption[] =
  contactEmailStatusOptions.map((value) => ({
    label: labelize(value),
    value,
  }));

export const peopleFilterDefinitions: FilterDefinition[] = [
  {
    key: "personTitles",
    label: "People titles",
    description:
      "Maps to Apollo `person_titles`, which accepts an array of title strings.",
    input: "multi-text",
    apiParam: "person_titles",
    placeholder: "sales director",
  },
  {
    key: "personLocations",
    label: "People locations",
    description:
      "Maps to Apollo `person_locations`, which accepts an array of person-location strings.",
    input: "multi-text",
    apiParam: "person_locations",
    placeholder: "California, US",
  },
  {
    key: "personSeniorities",
    label: "Seniority",
    description:
      "Constrained values for Apollo seniority-style filtering.",
    input: "multi-select",
    apiParam: "person_seniorities",
    options: peopleSeniorityFilterOptions,
  },
];
