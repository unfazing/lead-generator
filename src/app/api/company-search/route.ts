import { NextResponse } from "next/server";
import { searchCompanies } from "@/lib/apollo/company-search";
import { companySearchRequestSchema } from "@/lib/company-search/schema";
import {
  getLatestSnapshotForSignature,
  saveCompanySnapshot,
} from "@/lib/db/repositories/company-snapshots";

export async function POST(request: Request) {
  const body = (await request.json()) as unknown;
  const parsed = companySearchRequestSchema.parse(body);

  const searchResult = await searchCompanies(parsed);
  const existingSnapshot = await getLatestSnapshotForSignature(
    parsed.recipeId,
    searchResult.signature,
  );

  if (parsed.mode === "reuse" && existingSnapshot) {
    return NextResponse.json({
      snapshot: existingSnapshot,
      reused: true,
    });
  }

  const snapshot = await saveCompanySnapshot(parsed.recipeId, searchResult);

  return NextResponse.json({
    snapshot,
    reused: false,
  });
}
