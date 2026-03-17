import React, { useState } from "react";
import { Link } from "react-router-dom";
import EditProjectModal from "./EditProjectModal";
import ShareModal from "../ShareModal";
import { useAuth } from "@/auth/use-auth-hook";

import ProjectItem from "./ProjectItem";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Project, deleteProject, updateProject } from "@/api/project";
import formatTimeAgo from "@/lib/formatTimeAgo";
import { formatDateByCategory, type TimeCategory } from "@/lib/dateUtils";
import { useTranslation } from "react-i18next";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface EachProjectProps {
  readonly project: Project;
  readonly view: "grid" | "list";
  readonly timeCategory?: TimeCategory;
}

export default function EachProject({
  project,
  view,
  timeCategory,
}: EachProjectProps) {
  const { t } = useTranslation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
        refetchType: "all"
      });
    },
    onError: (error) => {
      console.error("Error deleting project:", error);
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    deleteProjectMutation.mutate(project.id);
  };

  type UpdateProjectParams = {
    id: string;
    data: {
      name?: string;
      identifier?: string;
      status?: string;
      metadata?: Record<string, unknown>;
    };
  };

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: UpdateProjectParams) => updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects"],
        refetchType: "all"
      });
      setShowEditModal(false);
    },
    onError: (error) => {
      console.error("Error updating project:", error);
    },
  });

  const handleUpdate = async (name: string, identifier: string) => {
    updateProjectMutation.mutate({
      id: project.id,
      data: {
        name,
        identifier,
      },
    });
  };

  const editOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEditModal(true);
  };

  const shareOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareModal(true);
  };

  const firstTranslationId = project.roots?.[1]?.id;
  const url =
    project.roots && project.roots.length > 0
      ? `/documents/${project.roots[0]?.id}${firstTranslationId ? `?translation=${firstTranslationId}` : ""}`
      : "#";

  const formattedDate = timeCategory
    ? formatDateByCategory(project.updatedAt, timeCategory)
    : formatTimeAgo(project.updatedAt);

  return (
    <>
      <Link to={url}>
        <ProjectItem
          project={project}
          currentUserId={currentUser?.id}
          formattedDate={formattedDate}
          url={url}
          view={view}
          onUpdate={editOpen}
          onDelete={handleDelete}
          onShare={shareOpen}
        />
      </Link>

      <EditProjectModal
        open={showEditModal}
        project={project}
        onOpenChange={setShowEditModal}
        onUpdate={handleUpdate}
      />
      <ShareModal
        open={showShareModal}
        projectId={project.id}
        projectName={project.name}
        onOpenChange={setShowShareModal}
      />

      <ConfirmationModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title={t("projects.deleteProject")}
        message={t("projects.deleteProjectMessage")}
        confirmText={t("projects.deleteProjectConfirmText")}
        loading={deleteProjectMutation.isPending}
      />
    </>
  );
}
