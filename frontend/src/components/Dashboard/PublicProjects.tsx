import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useFetchPublicDocuments } from "@/api/queries/documents";
import { ProjectLoader } from "../v2/ui/atoms/Icons/Loaders/ProjectLoader";
import { SearchBar } from "./Components/SearchBar/SearchBar";
import { ProjectCard } from "../v2/ui/molecules/cards/project-card/ProjectCard";
import { PaginationControls } from "./Components/Pagination/PaginationControl";


interface PublicProjectsProps {
  showAll?: boolean;
  setShowGalleryButton?: (show: boolean) => void;
}

const PublicProjects = ({ showAll = false, setShowGalleryButton }: PublicProjectsProps) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const limit = showAll ? 12 : 4;

  const { data, isLoading, isError } = useFetchPublicDocuments({
    currentPage,
    limit,
    searchQuery,
  });

  const projects = data?.data ?? [];
  const pagination = data?.pagination;

  const hasData = projects.length > 0;

  useEffect(() => {
    if (setShowGalleryButton) {
      setShowGalleryButton(hasData);
    }
  }, [hasData, setShowGalleryButton]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return <ProjectLoader />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center">
        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
        <span className="text-red-600">
          {t("publicProject.failedToLoadTemplates", "Failed to load public Projects")}
        </span>
      </div>
    );
  }

  if (!projects.length && !showAll) {
    return null;
  }

  const displayProjects = showAll ? projects : projects.slice(0, 4);

  return (
    <div className="space-y-4 w-full flex-1">
      {showAll && (
        <div className="flex items-center gap-4 mb-6">
          <SearchBar value={searchQuery} onChange={handleSearch} />
        </div>
      )}
      {projects.length > 0 ? (
        <div className="w-full space-y-2 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayProjects.map((project: any) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : showAll ? (
        <div className="flex  text-zinc-400">
          {t("publicProject.noResultsFound", "No Public projects found matching your search")}
        </div>
      ) : null}

      {showAll && pagination && (
        <div className="mt-6">
          <PaginationControls pagination={pagination} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
};

export default PublicProjects;