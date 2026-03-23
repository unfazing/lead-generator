import { redirect } from "next/navigation";

type PeopleRecipesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;
}

export default async function PeopleRecipesPage({
  searchParams,
}: PeopleRecipesPageProps) {
  const params = searchParams ? await searchParams : {};
  const peopleRecipeId = getSingleParam(params, "peopleRecipe");
  const editorMode = getSingleParam(params, "editorMode");

  const query = new URLSearchParams();

  if (peopleRecipeId) {
    query.set("peopleRecipe", peopleRecipeId);
  }

  if (editorMode === "new" || editorMode === "edit") {
    query.set("editorMode", editorMode);
  }

  redirect(`/search/people${query.size > 0 ? `?${query.toString()}` : ""}`);
}
