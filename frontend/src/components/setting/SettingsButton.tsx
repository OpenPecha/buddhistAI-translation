import React from "react";
import SettingsModal from "./SettingsModal";
import { useTranslationSidebarParams } from "@/hooks/useQueryParams";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
const SettingsButton: React.FC = () => {
  const { selectedTranslationId } = useTranslationSidebarParams();
  const { id } = useParams();
  return (
    <SettingsModal
      rootId={id}
      translationId={selectedTranslationId || undefined}
    >
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground"
      >
        <Settings size={16} />
      </Button>
    </SettingsModal>
  );
};

export default SettingsButton;
