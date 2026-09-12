/**
 * i18n Utilities
 * Функции для работы с многоязычными переводами UI
 */

/**
 * Тип для словаря переводов (ключ -> значение)
 */
const I18N_DEBUG_STORAGE_KEY = 'multipult:i18n-debug';

function envFlagEnabled(): boolean {
	const rawFlag = import.meta.env?.VITE_DEBUG_I18N;
	if (typeof rawFlag === 'string') {
		return rawFlag.toLowerCase() === 'true';
	}

	if (typeof rawFlag === 'boolean') {
		return rawFlag;
	}

	return false;
}

export function isI18nDebugEnabled(): boolean {
	if (import.meta.env?.DEV) {
		return true;
	}

	if (envFlagEnabled()) {
		return true;
	}

	if (typeof window !== 'undefined') {
		const stored = window.localStorage?.getItem(I18N_DEBUG_STORAGE_KEY);
		return stored === '1' || stored === 'true';
	}

	return false;
}

function logDebug(...args: unknown[]) {
	if (isI18nDebugEnabled()) {
		console.debug('[i18n]', ...args);
	}
}

export function setI18nDebugEnabled(value: boolean): void {
	if (typeof window !== 'undefined') {
		window.localStorage?.setItem(I18N_DEBUG_STORAGE_KEY, value ? '1' : '0');
	}
}

export type TranslationsMap = Record<string, string>;

/**
 * Тип для Dictionary записи из GraphQL
 */
export interface DictionaryEntry {
	concept: {
		path: string;
	};
	name: string;
}

/**
 * Преобразовать массив Dictionary записей в Map объект
 *
 * @param dictionaries - Массив словарных записей из GraphQL
 * @returns Объект с ключами вида "ui/nav/dashboard" и значениями переводов
 *
 * @example
 * const dictionaries = [
 *   { concept: { path: "ui/nav/dashboard" }, name: "Dashboard" },
 *   { concept: { path: "ui/button/login" }, name: "Login" }
 * ];
 * const map = dictionariesToMap(dictionaries);
 * // => { "ui/nav/dashboard": "Dashboard", "ui/button/login": "Login" }
 */
export function dictionariesToMap(dictionaries: DictionaryEntry[]): TranslationsMap {
	logDebug('Processing', dictionaries.length, 'dictionaries');

	const result = dictionaries.reduce((acc, dict) => {
		// Check if dict.concept and dict.concept.path exist before accessing
		if (dict?.concept?.path) {
			acc[dict.concept.path] = dict.name;
		} else {
			logDebug('Dictionary entry missing concept.path:', dict);
		}
		return acc;
	}, {} as TranslationsMap);

	logDebug('Result keys count:', Object.keys(result).length);
	return result;
}

/**
 * Получить перевод по ключу
 *
 * @param translations - Объект с переводами
 * @param key - Ключ перевода (например, "ui/nav/dashboard")
 * @param fallback - Значение по умолчанию, если перевод не найден
 * @returns Переведенный текст или fallback
 *
 * @example
 * const translations = { "ui/nav/dashboard": "Dashboard" };
 * t(translations, "ui/nav/dashboard", "Default"); // => "Dashboard"
 * t(translations, "ui/nav/missing", "Default");   // => "Default"
 * t(translations, "ui/nav/missing");              // => "ui/nav/missing"
 */
export function t(
	translations: TranslationsMap,
	key: string,
	fallback?: string
): string {
	return translations[key] || fallback || key;
}

/**
 * Получить перевод с интерполяцией параметров (расширенная версия)
 *
 * @param translations - Объект с переводами
 * @param key - Ключ перевода
 * @param params - Объект с параметрами для подстановки
 * @param fallback - Значение по умолчанию
 * @returns Переведенный текст с подставленными параметрами
 *
 * @example
 * const translations = { "ui/greeting": "Hello, {name}!" };
 * tParams(translations, "ui/greeting", { name: "John" }); // => "Hello, John!"
 */
export function tParams(
	translations: TranslationsMap,
	key: string,
	params: Record<string, string | number>,
	fallback?: string
): string {
	let text = t(translations, key, fallback);

	// Заменить все {param} на значения из объекта params
	Object.entries(params).forEach(([paramKey, paramValue]) => {
		text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
	});

	return text;
}

/**
 * Проверить наличие перевода
 *
 * @param translations - Объект с переводами
 * @param key - Ключ перевода
 * @returns true если перевод существует
 */
export function hasTranslation(translations: TranslationsMap, key: string): boolean {
	return key in translations;
}

/**
 * Получить все переводы для определенного префикса
 *
 * @param translations - Объект с переводами
 * @param prefix - Префикс для фильтрации (например, "ui/nav")
 * @returns Отфильтрованный объект с переводами
 *
 * @example
 * const translations = {
 *   "ui/nav/dashboard": "Dashboard",
 *   "ui/nav/concepts": "Concepts",
 *   "ui/button/save": "Save"
 * };
 * getTranslationsByPrefix(translations, "ui/nav");
 * // => { "ui/nav/dashboard": "Dashboard", "ui/nav/concepts": "Concepts" }
 */
export function getTranslationsByPrefix(
	translations: TranslationsMap,
	prefix: string
): TranslationsMap {
	return Object.entries(translations)
		.filter(([key]) => key.startsWith(prefix))
		.reduce((acc, [key, value]) => {
			acc[key] = value;
			return acc;
		}, {} as TranslationsMap);
}

/**
 * Объединить несколько объектов переводов
 *
 * @param translationArrays - Массив объектов с переводами
 * @returns Объединенный объект переводов (позднее значение перезаписывает раннее)
 *
 * @example
 * const nav = { "ui/nav/dashboard": "Dashboard" };
 * const buttons = { "ui/button/save": "Save" };
 * mergeTranslations(nav, buttons);
 * // => { "ui/nav/dashboard": "Dashboard", "ui/button/save": "Save" }
 */
export function mergeTranslations(...translationArrays: TranslationsMap[]): TranslationsMap {
	return translationArrays.reduce((acc, translations) => {
		return { ...acc, ...translations };
	}, {} as TranslationsMap);
}

/**
 * Отладочная функция - логирует отсутствующие переводы
 * Полезна для development режима
 *
 * @param translations - Объект с переводами
 * @param requiredKeys - Массив ключей, которые должны быть
 * @returns Массив отсутствующих ключей
 */
export function findMissingTranslations(
	translations: TranslationsMap,
	requiredKeys: string[]
): string[] {
	return requiredKeys.filter(key => !hasTranslation(translations, key));
}

/**
 * Создать namespace-функцию для удобной работы с переводами
 *
 * @param translations - Объект с переводами
 * @param namespace - Namespace префикс (например, "ui/nav")
 * @returns Функция перевода с автоматическим префиксом
 *
 * @example
 * const translations = { "ui/nav/dashboard": "Dashboard" };
 * const navT = createNamespaceT(translations, "ui/nav");
 * navT("dashboard"); // => "Dashboard" (автоматически добавляет "ui/nav/")
 */
export function createNamespaceT(
	translations: TranslationsMap,
	namespace: string
): (key: string, fallback?: string) => string {
	return (key: string, fallback?: string) => {
		const fullKey = namespace ? `${namespace}/${key}` : key;
		return t(translations, fullKey, fallback);
	};
}
