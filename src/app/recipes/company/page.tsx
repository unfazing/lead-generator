import { redirect } from "next/navigation";

type CompanyRecipesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;
}

export default async function CompanyRecipesPage({
  searchParams,
}: CompanyRecipesPageProps) {
  const params = searchParams ? await searchParams : {};
  const companyRecipeId = getSingleParam(params, "companyRecipe");
  const editorMode = getSingleParam(params, "editorMode");

  const query = new URLSearchParams();

  if (companyRecipeId) {
    query.set("companyRecipe", companyRecipeId);
  }

  if (editorMode === "new" || editorMode === "edit") {
    query.set("editorMode", editorMode);
  }

  redirect(`/search/company${query.size > 0 ? `?${query.toString()}` : ""}`);
}
