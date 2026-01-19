import { Link } from "react-router-dom";
import OpenPecha from "@/assets/icon.png";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <div className=" p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          {t("common.poweredBy")}{" "}
          <a href="https://openpecha.org/">
            <img src={OpenPecha} alt="OpenPecha" className="w-6 h-6 inline" />{" "}
            OpenPecha
          </a>
        </p>
        <div className="flex items-center gap-2 ">
          <Button
            asChild
            variant="link"
            title={t("common.getHelpAndDocumentation")}
          >
            <Link to="/help">
              <span className="hidden sm:inline text-neutral-400">{t("common.help")}</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="link"
            title={t("common.getHelpAndDocumentation")}
          >
            <Link to="https://buddhistai.tools" target="_blank" rel="noopener noreferrer">
              <span className="hidden sm:inline text-neutral-400">Buddhistai Tools</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
