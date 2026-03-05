import React, { useState } from "react";
import { FileText, MoreVertical, Share2, Trash2, PencilLine, Globe } from "lucide-react";
import DocIcon from "@/assets/doc_icon.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { OpenInNewTab } from "../v2/ui/atoms/Icons/Icons";

const ProjectItem = ({
  project,
  currentUserId,
  formattedDate,
  url,
  view,
  onUpdate,
  onDelete,
  onShare,
}: any) => {
  const { t } = useTranslation();
  const owner =
    project.ownerId === currentUserId
      ? t("projects.me")
      : project.owner?.username ?? "";

  const hasPermission = project.ownerId === currentUserId;
  const isPublic = project.isPublic;
  const updateDocument = onUpdate;
  const deleteDocument = onDelete;
  const shareDocument = onShare;
  if (view === "list") {
    return (
      <div className="flex items-center py-2 px-1 border-b border-gray-200 dark:border-neutral-700 hover:bg-zinc-50 hover:dark:bg-neutral-800 transition-all">
        <div className="flex-shrink-0 mr-4 w-[26px] flex justify-center">
          <img alt="icon" src={DocIcon} width={26} className="object-contain" />
        </div>

        <div className="flex-grow w-fit md:w-auto">
          <div className="flex space-x-2 items-center">
            <span className="inline-block text-sm text-foreground capitalize min-w-0 max-w-3xs lg:max-w-xs overflow-hidden truncate">
              {project.name}
            </span>

            {project.roots.length > 0 && (
              <span className="flex gap-x-1 items-center">
                <FileText size={16} className="text-zinc-500" />
                <span className="text-xs text-zinc-500">
                  {project.roots.length}
                </span>
              </span>
            )}
          </div>
          {project.roots.length > 0 && (
            <p className="text-xs text-zinc-500 dark:text-neutral-400 truncate leading-[normal]">
              {project.roots[0].name}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500 dark:text-zinc-400 md:hidden">
            <span>{owner ?? "—"}</span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        <div className="hidden md:flex items-center flex-shrink-0 text-sm text-zinc-500 dark:text-zinc-400 mx-4 w-36 text-right">
          {owner ?? "—"}
          {isPublic && (
            <Globe size={16} className="text-gray-500 ml-2" title="Public" />
          )}
        </div>

        <div className="hidden md:flex flex-shrink-0 text-sm text-zinc-500 dark:text-zinc-400 w-36">
          {formattedDate}
        </div>

        <div className="flex-shrink-0 ml-2 w-[52px] flex justify-center">
          <ProjectItemDropdownMenu
            hasPermission={hasPermission}
            updateDocument={updateDocument}
            deleteDocument={deleteDocument}
            shareDocument={shareDocument}
            url={url}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white border dark:border-neutral-700 dark:bg-neutral-800  border-gray-200 transition-all cursor-pointer">
      <div className="flex justify-between items-start">
        <div className="w-full px-2 py-4">
          <div className="flex items-center  justify-between">
            <p className="text-sm capitalize font-medium text-foreground truncate">{project.name}</p>
            <ProjectItemDropdownMenu
              hasPermission={hasPermission}
              updateDocument={updateDocument}
              deleteDocument={deleteDocument}
              shareDocument={shareDocument}
              url={url}
            />
          </div>

          {project.roots.length > 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center">
              <span className="truncate">{project.roots[0].name}</span>
            </p>
          ) : (
            <p className="text-xs text-zinc-400 italic">Empty project</p>
          )}
        </div>
      </div>

      <div className="p-2 bg-zinc-50 dark:bg-neutral-700 flex rounded-t-sm items-center justify-between text-xs text-zinc-400 dark:text-zinc-400">
        {project.roots.length > 0 && (
          <span title="document count" className="bg-blue-100 dark:bg-zinc-800 dark:text-zinc-600 text-blue-400 border-1 border-blue-400  dark:border-zinc-600 px-1.5 py-0.5">
            {project.roots.length}
          </span>
        )}
        <div className="flex items-center gap-2">
          <span>{formattedDate}</span>
          {isPublic && <Globe size={14} />}
        </div>
      </div>
    </div>
  );
};

function ProjectItemDropdownMenu({
  hasPermission,
  updateDocument,
  deleteDocument,
  shareDocument,
  url,
}: {
  readonly hasPermission: boolean;
  readonly updateDocument: (e: React.MouseEvent) => void;
  readonly deleteDocument: (e: React.MouseEvent) => void;
  readonly shareDocument: (e: React.MouseEvent) => void;
  readonly url?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const handleOpenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  };

  const handleCloseClick = (
    e: React.MouseEvent,
    func: (e: React.MouseEvent) => void
  ) => {
    setOpen(false);
    func(e);
  };

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.preventDefault();
    if (url) {
      window.open(url, "_blank");
    }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="rounded-lg" onClick={handleOpenClick}>
          <MoreVertical size={16} className="text-zinc-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {hasPermission && (
          <>
            <DropdownMenuItem
              onClick={(e) => handleCloseClick(e, updateDocument)}
            >
              <PencilLine /> {t("common.rename")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => handleCloseClick(e, deleteDocument)}
            >
              <Trash2 /> {t("common.remove")}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={(e) => handleCloseClick(e, shareDocument)}>
          <Share2 size={16} /> {t("common.share")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenInNewTab}>
          <OpenInNewTab />
          {t("common.openinnewtab")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export default ProjectItem;
