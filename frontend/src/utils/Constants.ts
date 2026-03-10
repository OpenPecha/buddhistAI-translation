export const LARGEDOCUMENT_SIZE = 900000; //sync with backend utils.js largeContentCharacterLength
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
export const MAX_FILE_SIZE_MB = 2; // 2MB for display purposes
export const MAX_TEMPLATES = 4;
type LanguageType = {
	code: string;
	name: string;
};

export const languages: LanguageType[] = [
	{
		code: "bo",
		name: "Tibetan",
	},
	{
		code: "en",
		name: "English",
	},
	{
		code: "hi",
		name: "Hindi",
	},
	{
		code: "it",
		name: "Italian",
	},
	{
		code: "lzh",
		name: "Literal Chinese",
	},
	{
		code: "ru",
		name: "Russian",
	},
	{
		code: "sa",
		name: "Sanskrit",
	},
	{
		code: "zh",
		name: "Chinese",
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
