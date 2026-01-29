import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => {
    const { t } = useTranslation();

    return (
        <div className="flex-1 max-w-md">
            <Input
                type="text"
                placeholder={t("project.searchPublicProjects", "Search public projects")}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};