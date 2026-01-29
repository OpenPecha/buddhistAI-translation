import { Input } from "@/components/ui/input";
import { ChangeEvent, useEffect, useState, memo } from "react";
import useDebounce from "@/hooks/useDebounce";
import { useSearchStore } from "@/stores/searchStore";
import { useTranslation } from "react-i18next";

const SearchInput = () => {
  const { searchQuery, setSearchQuery } = useSearchStore();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState<string>(searchQuery || "");
  const debouncedValue = useDebounce(inputValue?.toLowerCase(), 1000);
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setInputValue(event.target.value);
  };

  useEffect(() => {
    setSearchQuery(debouncedValue || "");
  }, [debouncedValue, setSearchQuery]);
  return (
    <div className="flex-grow max-w-xl">
      <Input
        type="search"
        placeholder={t("documents.searchDocuments")}
        value={inputValue}
        onChange={handleInputChange}
        aria-label={t("documents.searchDocuments")}
      />
    </div>
  );
};

export default memo(SearchInput);
