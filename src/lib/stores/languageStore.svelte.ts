/**
 * Language Store - управление текущим выбранным языком
 * Использует Svelte 5 Runes для reactivity
 * Автоматически сохраняет выбор в localStorage
 */

import { isI18nDebugEnabled } from '$lib/utils/i18n';

const STORAGE_KEY = 'vibe_management_pro_selected_language_id';
const debugLog = (...args: unknown[]) => {
	if (isI18nDebugEnabled()) {
		console.debug('[languageStore]', ...args);
	}
};

class LanguageStore {
	// По умолчанию русский язык (id=1)
	private _currentLanguageId = $state<number | null>(1);

	/**
	 * Получить ID текущего выбранного языка
	 * null означает "все языки"
	 */
	get currentLanguageId(): number | null {
		return this._currentLanguageId;
	}

	/**
	 * Установить текущий язык
	 * @param languageId - ID языка или null для "все языки"
	 */
	async setLanguage(languageId: number | null): Promise<void> {
		debugLog('setLanguage called', { languageId, current: this._currentLanguageId });

		this._currentLanguageId = languageId;

		debugLog('state updated', { current: this._currentLanguageId });

		// Сохранить в localStorage
		if (typeof window !== 'undefined') {
			if (languageId !== null) {
				localStorage.setItem(STORAGE_KEY, languageId.toString());
			} else {
				localStorage.removeItem(STORAGE_KEY);
			}

			debugLog('invalidating dependent loads', { target: 'app:language', languageId });

			// Перезагрузить все load functions для обновления UI
			// Это вызовет +layout.ts, который подхватит переводы из кэша
			try {
				const { invalidate } = await import('$app/navigation');
				// Use the language dependency key instead of global invalidateAll
				await invalidate('app:language');
				debugLog('invalidate complete', { languageId });
			} catch (error) {
				debugLog('failed to invalidate app:language', error);
			}
		}
	}

	/**
	 * Инициализировать store из localStorage
	 * Вызывается при загрузке приложения
	 */
	init(): void {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = parseInt(saved, 10);
				if (!isNaN(parsed) && parsed !== this._currentLanguageId) {
					this._currentLanguageId = parsed;

					// Defer language application to next tick to avoid interfering with initial navigation lifecycle
					setTimeout(() => {
						void this.setLanguage(parsed);
					}, 0);
				}
			}
		}
	}

	/**
	 * Сбросить выбор языка (показать все)
	 */
	reset(): void {
		void this.setLanguage(null);
	}
}

// Singleton instance
export const languageStore = new LanguageStore();
