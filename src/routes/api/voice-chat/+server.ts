import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// SSR-only: state-machine доступен только внутри Docker-сети.
const STATE_MACHINE_URL = process.env.STATE_MACHINE_URL || 'http://state-machine:8000/graphql';

const SEND_LOCAL_CHAT_MESSAGE = `
	mutation SendLocalChatMessage($text: String!, $systemMessage: String) {
		sendLocalChatMessage(text: $text, systemMessage: $systemMessage) {
			id
			status
			currentState
			context
		}
	}
`;

export const POST: RequestHandler = async ({ request }) => {
	const { text, systemMessage } = await request.json();

	if (typeof text !== 'string' || !text.trim()) {
		throw error(400, 'Missing text');
	}

	const response = await fetch(STATE_MACHINE_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			query: SEND_LOCAL_CHAT_MESSAGE,
			variables: { text, systemMessage: systemMessage ?? null }
		})
	});

	const payload = await response.json();
	if (!response.ok || payload.errors) {
		throw error(502, payload.errors?.[0]?.message ?? 'State machine request failed');
	}

	const task = payload.data.sendLocalChatMessage;
	console.info('[voice-chat] Response', {
		taskId: task.id,
		status: task.status,
		state: task.currentState,
		hasReply: Boolean(task.context?.reply)
	});

	return json({
		taskId: task.id,
		status: task.status,
		state: task.currentState,
		reply: task.context?.reply ?? null
	});
};
