import { NextResponse } from "next/server";
import { buildRetrievalRunSummary } from "@/lib/retrieval/run-summary";

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { runId } = await context.params;

  try {
    const summary = await buildRetrievalRunSummary(runId);
    return NextResponse.json(summary);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Retrieval run not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
