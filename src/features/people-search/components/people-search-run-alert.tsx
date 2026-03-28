"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { finalizePeopleSearchAction } from "@/app/recipes/actions";

type PeopleSearchRunAlertProps = {
  status?: string | null;
  peopleRecipeId?: string | null;
  totalEntries?: string | null;
  retrievedCount?: string | null;
  error?: string | null;
};

export function PeopleSearchRunAlert({
  status = null,
  peopleRecipeId = null,
  totalEntries = null,
  retrievedCount = null,
  error = null,
}: PeopleSearchRunAlertProps) {
  const pathname = usePathname();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [desiredCount, setDesiredCount] = useState<string | null>(null);

  function clearQueryFeedback() {
    const nextParams = new URLSearchParams(window.location.search);
    nextParams.delete("peopleSearchStatus");
    nextParams.delete("peopleSearchTotalEntries");
    nextParams.delete("peopleSearchRetrievedCount");
    nextParams.delete("peopleSearchError");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }

  useEffect(() => {
    if (!status) {
      return;
    }

    if (status === "preview") {
      if (!peopleRecipeId || !totalEntries) {
        clearQueryFeedback();
        return;
      }

      const formattedTotal = Number(totalEntries).toLocaleString("en-US");
      let nextValue: string | null = null;

      while (nextValue === null) {
        const answer = window.prompt(
          `Apollo found ${formattedTotal} matching people. How many would you like to retrieve? Enter a number or 'all'.`,
          "all",
        );

        if (answer === null) {
          clearQueryFeedback();
          return;
        }

        const normalized = answer.trim().toLowerCase();
        if (normalized === "all") {
          nextValue = "all";
          break;
        }

        const parsed = Number.parseInt(normalized, 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          nextValue = String(parsed);
          break;
        }

        window.alert("Enter a positive number or 'all'.");
      }

      setDesiredCount(nextValue);
      return;
    }

    if (status === "success") {
      const formattedTotal = totalEntries
        ? Number(totalEntries).toLocaleString("en-US")
        : "unknown";
      const formattedRetrieved = retrievedCount
        ? Number(retrievedCount).toLocaleString("en-US")
        : "unknown";
      window.alert(
        `People search completed. Apollo found ${formattedTotal} total entries and retrieved ${formattedRetrieved} people.`,
      );
    } else if (status === "error") {
      window.alert(`People search failed: ${error ?? "Unknown error"}`);
    }

    clearQueryFeedback();
  }, [
    error,
    pathname,
    peopleRecipeId,
    retrievedCount,
    router,
    status,
    totalEntries,
  ]);

  useEffect(() => {
    if (!desiredCount || !formRef.current) {
      return;
    }

    formRef.current.requestSubmit();
  }, [desiredCount]);

  return peopleRecipeId && desiredCount ? (
    <form action={finalizePeopleSearchAction} ref={formRef}>
      <input type="hidden" name="peopleRecipeId" value={peopleRecipeId} />
      <input type="hidden" name="desiredCount" value={desiredCount} />
    </form>
  ) : null;
}
