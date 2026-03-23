import { getVisibleWarnings } from "@/features/company-search/lib/company-search-warnings";
import type { CompanySearchWarning } from "@/lib/apollo/company-search";

type CompanySearchWarningProps = {
  warnings: CompanySearchWarning[];
};

export function CompanySearchWarning({
  warnings,
}: CompanySearchWarningProps) {
  const visibleWarnings = getVisibleWarnings(warnings);

  if (visibleWarnings.length === 0) {
    return null;
  }

  return (
    <div className="warning-stack">
      {visibleWarnings.map((warning) => (
        <div key={warning.message} className="warning-banner">
          <strong>
            {warning.level === "warning" ? "Broad search warning" : "Search info"}
          </strong>
          <p>{warning.message}</p>
        </div>
      ))}
    </div>
  );
}
