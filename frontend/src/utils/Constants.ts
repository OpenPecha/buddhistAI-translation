export const LARGEDOCUMENT_SIZE = 900000; //sync with backend utils.js largeContentCharacterLength
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
export const MAX_FILE_SIZE_MB = 2; // 2MB for display purposes
export const MAX_TEMPLATES = 4;
type LanguageType = {
	code: string;
	name: string;
	flag?: string;
};

export const languages: LanguageType[] = [
	{
		code: "bo",
		name: "Tibetan",
		flag: "🏔️",
	},
	{
		code: "en",
		name: "English",
		flag: "🇺🇸",
	},
	{
		code: "hi",
		name: "Hindi",
		flag: "🇮🇳",
	},
	{
		code: "it",
		name: "Italian",
		flag: "🇮🇹",
	},
	{
		code: "lzh",
		name: "Literal Chinese",
		flag: "🇨🇳",
	},
	{
		code: "ru",
		name: "Russian",
		flag: "🇷🇺",
	},
	{
		code: "sa",
		name: "Sanskrit",
		flag: "🇮🇳",
	},
	{
		code: "zh",
		name: "Chinese",
		flag: "🇨🇳",
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
