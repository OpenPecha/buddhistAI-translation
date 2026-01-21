import React, { useState } from "react";
import { Project } from "@/api/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface EditProjectModalProps {
	open: boolean;
	project: Project;
	onOpenChange: (open: boolean) => void;
	onUpdate: (name: string, identifier: string) => Promise<void>;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({
	open,
	project,
	onOpenChange,
	onUpdate,
}) => {
	const { t } = useTranslation();
	const [name, setName] = useState(project.name);
	const [isUpdating, setIsUpdating] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsUpdating(true);

		try {
			await onUpdate(name, project.identifier);
		} catch (error) {
			console.error("Error updating project:", error);
		} finally {
			setIsUpdating(false);
		}
	};

	const disable = isUpdating || name.trim() === "" || name === project.name;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md rounded">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>{t("projects.rename")}</DialogTitle>
					</DialogHeader>
					<DialogDescription>
						{t("projects.enterProjectName")}
					</DialogDescription>
					<div className="py-2">
						<Input
							id="name"
							type="text"
							className="rounded-none"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							autoFocus
						/>
					</div>

					<DialogFooter className="gap-2 sm:gap-3">
						<Button
							type="button"
							variant="secondary"
							onClick={() => onOpenChange(false)}
							disabled={isUpdating}
						>
							{t("common.cancel")}
						</Button>

						<Button type="submit" variant="outline" disabled={disable}>
							{isUpdating ? t("common.updating") : t("common.update")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default EditProjectModal;
