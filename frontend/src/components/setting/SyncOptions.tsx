import { useTranslation } from "react-i18next";
import {
	useTableOfContentSyncStore,
	useTableOfContentOpenStore,
} from "@/stores/tableOfContentStore";

type SyncMode = "scroll" | "click" | "none" | "table";
type SyncType = "heading" | "lineNumber";

function SyncOptions({
	syncMode,
	setSyncMode,
}: {
	readonly syncMode: SyncMode;
	readonly setSyncMode: (mode: SyncMode) => void;
	readonly syncType: SyncType;
	readonly setSyncType: (type: SyncType) => void;
}) {
	const { setSynced } = useTableOfContentSyncStore();
	const { openAll } = useTableOfContentOpenStore();
	const { t } = useTranslation();
	const options = [
		{
			value: "none",
			label: t("settings.noSync", "No Sync"),
			description: t("settings.noSyncDescription", "No synchronization"),
		},
		{
			value: "scroll",
			label: t("settings.scrollSync", "Scroll Sync"),
			description: t(
				"settings.scrollSyncDescription",
				"Synchronize based on scrolling",
			),
		},
		{
			value: "click",
			label: t("settings.clickSync", "Click Sync"),
			description: t(
				"settings.clickSyncDescription",
				"Synchronize based on clicking",
			),
		},
		{
			value: "table",
			label: t("settings.tableSync", "Table Sync"),
			description: t(
				"settings.tableSyncDescription",
				"Synchronize based on table of contents",
			),
		},
	];

	const handleSyncModeChange = (mode: SyncMode) => {
		setSyncMode(mode);
		setSynced(mode === "table");
		if (mode === "table") {
			openAll();
		}
	};

	return (
		<div className="flex rounded-lg">
			<div className=" w-full items-center justify-between grid grid-cols-2 gap-2">
				{options.map((option) => (
					<label
						key={option.value}
						htmlFor={`sync-${option.value}`}
						aria-label={`${option.label}: ${option.description}`}
						className="flex items-center justify-center border space-x-3 cursor-pointer rounded-md p-2  hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors"
					>
						<input
							type="radio"
							id={`sync-${option.value}`}
							name="syncMode"
							value={option.value}
							checked={syncMode === option.value}
							onChange={() => handleSyncModeChange(option.value as SyncMode)}
							className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300"
						/>
						<div className="text-gray-900 dark:text-gray-100">
							{option.label}
						</div>
					</label>
				))}
			</div>
		</div>
	);
}

export default SyncOptions;
