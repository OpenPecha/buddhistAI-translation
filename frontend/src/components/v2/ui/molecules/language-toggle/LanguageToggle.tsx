import { Languages } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { i18n_languages } from "@/utils/Constants";
import { Language, setStoredLanguage } from "@/i18n/index";


export function LanguageToggle() {
    const { i18n } = useTranslation();
    const setLang = async (lng: Language) => {
        try {
            await i18n.changeLanguage(lng);
            setStoredLanguage(lng);
        } catch (error) {
            console.error("Failed to change language:", error);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Languages className="h-[1.2rem] w-[1.2rem]" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {i18n_languages.map((language) => (
                    <DropdownMenuItem
                        key={language.code}
                        onClick={() => setLang(language.code as Language)}
                    >
                        {language.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
