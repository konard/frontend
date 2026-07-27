import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// SSR-only: сервис недоступен из браузера, доступен только внутри Docker-сети.
const WHISPER_GATEWAY_URL = process.env.WHISPER_GATEWAY_URL || 'http://gateway-whisper:8010';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file');

	if (!(file instanceof File)) {
		throw error(400, 'Missing audio file');
	}

	const upstreamForm = new FormData();
	upstreamForm.set('file', file, file.name);

	const language = formData.get('language');
	if (typeof language === 'string') {
		upstreamForm.set('language', language);
	}

	const response = await fetch(`${WHISPER_GATEWAY_URL}/transcribe`, {
		method: 'POST',
		body: upstreamForm
	});

	const payload = await response.json();
	if (!response.ok) {
		throw error(response.status, payload.error ?? 'Transcription failed');
	}

	return json(payload);
};
