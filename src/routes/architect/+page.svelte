<script lang="ts">
	import { onMount } from 'svelte';
	import { useAuth } from '$lib/auth';
	import { graphqlClient } from '$lib/graphql-client';
	import AuthGuard from '$stylist/auth/component/organism/auth-guard/index.svelte';
	import Schema from '$stylist/erd/component/organism/schema/index.svelte';
	import { STORAGE_KEYS } from '$stylist/auth';

	const auth = useAuth();

	let schemaText = $state('');
	let isLoading = $state(true);
	let loadError = $state('');

	async function loadSchema() {
		isLoading = true;
		loadError = '';
		try {
			const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
			const result = await graphqlClient.query<{ erdSchema: string }>(
				`query GetErdSchema { erdSchema }`,
				undefined,
				token ?? undefined
			);
			schemaText = result.erdSchema;
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Failed to load schema';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadSchema();
	});
</script>

<svelte:head>
	<title>Database Architect - ER Diagram</title>
</svelte:head>

<AuthGuard
	isAuthenticated={auth.isAuthenticated}
	userRoles={auth.roles.map((r) => r.name)}
	allowedRoles={['admin', 'architect']}
	redirectUrl="/login"
>
	<div class="c-architect">
		{#if isLoading && !schemaText}
			<p class="c-architect__status">Loading schema…</p>
		{:else if loadError}
			<p class="c-architect__status c-architect__status--error">{loadError}</p>
		{:else}
			<Schema title="Database Architect" value={schemaText} />
		{/if}
	</div>
</AuthGuard>

<style>
	.c-architect {
		height: 100vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.c-architect__status {
		margin: auto;
		padding: 2rem;
		text-align: center;
		color: var(--color-text-secondary, #6b7280);
	}

	.c-architect__status--error {
		color: var(--color-danger-600, #dc2626);
	}
</style>
