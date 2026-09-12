const endpoint =
	process.env.GRAPHQL_URL ||
	process.env.VITE_GRAPHQL_ENDPOINT ||
	process.env.HOUDINI_GRAPHQL_ENDPOINT ||
	'http://localhost:8000/graphql';

const accessToken = process.env.ACCESS_TOKEN || process.env.HOUDINI_ACCESS_TOKEN;

const query = `
query GetDashboardStats {
  counts: dashboardStats {
    concepts
    languages
    dictionaries
  }
}
`;

async function run() {
	console.log(`[check] GraphQL endpoint: ${endpoint}`);

	const headers = { 'Content-Type': 'application/json' };
	if (accessToken) {
		headers.Authorization = `Bearer ${accessToken}`;
	}

	const response = await fetch(endpoint, {
		method: 'POST',
		headers,
		body: JSON.stringify({ query })
	});

	const json = await response.json();

	if (json.errors) {
		console.error('[check] GraphQL errors:', JSON.stringify(json.errors, null, 2));
		process.exitCode = 1;
		return;
	}

	const counts = json.data?.counts ?? { concepts: 0, languages: 0, dictionaries: 0 };
	console.log('[check] Aggregated counts:', counts);
}

run().catch((error) => {
	console.error('[check] Request failed:', error);
	process.exitCode = 1;
});
