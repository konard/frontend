import { languageStore } from '$lib/stores/languageStore.svelte';
import { dictionariesToMap, isI18nDebugEnabled } from '$lib/utils/i18n';
import type { LayoutLoad } from './$types';
import { GetUITranslationsStore } from '$houdini';
import { browser } from '$app/environment';

/**
 * In-memory cache для переводов
 * Key: languageId, Value: translations object
 */
const translationsCache = browser ? new Map<number, Record<string, string>>() : undefined;
const SESSION_CACHE_PREFIX = 'multipult:translations:';

const debugLog = (...args: unknown[]) => {
	if (isI18nDebugEnabled()) {
		console.debug('[i18n:layout]', ...args);
	}
};

const makeSessionKey = (languageId: number) => `${SESSION_CACHE_PREFIX}${languageId}`;

function readSessionCache(languageId: number): Record<string, string> | null {
	if (!browser) {
		return null;
	}

	try {
		const stored = sessionStorage.getItem(makeSessionKey(languageId));
		if (!stored) {
			return null;
		}

		const parsed = JSON.parse(stored) as Record<string, string>;
		return Object.keys(parsed).length > 0 ? parsed : null;
	} catch (error) {
		debugLog('failed to read session cache', error);
		return null;
	}
}

function persistTranslations(languageId: number, translations: Record<string, string>) {
	if (Object.keys(translations).length === 0) {
		return;
	}

	translationsCache?.set(languageId, translations);

	if (browser) {
		try {
			sessionStorage.setItem(makeSessionKey(languageId), JSON.stringify(translations));
		} catch (error) {
			debugLog('failed to persist translations in sessionStorage', error);
		}
	}
}

function getCachedTranslations(languageId: number): Record<string, string> | null {
	const inMemory = translationsCache?.get(languageId);
	if (inMemory && Object.keys(inMemory).length > 0) {
		return inMemory;
	}

	const fromSession = readSessionCache(languageId);
	if (fromSession) {
		translationsCache?.set(languageId, fromSession);
		return fromSession;
	}

	return null;
}

/**
 * Layout Load Function
 * Загружает все UI-переводы для текущего выбранного языка
 * Переводы будут доступны во всех дочерних страницах через $page.data.translations
 *
 * Использует in-memory кэш для быстрого переключения языков
 */
export const load: LayoutLoad = async (event) => {
	// Указать зависимость от language_id - это заставит SvelteKit перезапускать load при invalidate
	event.depends('app:language');

	// Получить текущий выбранный язык (или fallback на Русский = 1)
	const languageId = languageStore.currentLanguageId || 1;

	debugLog('load invoked', { languageId, browser });

	// Проверить кэш
	const cached = getCachedTranslations(languageId);
	if (cached) {
		debugLog('using cached translations', { languageId, keys: Object.keys(cached).length });
		return {
			translations: cached,
			languageId
		};
	}

	// Кэша нет - загрузить с сервера
	debugLog('loading translations from server', { languageId });
	const store = new GetUITranslationsStore();

	const result = await store.fetch({
		event,
		variables: {
			languageId
		}
	});

	// Преобразовать массив Dictionary в Map объект
	const translationsArray = result.data?.dictionaries || [];
	const translations = dictionariesToMap(translationsArray);

	// Если переводов нет, загрузить fallback (English = 2)
	if (Object.keys(translations).length === 0 && languageId !== 2) {
		debugLog('no translations found, attempting fallback', { languageId });

		const fallbackCached = getCachedTranslations(2);
		if (fallbackCached) {
			debugLog('using cached fallback', { fallbackLanguageId: 2, keys: Object.keys(fallbackCached).length });
			return {
				translations: fallbackCached,
				languageId,
				fallbackLanguageId: 2
			};
		}

		const fallbackResult = await store.fetch({
			event,
			variables: {
				languageId: 2
			}
		});

		const fallbackArray = fallbackResult.data?.dictionaries || [];
		const fallbackTranslations = dictionariesToMap(fallbackArray);
		persistTranslations(2, fallbackTranslations);
		persistTranslations(languageId, fallbackTranslations);
		debugLog('fallback loaded from server', {
			fallbackLanguageId: 2,
			keys: Object.keys(fallbackTranslations).length
		});

		return {
			translations: fallbackTranslations,
			languageId,
			fallbackLanguageId: 2
		};
	}

	// Сохранить в кэш
	persistTranslations(languageId, translations);

	return {
		translations,
		languageId
	};
};
