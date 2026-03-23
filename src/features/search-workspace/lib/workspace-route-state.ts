import { z } from "zod";

export type SearchWorkspaceParams = Record<string, string | string[] | undefined>;
export type SearchWorkflow = "landing" | "company" | "people";

const routeQuerySchema = z.object({
  companyRecipeId: z.string().min(1).nullable(),
  peopleRecipeId: z.string().min(1).nullable(),
  companySnapshotId: z.string().min(1).nullable(),
  peopleSnapshotId: z.string().min(1).nullable(),
  sourceSnapshotIds: z.array(z.string().min(1)),
});

type ParsedQuery = z.infer<typeof routeQuerySchema>;

export type SearchWorkspaceContext =
  | ({
      workflow: "landing";
    } & ParsedQuery)
  | ({
      workflow: "company";
    } & ParsedQuery)
  | ({
      workflow: "people";
    } & ParsedQuery);

function readSingleParam(params: SearchWorkspaceParams, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? null : null;
}

function readMultiParam(params: SearchWorkspaceParams, key: string) {
  const value = params[key];

  if (typeof value === "string") {
    return value ? [value] : [];
  }

  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeRouteQuery(params: SearchWorkspaceParams): ParsedQuery {
  return routeQuerySchema.parse({
    companyRecipeId: readSingleParam(params, "companyRecipe"),
    peopleRecipeId: readSingleParam(params, "peopleRecipe"),
    companySnapshotId: readSingleParam(params, "snapshot"),
    peopleSnapshotId: readSingleParam(params, "peopleSnapshot"),
    sourceSnapshotIds: [
      ...readMultiParam(params, "sourceSnapshot"),
      ...readMultiParam(params, "sourceSnapshots"),
    ],
  });
}

function assertValidContext(
  workflow: SearchWorkflow,
  query: ParsedQuery,
): SearchWorkspaceContext {
  if (workflow === "landing") {
    if (query.companySnapshotId || query.peopleSnapshotId || query.sourceSnapshotIds.length > 0) {
      throw new Error("Landing route only accepts explicit recipe context.");
    }

    return { workflow, ...query };
  }

  if (workflow === "company") {
    if (query.peopleSnapshotId || query.sourceSnapshotIds.length > 0) {
      throw new Error("Company workflow does not accept people snapshot or source snapshot context.");
    }

    return { workflow, ...query };
  }

  if (query.companySnapshotId && query.sourceSnapshotIds.length > 0) {
    throw new Error("People workflow cannot mix snapshot and sourceSnapshot query params.");
  }

  if (query.peopleSnapshotId && !query.peopleRecipeId) {
    throw new Error("People workflow requires a people recipe when loading a people snapshot.");
  }

  if (query.sourceSnapshotIds.length > 0 && !query.peopleRecipeId) {
    throw new Error("People workflow requires a people recipe before selecting source snapshots.");
  }

  return { workflow, ...query };
}

export function parseSearchWorkspaceContext(
  workflow: SearchWorkflow,
  params: SearchWorkspaceParams,
) {
  return assertValidContext(workflow, normalizeRouteQuery(params));
}

export function buildSearchWorkspaceQuery(context: Partial<SearchWorkspaceContext>) {
  const query = new URLSearchParams();

  if (context.companyRecipeId) {
    query.set("companyRecipe", context.companyRecipeId);
  }

  if (context.peopleRecipeId) {
    query.set("peopleRecipe", context.peopleRecipeId);
  }

  if (context.companySnapshotId) {
    query.set("snapshot", context.companySnapshotId);
  }

  if (context.peopleSnapshotId) {
    query.set("peopleSnapshot", context.peopleSnapshotId);
  }

  if (context.sourceSnapshotIds) {
    for (const snapshotId of context.sourceSnapshotIds) {
      query.append("sourceSnapshot", snapshotId);
    }
  }

  return query.toString();
}
