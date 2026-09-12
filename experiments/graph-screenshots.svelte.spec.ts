import { page } from '@vitest/browser/context';
import { describe, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import GraphVisualization from './GraphVisualization.svelte';
import type { GraphData } from './types';

const data: GraphData = {
	nodes: [
		{ id: 'ontology', label: 'Ontology', type: 'concept' },
		{ id: 'person', label: 'Person', type: 'entity', parent: 'ontology' },
		{ id: 'org', label: 'Organization', type: 'entity', parent: 'ontology' },
		{ id: 'name', label: 'name', type: 'attribute', parent: 'person' },
		{ id: 'age', label: 'age', type: 'attribute', parent: 'person' },
		{ id: 'title', label: 'title', type: 'attribute', parent: 'org' },
		{ id: 'works', label: 'worksAt', type: 'relation' }
	],
	edges: [
		{ id: 'e1', from: 'ontology', to: 'person', label: 'has child', value: 3 },
		{ id: 'e2', from: 'ontology', to: 'org', label: 'has child', value: 2 },
		{ id: 'e3', from: 'person', to: 'name', label: 'has attribute' },
		{ id: 'e4', from: 'person', to: 'age', label: 'has attribute' },
		{ id: 'e5', from: 'org', to: 'title', label: 'has attribute' },
		{ id: 'e6', from: 'person', to: 'works', label: 'relates' },
		{ id: 'e7', from: 'works', to: 'org', label: 'relates' }
	]
};

describe('screenshot', () => {
	it('captures the force view', async () => {
		render(GraphVisualization, { data, title: 'Ontology graph' });
		await new Promise((resolve) => setTimeout(resolve, 1500));
		await page.screenshot({ path: '../../../../docs/screenshots/graph-force.png' });
	});

	it('captures the sankey view', async () => {
		render(GraphVisualization, { data, title: 'Ontology graph', visualizationType: 'sankey' });
		await new Promise((resolve) => setTimeout(resolve, 1500));
		await page.screenshot({ path: '../../../../docs/screenshots/graph-sankey.png' });
	});

	it('captures the network view', async () => {
		render(GraphVisualization, { data, title: 'Ontology graph', visualizationType: 'network' });
		await new Promise((resolve) => setTimeout(resolve, 2000));
		await page.screenshot({ path: '../../../../docs/screenshots/graph-network.png' });
	});
});
