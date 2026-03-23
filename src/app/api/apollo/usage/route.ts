import { NextResponse } from "next/server";
import { getApolloUsageSummary } from "@/features/usage/lib/apollo-usage";

export async function GET() {
  const summary = await getApolloUsageSummary();
  return NextResponse.json(summary);
}
