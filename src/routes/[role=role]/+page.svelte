<script lang="ts">
	import { useAuth } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import AuthGuard from '$stylist/auth/component/organism/auth-guard/index.svelte';
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
</script>

<AuthGuard
	isAuthenticated={auth.isAuthenticated}
	userRoles={auth.roles.map((r) => r.name)}
	requiredRole={role}
	redirectUrl="/login"
>
	<div class="c-dashboard">
		<AppHeader
			brand="vibe-management.pro"
			navLinks={[
				{ href: `/${role}`, label: 'Dashboard', active: true },
				{ href: `/${role}/settings`, label: 'Settings' }
			]}
		>
			{#snippet trailing()}
				{#if auth.user}
					<span class="c-dashboard__username">Welcome, {userDisplayName}</span>
				{/if}
				<button
					class="c-dashboard__logout"
					onclick={() => {
						auth.logout();
						goto('/');
					}}
				>
					Logout
				</button>
			{/snippet}
		</AppHeader>

		<main class="c-dashboard__main">
			<div class="c-dashboard__card">
				{#if role === 'admin'}
					<h2 class="c-dashboard__title">Administrator Dashboard</h2>
					<p class="c-dashboard__desc">
						You have administrative privileges. Manage users, settings, and system configurations.
					</p>
					<div class="c-dashboard__sections">
						<section class="c-dashboard__section">
							<h3 class="c-dashboard__section-title">User Management</h3>
							<p class="c-dashboard__section-desc">Manage all users in the system</p>
							<button class="c-dashboard__btn">View Users</button>
						</section>
						<section class="c-dashboard__section">
							<h3 class="c-dashboard__section-title">System Settings</h3>
							<p class="c-dashboard__section-desc">Configure system-wide settings</p>
							<button class="c-dashboard__btn">Manage Settings</button>
						</section>
						<section class="c-dashboard__section">
							<h3 class="c-dashboard__section-title">Analytics</h3>
							<p class="c-dashboard__section-desc">View system analytics and reports</p>
							<button class="c-dashboard__btn">View Reports</button>
						</section>
					</div>
				{:else if role === 'architect'}
					<h2 class="c-dashboard__title">Architect Dashboard</h2>
					<p class="c-dashboard__desc">
						Explore the database schema and system architecture.
					</p>
					<div class="c-dashboard__sections">
						<section class="c-dashboard__section">
							<h3 class="c-dashboard__section-title">ER Diagram</h3>
							<p class="c-dashboard__section-desc">View the database entity-relationship schema</p>
							<a href="/architect" class="c-dashboard__btn">Open Schema</a>
						</section>
					</div>
				{:else}
					<h2 class="c-dashboard__title">User Dashboard</h2>
					<p class="c-dashboard__desc">
						Welcome to your personal workspace. Manage your content and preferences.
					</p>
					<div class="c-dashboard__grid">
						<section class="c-dashboard__section">
							<h3 class="c-dashboard__section-title">My Profile</h3>
							<p class="c-dashboard__section-desc">Manage your personal information</p>
							<button class="c-dashboard__btn">Edit Profile</button>
						</section>
						<section class="c-dashboard__section">
							<h3 class="c-dashboard__section-title">Content Management</h3>
							<p class="c-dashboard__section-desc">Manage your content items</p>
							<button class="c-dashboard__btn">View Content</button>
						</section>
						<section class="c-dashboard__section c-dashboard__section--wide">
							<h3 class="c-dashboard__section-title">Preferences</h3>
							<p class="c-dashboard__section-desc">Customize your experience</p>
							<button class="c-dashboard__btn">Manage Preferences</button>
						</section>
					</div>
				{/if}
			</div>
		</main>
	</div>
</AuthGuard>

<style>
	.c-dashboard {
		min-height: 100vh;
		background: var(--color-background-secondary, #f9fafb);
	}
	.c-dashboard__username {
		font-size: 0.875rem;
		color: var(--color-text-secondary, #6b7280);
	}
	.c-dashboard__logout {
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-inverse, #fff);
		background: var(--color-error, #ef4444);
		border: none;
		border-radius: var(--radius-md, 0.375rem);
		cursor: pointer;
	}
	.c-dashboard__logout:hover {
		background: #dc2626;
	}
	.c-dashboard__main {
		max-width: 80rem;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}
	.c-dashboard__card {
		background: var(--color-background-primary, #fff);
		border-radius: var(--radius-lg, 0.75rem);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
		padding: 1.5rem;
	}
	.c-dashboard__title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text-primary, #111827);
		margin: 0 0 0.5rem;
	}
	.c-dashboard__desc {
		color: var(--color-text-secondary, #6b7280);
		margin: 0 0 1.5rem;
	}
	.c-dashboard__sections {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.c-dashboard__grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}
	.c-dashboard__section {
		border: 1px solid var(--color-border-primary, #e5e7eb);
		border-radius: var(--radius-md, 0.5rem);
		padding: 1rem;
	}
	.c-dashboard__section--wide {
		grid-column: span 2;
	}
	.c-dashboard__section-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text-primary, #111827);
		margin: 0 0 0.5rem;
	}
	.c-dashboard__section-desc {
		font-size: 0.875rem;
		color: var(--color-text-secondary, #6b7280);
		margin: 0 0 1rem;
	}
	.c-dashboard__btn {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: var(--color-primary-600, #4f46e5);
		color: var(--color-text-inverse, #fff);
		border: none;
		border-radius: var(--radius-md, 0.375rem);
		font-size: 0.875rem;
		text-decoration: none;
		cursor: pointer;
	}
	.c-dashboard__btn:hover {
		background: var(--color-primary-700, #4338ca);
	}
</style>

