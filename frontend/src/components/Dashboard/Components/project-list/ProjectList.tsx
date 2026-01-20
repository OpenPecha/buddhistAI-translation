import { useState, useMemo, useEffect } from "react";
import { Project } from "@/api/project";
import { useAuth } from "@/auth/use-auth-hook";
import { useSearchStore } from "@/stores/searchStore";
import {
    categorizeProjectsByTime,
} from "@/lib/dateUtils";
import { INITIAL_PROJECT_LIMIT } from "@/config";
import { useFetchProjects } from "@/api/queries/projects";
import { ProjectsSection } from "../project-section/ProjectSection";
import { Pagination } from "@/components/v2/ui/molecules/pagination/Pagination";

const ProjectsListSection = () => {
    const [page, setPage] = useState(1);
    const [selectedOwner, setSelectedOwner] = useState<string | null>(
        "ownedByAnyone"
    );
    const { searchQuery } = useSearchStore();
    const { currentUser } = useAuth();

    const uniqueOwners = ["ownedByMe", "ownedByAnyone", "notOwnedByMe"];
    const itemsPerPage = INITIAL_PROJECT_LIMIT;

    useEffect(() => {
        setPage(1);
    }, [searchQuery, selectedOwner]);

    const { data, isLoading, isError, isPending } = useFetchProjects({
        searchQuery,
        page,
        itemsPerPage,
        selectedOwner,
    });
    const showLoader = isLoading || isPending;
    const { data: projects = [], pagination } = data;

    const totalPages = pagination?.totalPages || 1;

    const filteredProjects = useMemo(() => {
        let filtered = projects;
        if (selectedOwner === "ownedByMe")
            filtered = projects.filter(
                (project: Project) => project.owner?.id === currentUser?.id
            );
        else if (selectedOwner === "notOwnedByMe")
            filtered = projects.filter(
                (project: Project) => project.owner?.id !== currentUser?.id
            );
        return filtered;
    }, [projects, selectedOwner, currentUser?.id]);

    const categorizedProjects = categorizeProjectsByTime(filteredProjects);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };


    return (
        <div className="px-4 w-full">
            {isError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {"Failed to fetch projects"}
                </div>
            )}
            <div className="max-w-5xl mx-auto mb-2">
                <ProjectsSection
                    categorizedProjects={categorizedProjects}
                    uniqueOwners={uniqueOwners}
                    selectedOwner={selectedOwner}
                    onOwnerChange={setSelectedOwner}
                    isLoading={showLoader}
                />
                {filteredProjects?.length === 0 && !showLoader && (
                    <div className="text-center py-8">
                        <p>You don't have any projects yet. Create one to get started!</p>
                    </div>
                )}

                {totalPages > 1 && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>
        </div>
    );
};

export default ProjectsListSection;
