import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { searchPeople } from "@/lib/apollo/people-search";
import { peopleSearchRequestSchema } from "@/lib/people-search/schema";
import { savePeopleSnapshot } from "@/lib/db/repositories/people-snapshots";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = peopleSearchRequestSchema.parse(body);
    const result = await searchPeople(parsed);
    const snapshot = await savePeopleSnapshot(
      {
        companyRecipeId: parsed.companyRecipeId,
        companySnapshotId: parsed.companySnapshotId,
        peopleRecipeId: parsed.peopleRecipeId,
        recipeParams: parsed,
        selectionMode: parsed.mode,
        selectedCompanyIds: parsed.selectedCompanyIds,
        organizationImports: [],
      },
      result,
    );

    return NextResponse.json({ snapshot });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON body for people search request." },
        { status: 400 },
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid people search request payload.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    throw error;
  }
}
