"use client";

import { useState } from "react";

function normalizeDomain(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//u, "");
  const withoutWww = withoutProtocol.replace(/^www\./u, "");
  const domainOnly = withoutWww.split("/")[0]?.trim() ?? "";

  return domainOnly || null;
}

function splitCompanyLines(value: string) {
  return value
    .split(/\r?\n/u)
    .map((item) => normalizeDomain(item))
    .filter((item): item is string => Boolean(item));
}

export function CompanyListImporter({
  onImport,
}: {
  onImport: (domains: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");

  function applyImport() {
    onImport(splitCompanyLines(draft));
    setDraft("");
    setIsOpen(false);
  }

  return (
    <>
      <button
        className="secondary-button"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {isOpen ? "Close import" : "Import domains"}
      </button>
      {isOpen ? (
        <div className="stack subtle-card card">
          <label htmlFor="company-list-importer">Paste one domain per line</label>
          <textarea
            id="company-list-importer"
            onChange={(event) => setDraft(event.target.value)}
            placeholder={"apollo.io\nhttps://stripe.com\nwww.siltronic.com"}
            value={draft}
          />
          <p className="field-hint">
            Imported domains will be added directly into the visible organization domains field.
          </p>
          <div className="workspace-actions">
            <button
              className="primary-button"
              disabled={!draft.trim()}
              onClick={applyImport}
              type="button"
            >
              Add domains
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
