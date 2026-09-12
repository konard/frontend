import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import GraphVisualization from './GraphVisualization.svelte';
import type { GraphData } from './types';

const minimalData: GraphData = {
	nodes: [
		{ id: '1', label: 'Root', type: 'concept' },
		{ id: '2', label: 'Child', type: 'entity', parent: '1' },
		{ id: '3', label: 'Leaf', type: 'attribute', parent: '2' }
	],
	edges: [
		{ id: 'e1', from: '1', to: '2', label: 'has child', value: 2 },
		{ id: 'e2', from: '2', to: '3', label: 'has attribute' }
	]
};

function canvasElement(): HTMLElement {
	return document.querySelector('[data-testid="graph-canvas"]') as HTMLElement;
}

/** The visualisation libraries are imported dynamically, so rendering is asynchronous. */
async function waitForSelector(selector: string): Promise<Element> {
	return await expect
		.poll(() => canvasElement().querySelector(selector), { timeout: 10_000 })
		.not.toBeNull()
		.then(() => canvasElement().querySelector(selector) as Element);
}

/** Hover the first rendered node, re-querying it because the layout re-renders. */
function hoverNode(type: 'mouseenter' | 'mouseleave'): void {
	const node = canvasElement().querySelector('.c-graph__nodes path');
	node?.dispatchEvent(new MouseEvent(type, { bubbles: true }));
}

describe('GraphVisualization', () => {
	it('renders the title and the toolbar', async () => {
		render(GraphVisualization, { data: minimalData, title: 'Ontology' });

		await expect.element(page.getByText('Ontology')).toBeInTheDocument();
		await expect.element(page.getByLabelText('Visualization type')).toBeInTheDocument();
	});

	it('renders a force-directed graph for a minimal dataset', async () => {
		render(GraphVisualization, { data: minimalData });

		await waitForSelector('svg');
		await expect
			.poll(() => canvasElement().querySelectorAll('.c-graph__nodes path').length)
			.toBe(3);
		expect(canvasElement().querySelectorAll('.c-graph__links line')).toHaveLength(2);
	});

	it('renders a legend entry per node type and relation', async () => {
		render(GraphVisualization, { data: minimalData });

		await expect.element(page.getByText('Concept')).toBeInTheDocument();
		await expect.element(page.getByText('Entity')).toBeInTheDocument();
		await expect.element(page.getByText('has child')).toBeInTheDocument();
	});

	it('switches to the sankey view', async () => {
		render(GraphVisualization, { data: minimalData, visualizationType: 'sankey' });

		await waitForSelector('svg rect');
		expect(canvasElement().querySelectorAll('rect').length).toBeGreaterThan(0);
	});

	it('switches to the network view', async () => {
		render(GraphVisualization, { data: minimalData, visualizationType: 'network' });

		await waitForSelector('canvas');
		expect(canvasElement().querySelector('canvas')).not.toBeNull();
	});

	it('re-renders when the visualization type is changed through the toolbar', async () => {
		render(GraphVisualization, { data: minimalData });

		await waitForSelector('svg');
		await page.getByLabelText('Visualization type').selectOptions('network');

		await waitForSelector('canvas');
		expect(canvasElement().querySelector('.c-graph__nodes')).toBeNull();
	});

	it('reports an empty dataset instead of rendering', async () => {
		render(GraphVisualization, { data: { nodes: [], edges: [] } });

		await expect.element(page.getByText('No data to display.')).toBeInTheDocument();
	});

	it('calls onNodeClick when a node is clicked', async () => {
		let clicked: string | undefined;
		render(GraphVisualization, {
			data: minimalData,
			onNodeClick: (node) => {
				clicked = node.id;
			}
		});

		const node = (await waitForSelector('.c-graph__nodes path')) as SVGPathElement;
		node.dispatchEvent(new MouseEvent('click', { bubbles: true }));

		await expect.poll(() => clicked).toBeDefined();
	});

	it('shows a tooltip on node hover and hides it again', async () => {
		render(GraphVisualization, { data: minimalData });
		await waitForSelector('.c-graph__nodes path');

		hoverNode('mouseenter');
		await expect.element(page.getByRole('tooltip')).toHaveTextContent('Root');

		hoverNode('mouseleave');
		await expect.poll(() => document.querySelector('[role="tooltip"]')).toBeNull();
	});

	it('does not show tooltips when they are disabled', async () => {
		render(GraphVisualization, { data: minimalData, enableTooltips: false });
		await waitForSelector('.c-graph__nodes path');

		hoverNode('mouseenter');
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(document.querySelector('[role="tooltip"]')).toBeNull();
	});

	it('collapses and expands a subgraph on double click', async () => {
		render(GraphVisualization, { data: minimalData });

		const node = (await waitForSelector('.c-graph__nodes path.is-collapsible')) as SVGPathElement;
		node.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

		await expect
			.poll(() => canvasElement().querySelectorAll('.c-graph__nodes path').length)
			.toBe(1);
		await expect.element(page.getByRole('button', { name: 'Expand all' })).toBeInTheDocument();

		await page.getByRole('button', { name: 'Expand all' }).click();
		await expect
			.poll(() => canvasElement().querySelectorAll('.c-graph__nodes path').length)
			.toBe(3);
	});

	it('handles a large dataset', async () => {
		const nodes = Array.from({ length: 1000 }, (_, index) => ({
			id: `n${index}`,
			label: `Node ${index}`
		}));
		const edges = Array.from({ length: 999 }, (_, index) => ({
			id: `e${index}`,
			from: `n${index}`,
			to: `n${index + 1}`
		}));

		render(GraphVisualization, { data: { nodes, edges } });

		await waitForSelector('svg');
		await expect
			.poll(() => canvasElement().querySelectorAll('.c-graph__nodes path').length, {
				timeout: 20_000
			})
			.toBe(1000);
	});
});
