<script lang="ts">
	import { useAuth } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import AccountSettingsForm from '$stylist/user/component/organism/account-settings-form/index.svelte';
	import type { AccountSettings } from '$stylist/user/type/object/account-settings';
	import AppHeader from '$stylist/navigation/component/organism/app-header/index.svelte';

	const auth = useAuth();

	let { data }: { data: { role: string } } = $props();
	const role = $derived(data.role);
	const userDisplayName = $derived(
		[
			auth.user?.profile?.firstName,
			auth.user?.profile?.lastName
		].filter(Boolean).join(' ') ||
			auth.user?.username ||
			auth.user?.email ||
			''
	);

	onMount(() => {
		if (!auth.isAuthenticated) {
			goto('/login');
		} else if (auth.roles.length > 0 && !auth.roles.some((r) => r.name === role)) {
			goto(`/${auth.roles[0]?.name ?? 'user'}`);
		}
	});

	function handleSaveSettings(settings: AccountSettings) {
		// TODO: реализовать через auth.updateProfile
		console.log('Saving settings:', settings);
	}
</script>

<div class="c-settings">
	<AppHeader
		brand="vibe-management.pro"
		navLinks={[
			{ href: `/${role}`, label: 'Dashboard' },
			{ href: `/${role}/settings`, label: 'Settings', active: true }
		]}
	>
		{#snippet trailing()}
			{#if auth.user}
				<span class="c-settings__username">Welcome, {userDisplayName}</span>
			{/if}
			<button
				class="c-settings__logout"
				onclick={() => {
					auth.logout();
					goto('/');
				}}
			>
				Logout
			</button>
		{/snippet}
	</AppHeader>

	<main class="c-settings__main">
		<div class="c-settings__card">
			<h2 class="c-settings__title">Account Settings</h2>
			<AccountSettingsForm
				name={userDisplayName}
				email={auth.user?.email}
				onSubmit={handleSaveSettings}
			/>
		</div>
	</main>
</div>

<style>
	.c-settings {
		min-height: 100vh;
		background: var(--color-background-secondary, #f9fafb);
	}
	.c-settings__username {
		font-size: 0.875rem;
		color: var(--color-text-secondary, #6b7280);
	}
	.c-settings__logout {
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-inverse, #fff);
		background: var(--color-error, #ef4444);
		border: none;
		border-radius: var(--radius-md, 0.375rem);
		cursor: pointer;
	}
	.c-settings__logout:hover {
		background: #dc2626;
	}
	.c-settings__main {
		max-width: 56rem;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}
	.c-settings__card {
		background: var(--color-background-primary, #fff);
		border-radius: var(--radius-lg, 0.75rem);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
		padding: 1.5rem;
	}
	.c-settings__title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text-primary, #111827);
		margin: 0 0 1.5rem;
	}
</style>

