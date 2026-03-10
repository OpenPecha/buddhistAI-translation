export const LARGEDOCUMENT_SIZE = 900000; //sync with backend utils.js largeContentCharacterLength
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
export const MAX_FILE_SIZE_MB = 2; // 2MB for display purposes
export const MAX_TEMPLATES = 4;
type LanguageType = {
	code: string;
	name: string;
	colorcode?: string;
};

export const languages: LanguageType[] = [
	{
		code: "bo",
		name: "Tibetan",
		colorcode: "#8B0000",
	},
	{
		code: "en",
		name: "English",
		colorcode: "#1E3A8A",
	},
	{
		code: "hi",
		name: "Hindi",
		colorcode: "#FF9933",
	},
	{
		code: "it",
		name: "Italian",
		colorcode: "#008C45",
	},
	{
		code: "lzh",
		name: "Literal Chinese",
		colorcode: "#6B21A8",
	},
	{
		code: "ru",
		name: "Russian",
		colorcode: "#0039A6",
	},
	{
		code: "sa",
		name: "Sanskrit",
		colorcode: "#FFD700",
	},
	{
		code: "zh",
		name: "Chinese",
		colorcode: "#DE2910",
	},
];

export const i18n_languages: LanguageType[] = [
	{
		code: "bo",
		name: "བོད་ཡིག",
	},
	{
		code: "en",
		name: "English",
	},
	{
		code: "zh",
		name: "中文",
	},
];
