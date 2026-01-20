import { useState } from "react";
import { Button } from "@/components/ui/button";
import EachProject from "../../EachProject";
import { useTranslation } from "react-i18next";
import {
    getCategoryTitle,
    type CategorizedProject,
} from "@/lib/dateUtils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Grid, List } from "lucide-react";
import { FaSpinner } from "react-icons/fa";

interface ProjectsSectionProps {
    categorizedProjects: CategorizedProject[];
    uniqueOwners: string[];
    selectedOwner: string | null;
    onOwnerChange: (ownerId: string | null) => void;
    isLoading: boolean;
}

export const ProjectsSection = ({
    categorizedProjects,
    uniqueOwners,
    selectedOwner,
    onOwnerChange,
    isLoading,
}: ProjectsSectionProps) => {
    const { t } = useTranslation();
    const [view, setView] = useState<"grid" | "list">("list");

    const selectedOwnerName = selectedOwner
        ? uniqueOwners.find((owner) => owner === selectedOwner)
        : "All";
    const firstCategoryTitle = categorizedProjects[0]?.category;

    function toggleList() {
        setView((prev) => (prev === "list" ? "grid" : "list"));
    }

    return (
        <div className="mb-8">
            {/* Header Section */}
            <div className="flex items-center py-2 px-1 mb-2 gap-4">
                <div className="flex-grow min-w-0">
                    <span className=" text-sm capitalize text-neutral-600 dark:text-neutral-300 mb-3 px-1">
                        {t(`${getCategoryTitle(firstCategoryTitle)}`)}
                    </span>
                </div>

                <div className="hidden sm:flex flex-shrink-0 mx-4 w-36 justify-end">
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
                    <div className="hidden sm:flex flex-shrink-0 w-36 items-center gap-2">
                        <span className="text-sm text-neutral-600 dark:text-neutral-300">
                            {t(`project.lastModified`)}
                        </span>
                    </div>
                )}

                <div className="flex-shrink-0 ml-2 w-[52px] flex justify-center">
                    <div className="flex gap-1">
                        <button
                            title={view === "list" ? "Grid view" : "List view"}
                            className="rounded-full cursor-pointer h-8 w-8 flex justify-center items-center hover:bg-neutral-200 dark:hover:bg-neutral-700"
                            onClick={toggleList}
                        >
                            <span className="sr-only">Grid view</span>
                            {view === "list" ? <List /> : <Grid />}
                        </button>
                    </div>
                </div>
            </div>

            {isLoading && (
                <FaSpinner size="30" className="animate-spin w-full mb-2" />
            )}

            {/* Categorized Projects */}
            {categorizedProjects.map((category, index) => (
                <div key={category.category} className="mb-8">
                    {index !== 0 && (
                        <div className=" text-sm text-neutral-600 dark:text-neutral-300 mb-3 px-1">
                            {t(`${getCategoryTitle(category.category)}`)}
                        </div>
                    )}
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
