import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import EachProject from "../../EachProject";
import { useTranslation } from "react-i18next";
import {
    getCategoryTitle,
    categorizeProjectsByTime,
} from "@/lib/dateUtils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Grid, List } from "lucide-react";
import { FaSpinner } from "react-icons/fa";
import { Project } from "@/api/project";
import { useAuth } from "@/auth/use-auth-hook";

interface ProjectsSectionProps {
    projects: Project[];
    selectedOwner: string | null;
    onOwnerChange: (ownerId: string | null) => void;
    isLoading: boolean;
}

export const ProjectsSection = ({
    projects,
    selectedOwner,
    onOwnerChange,
    isLoading,
}: ProjectsSectionProps) => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const [view, setView] = useState<"grid" | "list">("list");
    const uniqueOwners = ["ownedByMe", "ownedByAnyone", "notOwnedByMe"];

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

    const selectedOwnerName = selectedOwner
        ? uniqueOwners.find((owner) => owner === selectedOwner)
        : "All";

    function toggleList() {
        setView((prev) => (prev === "list" ? "grid" : "list"));
    }

    return (
        <div>
            <div className="flex items-center py-4">
                <div className="flex-grow min-w-0">
                    {t(`project.Projects`)}
                </div>
                <div className="flex items-center justify-between min-w-sm">
                    <div className="hidden sm:flex flex-shrink-0  justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-sm gap-2 w-fit"
                                >
                                    {t(`project.${selectedOwnerName}`)}
                                    <ChevronDown size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {uniqueOwners.map((owner) => (
                                    <DropdownMenuItem
                                        key={owner}
                                        onClick={() => onOwnerChange(owner)}
                                    >
                                        {t(`project.${owner}`)}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    {view === "list" && (
                        <div className="hidden sm:flex flex-shrink-0 items-center gap-2">
                            <span className="text-sm text-neutral-600 dark:text-neutral-300">
                                {t(`project.lastModified`)}
                            </span>
                        </div>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        title={view === "list" ? "Grid view" : "List view"}
                        onClick={toggleList}
                    >
                        <span className="sr-only">Grid view</span>
                        {view === "list" ? <List /> : <Grid />}
                    </Button>
                </div>
            </div>

            {isLoading && (
                <FaSpinner size="30" className="animate-spin w-full mb-2" />
            )}

            {categorizedProjects.map((category) => (
                <div key={category.category} className="mb-8">

                    <div className=" text-sm text-neutral-600 dark:text-neutral-300 mb-3 px-1">
                        {t(`${getCategoryTitle(category.category)}`)}
                    </div>

                    <div
                        className={`${view === "grid"
                            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                            : "flex flex-col gap-1"
                            }`}
                    >
                        {category.projects.map((project) => (
                            <EachProject
                                view={view}
                                key={project.id}
                                project={project}
                                timeCategory={category.category}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProjectsSection;
