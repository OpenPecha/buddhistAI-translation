import { useState } from "react";
import DocumentCreateModal from "./DocumentCreateModal/DocumentCreateModal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ArrowUpDownIcon } from "lucide-react";
import PublicProjects from "./PublicProjects";
import { useSearchParams } from "react-router-dom";
import ProjectsListSection from "./Components/project-list/ProjectList";

const Dashboard = () => {
  const [showGalleryButton, setShowGalleryButton] = useState(false);
  const { t } = useTranslation();
  const [param, setParam] = useSearchParams();
  const ftv = param.get("ftv");

  const handleViewAllPublicProjects = () => {
    if (ftv)
      setParam((prev) => {
        prev.delete("ftv");
        return prev;
      });
    else setParam((prev) => ({ ...prev, ftv: "1" }));
  };

  return (
    <div className="flex flex-1 flex-col h-[100vh] overflow-y-scroll">
      <div className="p-10 bg-neutral-400/10 mx-auto border w-full">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center p-2 justify-between">
            <div className="flex items-left flex-col">
              <h1 className="text-lg font-medium ">
                {t(`projects.startNewProject`)}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("project.startFromScratch")}
              </p>
            </div>
            {showGalleryButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewAllPublicProjects}
              >
                {t(`project.gallery`)} <ArrowUpDownIcon size={16} />
              </Button>
            )}
          </div>
          <div className="space-y-2 w-full">
            <DocumentCreateModal />
            <PublicProjects
              showAll={!!ftv}
              setShowGalleryButton={setShowGalleryButton}
            />
          </div>
        </div>
      </div>
      {!ftv && <ProjectsListSection />}
    </div>
  );
};

export default Dashboard;
