import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

const serializeSearchParams = (searchParams: SearchParams) => {
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  });
  return query.toString();
};

export default async function WorkspaceConnectionsRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ workspaceId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const query = serializeSearchParams(resolvedSearchParams);
  redirect(
    `/dashboard/${workspaceId}/integrations${query ? `?${query}` : ""}`,
  );
}
