<script lang="ts">
	import GraphVisualization from '$lib/components/visualization/GraphVisualization.svelte';
	import type { Edge, GraphData, Node, NodeType } from '$lib/components/visualization/types';

	const NODE_TYPES: NodeType[] = ['concept', 'entity', 'relation', 'attribute'];

	const sampleData: GraphData = {
		nodes: [
			{ id: '1', label: 'Root Concept', type: 'concept', title: 'Main concept node' },
			{ id: '2', label: 'Child A', type: 'entity', title: 'Entity A', parent: '1' },
			{ id: '3', label: 'Child B', type: 'entity', title: 'Entity B', parent: '1' },
			{ id: '4', label: 'Sub A1', type: 'relation', parent: '2' },
			{ id: '5', label: 'Sub A2', type: 'relation', parent: '2' },
			{ id: '6', label: 'Sub B1', type: 'attribute', parent: '3' },
			{ id: '7', label: 'Sub B2', type: 'attribute', parent: '3' },
			{ id: '8', label: 'Leaf 1', type: 'concept', parent: '4' },
			{ id: '9', label: 'Leaf 2', type: 'concept', parent: '5' }
		],
		edges: [
			{ id: 'e1', from: '1', to: '2', value: 3, label: 'has child' },
			{ id: 'e2', from: '1', to: '3', value: 2, label: 'has child' },
			{ id: 'e3', from: '2', to: '4', value: 1, label: 'relates to' },
			{ id: 'e4', from: '2', to: '5', value: 1, label: 'relates to' },
			{ id: 'e5', from: '3', to: '6', value: 1, label: 'has attribute' },
			{ id: 'e6', from: '3', to: '7', value: 1, label: 'has attribute' },
			{ id: 'e7', from: '4', to: '8', value: 1, label: 'leads to' },
			{ id: 'e8', from: '5', to: '9', value: 1, label: 'leads to' }
		]
	};

	/** Layered random graph, used to check the behaviour with large datasets. */
	function generateDataset(nodeCount: number): GraphData {
		const nodes: Node[] = Array.from({ length: nodeCount }, (_, index) => ({
			id: `n${index}`,
			label: `Node ${index}`,
			type: NODE_TYPES[index % NODE_TYPES.length]
		}));

		const edges: Edge[] = Array.from({ length: nodeCount - 1 }, (_, index) => ({
			id: `e${index}`,
			from: `n${index}`,
			to: `n${index + 1}`,
			value: (index % 5) + 1,
			label: 'flows to'
		}));

		return { nodes, edges };
	}

	let graph = $state<GraphVisualization | null>(null);
	let data = $state<GraphData>(sampleData);
	let visualizationType = $state<'force' | 'sankey' | 'network'>('force');
	let enableTooltips = $state(true);
	let enableZoom = $state(true);
	let exportScale = $state(2);
	let eventLog = $state<string[]>([]);

	function log(message: string): void {
		eventLog = [`${new Date().toLocaleTimeString()} — ${message}`, ...eventLog].slice(0, 8);
	}
</script>

<svelte:head>
	<title>Graph Visualization</title>
</svelte:head>

<div class="c-page">
	<header class="c-page__header">
		<h1>Graph Visualization</h1>
		<p>
			Force-directed, Sankey and network views of an ontology. Double click a node to collapse or
			expand its subgraph.
		</p>
	</header>

	<div class="c-page__controls">
		<button type="button" onclick={() => (data = sampleData)}>Sample data (9 nodes)</button>
		<button type="button" onclick={() => (data = generateDataset(100))}>100 nodes</button>
		<button type="button" onclick={() => (data = generateDataset(1000))}>1000 nodes</button>

		<label><input type="checkbox" bind:checked={enableTooltips} /> Tooltips</label>
		<label><input type="checkbox" bind:checked={enableZoom} /> Zoom &amp; pan</label>

		<label>
			Export scale
			<input type="number" min="1" max="4" step="1" bind:value={exportScale} />
		</label>
		<button
			type="button"
			onclick={() => graph?.exportToPNG({ filename: 'ontology', scale: exportScale })}
		>
			Export PNG
		</button>
	</div>

	<GraphVisualization
		bind:this={graph}
		bind:visualizationType
		{data}
		{enableTooltips}
		{enableZoom}
		title="Ontology"
		height={600}
		onNodeClick={(node) => log(`node click: ${node.label ?? node.id}`)}
		onEdgeClick={(edge) => log(`edge click: ${edge.from} → ${edge.to}`)}
		onNodeHover={(node) => log(`node hover: ${node.label ?? node.id}`)}
		onEdgeHover={(edge) => log(`edge hover: ${edge.from} → ${edge.to}`)}
	/>

	<section class="c-page__log">
		<h2>Events</h2>
		{#if eventLog.length === 0}
			<p>Interact with the graph to see events.</p>
		{:else}
			<ul>
				{#each eventLog as entry (entry)}
					<li>{entry}</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<style>
	.c-page {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		color: var(--color-text-primary);
	}

	.c-page__header p {
		color: var(--color-text-secondary);
	}

	.c-page__controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
	}

	.c-page__controls button,
	.c-page__controls input[type='number'] {
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-md);
		background: var(--color-background-primary);
		color: var(--color-text-primary);
		padding: 0.375rem 0.625rem;
		font: inherit;
		font-size: 0.875rem;
	}

	.c-page__controls button {
		cursor: pointer;
	}

	.c-page__controls label {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--color-text-secondary);
		font-size: 0.875rem;
	}

	.c-page__log {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.c-page__log ul {
		list-style: none;
	}
</style>
