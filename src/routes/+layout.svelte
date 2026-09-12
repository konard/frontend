<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { setClientSession, setClientStarted } from '$houdini';
	import { notificationStore } from '$lib/stores/notification.store.svelte';
	import { initializeErrorNotifications } from '$lib/errors/integrations';
	import { languageStore } from '$lib/stores/languageStore.svelte';
	import { onMount } from 'svelte';
	import { useAuth } from '$lib/auth';
	import ToastStack from '$stylist/notification/component/molecule/toast-stack/index.svelte';
	import ThemeModeToggle from '$stylist/theme/component/atom/theme-mode-toggle/index.svelte';
	import AppHeader from '$stylist/navigation/component/organism/app-header/index.svelte';

	let { children } = $props();
	const auth = useAuth();

	$effect(() => {
		setClientStarted();
		setClientSession(($page?.data ?? {}) as App.Session);
	});

	onMount(() => {
		const unsubscribe = initializeErrorNotifications();
		languageStore.init();
		return () => {
			unsubscribe?.();
		};
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
</svelte:head>

{#if !auth.isAuthenticated}
	<AppHeader brand="vibe-management.pro" brandHref="/">
		{#snippet trailing()}
			<ThemeModeToggle class="c-app-header__theme-toggle" />
			<a href="/login" class="c-app-header__link">Sign In</a>
			<a href="/register" class="c-app-header__link c-app-header__link--primary">Sign Up</a>
		{/snippet}
	</AppHeader>
{/if}

<div class="c-app-shell">
	{@render children?.()}
</div>

<ToastStack
	toasts={notificationStore.items}
	position="bottom-right"
	onDismissAll={() => notificationStore.dismissAll()}
/>

<style>
	:global(.c-app-header__link) {
		color: var(--color-text-secondary, #6b7280);
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md, 0.375rem);
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
		transition: color 0.15s;
	}
	:global(.c-app-header__link:hover) {
		color: var(--color-primary-600, #4f46e5);
	}
	:global(.c-app-header__link--primary) {
		background: var(--color-primary-600, #4f46e5);
		color: var(--color-text-inverse, #fff);
	}
	:global(.c-app-header__link--primary:hover) {
		background: var(--color-primary-700, #4338ca);
		color: var(--color-text-inverse, #fff);
	}
	:global(.c-app-header__theme-toggle) {
		min-width: 2.25rem;
		min-height: 2.25rem;
		padding: 0.5rem;
	}
	.c-app-shell {
		min-height: 100vh;
		background: var(--color-background-secondary, #f9fafb);
	}
</style>
