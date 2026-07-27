<script lang="ts">
	import { useAuth } from '$lib/auth';
	import { graphql } from '$houdini';
	import { graphqlClient } from '$lib/graphql-client';
	import AuthGuard from '$stylist/auth/component/organism/auth-guard/index.svelte';
	import type { PageData } from './$types';
	import TableListPanel from '$stylist/table/component/organism/table-list-panel/index.svelte';
	import DataTableShell from '$stylist/table/component/organism/data-table-shell/index.svelte';
	import type { TableSchema } from '$stylist/table/type/schema/table';
	import type { CellType } from '$stylist/table/type/enum/cell-type';
	import SchemaFormDialog from '$stylist/form/component/organism/schema-form-dialog/index.svelte';
	import DialogConfirm from '$stylist/navigation/component/molecule/dialog-confirm/index.svelte';
	import ThemeModeToggle from '$stylist/theme/component/atom/theme-mode-toggle/index.svelte';
	import { STORAGE_KEYS } from '$stylist/auth';

	const auth = useAuth();

	let { data }: { data: PageData } = $props();

	// GraphQL stores
	const tablesStore = data.GetAdminTables;
	const createRecordMutation = graphql(`
		mutation CreateTableRecord($tableName: String!, $data: JSON!) {
			createTableRecord(tableName: $tableName, data: $data)
		}
	`);
	const updateRecordMutation = graphql(`
		mutation UpdateTableRecord($tableName: String!, $recordId: Int!, $data: JSON!) {
			updateTableRecord(tableName: $tableName, recordId: $recordId, data: $data)
		}
	`);
	const deleteRecordMutation = graphql(`
		mutation DeleteTableRecord($tableName: String!, $recordId: Int!) {
			deleteTableRecord(tableName: $tableName, recordId: $recordId)
		}
	`);

	// State
	let selectedTable = $state<string | null>(null);
	let tableData = $state<{ columns: string[]; rows: Record<string, unknown>[]; total: number; hasMore: boolean } | null>(null);
	let tableSchema = $state<{ columns: { name: string; type: string; nullable: boolean; primaryKey: boolean; default: string | null }[] } | null>(null);
	let isLoadingDetails = $state(false);

	// Modal state
	let isRecordModalOpen = $state(false);
	let recordModalMode = $state<'create' | 'edit'>('create');
	let editingRecord = $state<Record<string, any> | undefined>(undefined);
	let isDeleteModalOpen = $state(false);
	let deletingRecord = $state<Record<string, any> | null>(null);
	let isDeleting = $state(false);

	// Derived state
	const tables = $derived($tablesStore?.data?.allTables ?? []);
	const primaryKeyColumn = $derived(
		tableSchema?.columns?.find((col) => col.primaryKey)?.name ?? 'id'
	);
	const deleteMessage = $derived.by(() => {
		if (!deletingRecord) return '';
		const preview = Object.entries(deletingRecord)
			.slice(0, 5)
			.map(([key, value]) => `${key}: ${value === null || value === undefined ? '-' : String(value)}`)
			.join(', ');
		return `Are you sure you want to delete this record from "${selectedTable}"? This action cannot be undone. (${preview})`;
	});

	// Адаптер: GraphQL columns → TableSchema для DataTableShell
	const shellSchema: TableSchema<Record<string, unknown>> = $derived.by(() => {
		const cols: string[] = tableData?.columns ?? [];
		return cols.map((colName) => {
			const info = tableSchema?.columns?.find((c) => c.name === colName);
			const rawType = (info?.type ?? '').toLowerCase();
			let cell: CellType = 'text';
			if (/int|numeric|float|double|decimal/.test(rawType)) cell = 'number';
			else if (/timestamp|date|time/.test(rawType)) cell = 'date';
			else if (/bool/.test(rawType)) cell = 'pill';
			return {
				key: colName,
				header: colName + (info?.primaryKey ? ' 🔑' : ''),
				cell,
				sortable: true
			};
		});
	});

	const shellData: Record<string, unknown>[] = $derived(tableData?.rows ?? []);

	$effect(() => {
		if (selectedTable) loadTableDetails(selectedTable);
	});

	async function loadTableDetails(tableName: string) {
		isLoadingDetails = true;
		tableData = null;
		tableSchema = null;
		try {
			const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
			const result = await graphqlClient.query<{
				tableSchema: { columns: { name: string; type: string; nullable: boolean; primaryKey: boolean; default: string | null }[] };
				tableData: { columns: string[]; rows: Record<string, unknown>[]; total: number; hasMore: boolean };
			}>(
				`query GetTableDetails($tableName: String!, $limit: Int!, $offset: Int!) {
					tableSchema(tableName: $tableName) {
						columns { name type nullable primaryKey default }
					}
					tableData(tableName: $tableName, limit: $limit, offset: $offset) {
						columns rows total hasMore
					}
				}`,
				{ tableName, limit: 200, offset: 0 },
				token ?? undefined
			);
			tableSchema = result.tableSchema;
			tableData = result.tableData;
		} catch (error) {
			console.error('Error loading table details:', error);
		} finally {
			isLoadingDetails = false;
		}
	}

	function handleSelectTable(tableName: string) {
		selectedTable = tableName;
	}

	function handleCreateRecord() {
		recordModalMode = 'create';
		editingRecord = undefined;
		isRecordModalOpen = true;
	}

	function handleEditRecord(record: Record<string, any>) {
		recordModalMode = 'edit';
		editingRecord = record;
		isRecordModalOpen = true;
	}

	function handleDeleteRecord(record: Record<string, any>) {
		deletingRecord = record ?? null;
		isDeleteModalOpen = true;
	}

	async function handleSaveRecord(formData: Record<string, any>) {
		if (!selectedTable) return;

		try {
			if (recordModalMode === 'create') {
				await createRecordMutation.mutate({
					tableName: selectedTable,
					data: formData
				});
			} else if (editingRecord) {
				const recordId = editingRecord[primaryKeyColumn];
				await updateRecordMutation.mutate({
					tableName: selectedTable,
					recordId: Number(recordId),
					data: formData
				});
			}

			// Reload table data
			await loadTableDetails(selectedTable);
		} catch (error) {
			console.error('Error saving record:', error);
			throw error; // Re-throw so modal can show error
		}
	}

	async function handleConfirmDelete() {
		if (!selectedTable || !deletingRecord) return;

		isDeleting = true;
		try {
			const recordId = deletingRecord[primaryKeyColumn];
			await deleteRecordMutation.mutate({
				tableName: selectedTable,
				recordId: Number(recordId)
			});

			isDeleteModalOpen = false;
			// Reload table data
			await loadTableDetails(selectedTable);
		} catch (error) {
			console.error('Error deleting record:', error);
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>Admin Panel - Database Management</title>
</svelte:head>

<AuthGuard
	isAuthenticated={auth.isAuthenticated}
	userRoles={auth.roles.map((r) => r.name)}
	requiredRole="admin"
	redirectUrl="/login"
>
	<div class="c-admin">
		<header class="c-admin__header">
			<div class="c-admin__header-inner">
				<div class="c-admin__header-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
				</div>
				<div>
					<h1 class="c-admin__header-title">Database Administration</h1>
					<p class="c-admin__header-sub">Manage all database tables and records</p>
				</div>
				<div class="c-admin__header-actions">
					<ThemeModeToggle class="c-admin__theme-toggle" />
				</div>
			</div>
		</header>

		<main class="c-admin__main">
			<div class="c-admin__grid">
				<div class="c-admin__sidebar">
					<TableListPanel
						items={tables}
						selectedName={selectedTable}
						onSelect={handleSelectTable}
					/>
				</div>
				<div class="c-admin__content">
					{#if !selectedTable}
						<div class="c-admin__empty">
							<p class="c-admin__empty-text">Выберите таблицу для просмотра данных</p>
						</div>
					{:else}
						<div class="c-admin__table-panel">
							<div class="c-admin__table-header">
								<div>
									<h2 class="c-admin__table-title">{selectedTable}</h2>
									<p class="c-admin__table-total">{tableData?.total ?? 0} записей</p>
								</div>
								<button class="c-admin__add-btn" onclick={handleCreateRecord}>
									+ Добавить
								</button>
							</div>
							<DataTableShell
								data={shellData}
								schema={shellSchema}
								loading={isLoadingDetails}
								onRowClick={(row) => handleEditRecord(row as Record<string, any>)}
								defaultPageSize={25}
								showColumnManager={true}
							/>
						</div>
					{/if}
				</div>
			</div>
		</main>
	</div>

	{#if tableSchema}
		<SchemaFormDialog
			isOpen={isRecordModalOpen}
			mode={recordModalMode}
			title={recordModalMode === 'create' ? 'Create New Record' : 'Edit Record'}
			subtitle={`Table: ${selectedTable ?? ''}`}
			fields={tableSchema.columns}
			initialData={editingRecord}
			onClose={() => (isRecordModalOpen = false)}
			onSave={handleSaveRecord}
		/>

		<DialogConfirm
			isOpen={isDeleteModalOpen}
			title="Delete Record"
			message={deleteMessage}
			confirmText="Delete"
			cancelText="Cancel"
			variant="danger"
			isLoading={isDeleting}
			onClose={() => (isDeleteModalOpen = false)}
			onConfirm={handleConfirmDelete}
		/>
	{/if}
</AuthGuard>

<style>
	.c-admin {
		min-height: 100vh;
		background: var(--color-background-secondary, #f9fafb);
	}
	.c-admin__header {
		background: var(--color-background-primary, #fff);
		border-bottom: 1px solid var(--color-border-primary, #e5e7eb);
		backdrop-filter: blur(8px);
	}
	.c-admin__header-inner {
		display: flex;
		align-items: center;
		gap: 1rem;
		max-width: 112rem;
		margin: 0 auto;
		padding: 1.25rem 1.5rem;
	}
	.c-admin__header-actions {
		display: flex;
		align-items: center;
		margin-left: auto;
	}
	:global(.c-admin__theme-toggle) {
		min-width: 2.25rem;
		min-height: 2.25rem;
		padding: 0.5rem;
	}
	.c-admin__header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: var(--radius-lg, 0.75rem);
		background: var(--color-primary-600, #4f46e5);
		color: #fff;
		flex-shrink: 0;
		box-shadow: 0 4px 12px rgb(79 70 229 / 0.3);
	}
	.c-admin__header-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text-primary, #111827);
		margin: 0;
	}
	.c-admin__header-sub {
		font-size: 0.875rem;
		color: var(--color-text-secondary, #6b7280);
		margin: 0;
	}
	.c-admin__main {
		max-width: 112rem;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}
	.c-admin__grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		height: calc(100vh - 200px);
	}
	@media (min-width: 1024px) {
		.c-admin__grid {
			grid-template-columns: 380px 1fr;
			gap: 2rem;
		}
	}
	.c-admin__sidebar,
	.c-admin__content {
		height: 100%;
		min-height: 0;
	}
	.c-admin__empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		border: 1px solid var(--color-border-primary, #e5e7eb);
		border-radius: 0.5rem;
		background: var(--color-background-primary, #fff);
	}
	.c-admin__empty-text {
		font-size: 0.875rem;
		color: var(--color-text-secondary, #6b7280);
	}
	.c-admin__table-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 0.75rem;
	}
	.c-admin__table-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-shrink: 0;
	}
	.c-admin__table-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-text-primary, #111827);
		margin: 0;
	}
	.c-admin__table-total {
		font-size: 0.8rem;
		color: var(--color-text-secondary, #6b7280);
		margin: 0.15rem 0 0;
	}
	.c-admin__add-btn {
		padding: 0.4rem 0.875rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #fff;
		background: var(--color-primary-600, #4f46e5);
		border: none;
		border-radius: var(--radius-md, 0.375rem);
		cursor: pointer;
	}
	.c-admin__add-btn:hover {
		background: var(--color-primary-700, #4338ca);
	}
</style>

