import { NextResponse } from "next/server";
import { searchPeople } from "@/lib/apollo/people-search";
import { peopleSearchRequestSchema } from "@/lib/people-search/schema";
import { savePeopleSnapshot } from "@/lib/db/repositories/people-snapshots";

export async function POST(request: Request) {
  const body = (await request.json()) as unknown;
  const parsed = peopleSearchRequestSchema.parse(body);
  const result = await searchPeople(parsed);
  const snapshot = await savePeopleSnapshot(
    {
      companyRecipeId: parsed.companyRecipeId,
      companySnapshotId: parsed.companySnapshotId,
      peopleRecipeId: parsed.peopleRecipeId,
      selectionMode: parsed.mode,
      selectedCompanyIds: parsed.selectedCompanyIds,
    },
    result,
  );

  return NextResponse.json({ snapshot });
}
