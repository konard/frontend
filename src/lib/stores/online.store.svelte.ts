import { writable } from 'svelte/store';

function createOnlineStore() {
	const { subscribe, set } = writable<boolean>(true);

	if (typeof window !== 'undefined') {
		const setOnlineStatus = () => set(navigator.onLine);

		window.addEventListener('online', setOnlineStatus);
		window.addEventListener('offline', setOnlineStatus);

		// Initial check
		setOnlineStatus();
	}

	return {
		subscribe
	};
}

export const onlineStore = createOnlineStore();
