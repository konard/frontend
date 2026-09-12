import { config, logger } from './config';

const GRAPHQL_URL = config.graphqlEndpoint;

export async function graphqlRequest<T = any>(query: string, variables?: any, accessToken?: string): Promise<T> {
	logger.log('GraphQL Request:', { query, variables });

	try {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json'
		};

		// Add authorization header if token is provided
		if (accessToken) {
			headers['Authorization'] = `Bearer ${accessToken}`;
		}

		// For SSR requests, add Origin header to satisfy CORS
		if (typeof window === 'undefined') {
			headers['Origin'] =
				process.env.FRONTEND_URL || process.env.VITE_APP_URL || 'http://localhost:5173';
		}

		const response = await fetch(GRAPHQL_URL, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				query,
				variables,
			}),
		});

		logger.log('GraphQL Response Status:', response.status);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const json = await response.json();
		logger.log('GraphQL Response Data:', json);

		if (json.errors) {
			logger.error('GraphQL Errors:', json.errors);
			throw new Error(json.errors[0].message);
		}

		return json.data;
	} catch (error) {
		logger.error('GraphQL Request Failed:', error);
		throw error;
	}
}

// GraphQL client object with multiple method names for compatibility
export const graphqlClient = {
	// For domain-concepts.ts compatibility
	request: graphqlRequest,

	// For IGraphQLClient interface compatibility
	query: graphqlRequest,
	mutate: graphqlRequest
};
