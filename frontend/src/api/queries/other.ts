import { useQuery } from "@tanstack/react-query";
import { fetchTools } from "../workspace/tools";

const useFetchTools = () => {
  return useQuery({
    queryKey: ["tools"],
    queryFn: fetchTools,
    staleTime: 1000 * 60 * 5,
  });
};

export { useFetchTools };
