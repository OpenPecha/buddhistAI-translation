import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { updateProject } from "@/api/project";
import EditableText from "./ui/EditableText";

import DocIcon from "@/assets/doc_icon.png";
import ShareModal from "./ShareModal";

import { BiShare } from "react-icons/bi";
import ProfileArea from "./ProfileArea";
import { useTranslation } from "react-i18next";
import SettingsButton from "./setting/SettingsButton";

type Project = {
  id: string;
  name: string;
};

interface NavbarProps {
  project: Project;
}

const Navbar = ({ project }: NavbarProps) => {
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const permissionsOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPermissionsModal(true);
  };
  return (
    <nav
      className={`${currentLanguage === "bo" && " leading-[normal]"
        } px-6 pt-2 flex justify-between items-center`}
    >
      {/* Logo and Brand */}
      <div className="flex gap-2 items-center">
        <Link
          to="/"
          className="flex items-center gap-3 font-semibold text-gray-500 hover:text-gray-700 transition capitalize"
        >
          <img
            alt="icon"
            src={DocIcon}
            width={40}
            className=" object-contain"
          />
        </Link>
        <div className="flex flex-col w-fit items-center -space-y-1">
          <ProjectNameWrapper project={project} />
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex items-center gap-2">
        <SettingsButton />
        <NavMenuList permissionsOpen={permissionsOpen} />
        <ProfileArea />
      </div>
      {showPermissionsModal && (
        <ShareModal
          projectId={project.id}
          projectName={project.name}
          open={showPermissionsModal}
          onOpenChange={setShowPermissionsModal}
        />
      )}

    </nav>
  );
};

function ProjectNameWrapper({ project }: { readonly project: Project }) {
  // Create a separate component for the input to avoid conditional hook calls
  if (!project?.name) return null;
  return <ProjectNameInput project={project} />;
}

// Separate component to handle the project name input logic
function ProjectNameInput({ project }: { readonly project: Project }) {
  const queryClient = useQueryClient();

  // Set up mutation for updating project name
  const updateProjectMutation = useMutation({
    mutationFn: async (newName: string) => {
      if (!project.id) throw new Error("Project ID not found");
      return await updateProject(project.id, { name: newName });
    },
    onSuccess: () => {
      // Invalidate and refetch project and document data
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
      queryClient.invalidateQueries({ queryKey: ["document"] });
    },
    onError: (error) => {
      console.error("Failed to update project name:", error);
    },
  });

  const handleSave = async (newName: string) => {
    await updateProjectMutation.mutateAsync(newName);
  };

  return (
    <div className="inline-block text-lg">
      <EditableText
        initialText={project.name}
        onSave={handleSave}
        className="text-md text-gray-500 dark:text-neutral-300 hover:text-gray-700 transition capitalize outline-none ring-0"
        placeholder="Project name"
      />
    </div>
  );
}

export function NavMenuList({
  permissionsOpen,
}: {
  readonly permissionsOpen: (e: React.MouseEvent) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-3 font-google-sans">
      <Button
        onClick={permissionsOpen}
        variant="outline"
        aria-label="Share document"
      >
        <BiShare className="text-secondary-600 dark:text-neutral-300" />
        <span className="capitalize leading-[normal]">
          {t("common.share")}/{t("common.download")}
        </span>
      </Button>
    </div>
  );
}

export default Navbar;
