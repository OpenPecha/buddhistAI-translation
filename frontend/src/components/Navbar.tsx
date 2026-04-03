import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { updateProject } from "@/api/project";
import EditableText from "./ui/EditableText";
import ShareModal from "./ShareModal";
import { Share2 } from "lucide-react";
import ProfileArea from "./ProfileArea";
import { useTranslation } from "react-i18next";
import SettingsButton from "./setting/SettingsButton";
import { ModeToggle } from "./v2/ui/molecules/mode-toggle/ModeToggle";

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
        } px-6 pt-2 flex justify-between items-center mb-2`}
    >
      {/* Logo and Brand */}
      <div className="flex gap-2 items-center">
        <Link
          to="/"
          className="flex items-center gap-3 font-semibold text-gray-500 hover:text-gray-700 transition capitalize"
        >
          <div className="w-3 h-3 bg-[#12A7FC]" />
        </Link>
        <ProjectNameWrapper project={project} />
      </div>

      <div className="flex items-center gap-1">
        <SettingsButton />
        <ModeToggle />
        <div className="w-px h-5 bg-border mx-2" />
        <NavMenuList permissionsOpen={permissionsOpen} />
        <div className="w-px h-5 bg-border mx-2" />
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
    <Button
      onClick={permissionsOpen}
      variant="outline"
      size="sm"
      className="gap-1.5 font-medium rounded-sm"
      aria-label="Share document"
    >
      <Share2 size={14} />
      <span className="capitalize">{t("common.share")}</span>
    </Button>
  );
}

export default Navbar;
