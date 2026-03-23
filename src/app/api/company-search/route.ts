import { NextResponse } from "next/server";
import {
  createCompanySearchSignature,
  searchCompanies,
} from "@/lib/apollo/company-search";
import { companySearchRequestSchema } from "@/lib/company-search/schema";
import {
  getLatestSnapshotForSignature,
  saveCompanySnapshot,
} from "@/lib/db/repositories/company-snapshots";

export async function POST(request: Request) {
  const body = (await request.json()) as unknown;
  const parsed = companySearchRequestSchema.parse(body);
  const signature = createCompanySearchSignature(parsed);
  const existingSnapshot = await getLatestSnapshotForSignature(
    parsed.recipeId,
    signature,
  );

  if (parsed.mode === "stored" && existingSnapshot) {
    return NextResponse.json({
      snapshot: existingSnapshot,
      reused: true,
    });
  }

  if (parsed.mode === "stored" && !existingSnapshot) {
    return NextResponse.json(
      {
        error:
          "No stored company snapshot exists for this recipe yet. Run a live company search first.",
      },
      { status: 404 },
    );
  }

  const searchResult = await searchCompanies(parsed);

  const snapshot = await saveCompanySnapshot(parsed.recipeId, searchResult);

  return NextResponse.json({
    snapshot,
    reused: false,
  });
}
