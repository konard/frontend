import type { PageLoad } from './$types';
import { load_GetAdminTables } from '$houdini';

export const load: PageLoad = async (event) => {
	// Load all tables from database
	const tablesData = await load_GetAdminTables({ event });

	return {
		...tablesData
	};
};
