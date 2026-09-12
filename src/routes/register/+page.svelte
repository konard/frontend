<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { useAuth } from '$lib/auth';
	import RegisterPage from '$stylist/auth/component/organism/register-page/index.svelte';
	import type { RegistrationData } from '$stylist/auth/type/object/registration-data';

	const auth = useAuth();

	function getRoleRedirect() {
		return `/${auth.roles[0]?.name ?? 'user'}`;
	}

	onMount(() => {
		if (auth.isAuthenticated) goto(getRoleRedirect());
	});

	async function handleRegister(data: RegistrationData) {
		await auth.register({
			username: data.username,
			email: data.email,
			password: data.password
		});
		if (auth.isAuthenticated) goto(getRoleRedirect());
	}
</script>

<RegisterPage
	formState={{ isLoading: auth.isLoading, error: auth.error ?? undefined }}
	onSubmit={handleRegister}
	loginHref="/login"
/>

