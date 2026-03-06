import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateTranslationModal from "./CreateTranslationModal";
import { useParams } from "react-router-dom";
import { useCurrentDocTranslations } from "@/hooks/useCurrentDoc";

// Import components
import TranslationList from "./components/TranslationList";
import { useTranslation } from "react-i18next";

function SelectTranslation() {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const { t } = useTranslation();
	const { id } = useParams();
	const rootId = id as string;
	// URL params hook is used in child components
	const { translations, refetchTranslations } =
		useCurrentDocTranslations(rootId);

	return (
		<div className="space-y-2">
			<div className="flex justify-between items-center">
				<p className="font-medium  text-neutral-800 dark:text-neutral-100">
					{t("translation.translations")}
				</p>
				<Button
					variant="outline"
					onClick={() => setShowCreateModal(true)}
					size="sm"
				>
					<Plus className="h-4 w-4" />
				</Button>
			</div>
			<div className="flex flex-col">
				<TranslationList translations={translations} />
			</div>
			{showCreateModal && (
				<CreateTranslationModal
					rootId={rootId}
					onClose={() => setShowCreateModal(false)}
					refetchTranslations={refetchTranslations}
				/>
			)}
		</div>
	);
}

export default SelectTranslation;
