import { useQuery } from "@tanstack/react-query";
import { fetchProjects, getProjectShareInfo } from "../project";

const getOwnerType = (selectedOwner: string | null) => {
  if (!selectedOwner) return "both";
  if (selectedOwner === "ownedByMe") return "User";
  if (selectedOwner === "ownedByAnyone") return "both";
  if (selectedOwner === "notOwnedByMe") return "shared";
  return "both";
};

const useFetchProjects = ({
  searchQuery,
  page,
  itemsPerPage,
  selectedOwner,
}: {
  searchQuery: string;
  page: number;
  itemsPerPage: number;
  selectedOwner: string | null;
}) => {
  return useQuery({
    queryKey: ["projects", searchQuery, page, getOwnerType(selectedOwner)],
    initialData: { data: [], pagination: { page: 1, totalPages: 1, total: 0 } },
    queryFn: () =>
      fetchProjects({
        searchQuery,
        page: page,
        limit: itemsPerPage,
        owner: getOwnerType(selectedOwner),
      }),
    refetchOnWindowFocus: false,
    select: (data) => data.data,
  });
};

const useFetchProjectShareInfo = (
  projectId: string,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;
  return useQuery({
    queryKey: ["projectShare", projectId],
    queryFn: () => getProjectShareInfo(projectId),
    enabled: enabled && !!projectId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export { useFetchProjects, useFetchProjectShareInfo };
