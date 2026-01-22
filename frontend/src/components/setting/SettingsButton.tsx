import React from "react";
import SettingsModal from "./SettingsModal";
import { useTranslationSidebarParams } from "@/hooks/useQueryParams";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GrSettingsOption } from "react-icons/gr";
const SettingsButton: React.FC = () => {
  const { selectedTranslationId } = useTranslationSidebarParams();
  const { id } = useParams();
  return (
    <SettingsModal
      rootId={id}
      translationId={selectedTranslationId || undefined}
    >
      <Button
        variant="secondary"
      >
        <GrSettingsOption size={14} />
      </Button>
    </SettingsModal>
  );
};

export default SettingsButton;
