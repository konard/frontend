import { describe, expect, it } from 'vitest';
import {
	DEFAULT_NODE_STYLES,
	applyCollapse,
	buildEdgeLegend,
	buildNodeLegend,
	getChildren,
	getDescendantIds,
	hasChildren,
	resolveEdgeStyle,
	resolveExportSize,
	resolveNodeStyle,
	sanitizeGraph,
	toBaseFilename,
	toCssSize,
	toPx,
	toSankeyInput,
	toVisShape
} from './graph';
import type { GraphData } from './types';

const tree: GraphData = {
	nodes: [
		{ id: '1', label: 'Root', type: 'concept' },
		{ id: '2', label: 'Child A', type: 'entity', parent: '1' },
		{ id: '3', label: 'Child B', type: 'entity', parent: '1' },
		{ id: '4', label: 'Grandchild', type: 'attribute', parent: '2' }
	],
	edges: [
		{ id: 'e1', from: '1', to: '2', label: 'has child' },
		{ id: 'e2', from: '1', to: '3', label: 'has child' },
		{ id: 'e3', from: '2', to: '4', label: 'has attribute', value: 4 }
	]
};

describe('resolveNodeStyle', () => {
	it('falls back to the default style of the node type', () => {
		expect(resolveNodeStyle({ id: '1', type: 'relation' })).toEqual(DEFAULT_NODE_STYLES.relation);
	});

	it('falls back to the generic style for an unknown type', () => {
		expect(resolveNodeStyle({ id: '1' })).toEqual({ color: '#4682b4', size: 10, shape: 'circle' });
	});

	it('prefers per node values over every override', () => {
		const style = resolveNodeStyle(
			{ id: '1', type: 'concept', color: '#000000', size: 40, shape: 'diamond' },
			{ node: { color: '#ffffff', byType: { concept: { color: '#111111' } } } }
		);

		expect(style).toEqual({ color: '#000000', size: 40, shape: 'diamond' });
	});

	it('prefers a per type override over the global override', () => {
		const style = resolveNodeStyle(
			{ id: '1', type: 'entity' },
			{ node: { color: '#ffffff', byType: { entity: { color: '#111111', shape: 'triangle' } } } }
		);

		expect(style).toMatchObject({ color: '#111111', shape: 'triangle' });
	});
});

describe('resolveEdgeStyle', () => {
	it('uses the default colour and width', () => {
		expect(resolveEdgeStyle({ id: 'e', from: 'a', to: 'b' })).toEqual({
			color: '#999999',
			width: 1
		});
	});

	it('scales the width with the edge value', () => {
		expect(resolveEdgeStyle({ id: 'e', from: 'a', to: 'b', value: 9 }).width).toBe(3);
	});

	it('ignores a non positive value', () => {
		expect(resolveEdgeStyle({ id: 'e', from: 'a', to: 'b', value: 0 }).width).toBe(1);
	});

	it('honours per edge and global overrides', () => {
		expect(resolveEdgeStyle({ id: 'e', from: 'a', to: 'b', color: '#ff0000' }).color).toBe(
			'#ff0000'
		);
		expect(resolveEdgeStyle({ id: 'e', from: 'a', to: 'b' }, { edge: { width: 2 } }).width).toBe(2);
	});
});

describe('toPx', () => {
	it('returns numbers unchanged', () => {
		expect(toPx(320)).toBe(320);
	});

	it('parses pixel strings', () => {
		expect(toPx('480px')).toBe(480);
	});

	it('resolves percentages against the container size', () => {
		expect(toPx('50%', 800)).toBe(400);
	});

	it('uses the fallback when a percentage cannot be resolved', () => {
		expect(toPx('50%', 0, 720)).toBe(720);
	});

	it('uses the fallback for garbage input', () => {
		expect(toPx('auto', 800, 640)).toBe(640);
	});
});

describe('toCssSize', () => {
	it('adds px to numbers and keeps strings', () => {
		expect(toCssSize(600)).toBe('600px');
		expect(toCssSize('80%')).toBe('80%');
	});
});

describe('sanitizeGraph', () => {
	it('returns an empty graph for missing data', () => {
		expect(sanitizeGraph(null)).toEqual({ nodes: [], edges: [] });
	});

	it('drops duplicate nodes and dangling edges', () => {
		const result = sanitizeGraph({
			nodes: [{ id: 'a' }, { id: 'a' }, { id: 'b' }],
			edges: [
				{ id: 'e1', from: 'a', to: 'b' },
				{ id: 'e2', from: 'a', to: 'missing' }
			]
		});

		expect(result.nodes).toHaveLength(2);
		expect(result.edges).toEqual([{ id: 'e1', from: 'a', to: 'b' }]);
	});
});

describe('hierarchy helpers', () => {
	it('finds direct children', () => {
		expect(getChildren(tree, '1').map((node) => node.id)).toEqual(['2', '3']);
		expect(hasChildren(tree, '3')).toBe(false);
	});

	it('finds transitive descendants', () => {
		expect([...getDescendantIds(tree, '1')]).toEqual(['2', '3', '4']);
	});

	it('does not loop on a cyclic parent chain', () => {
		const cyclic: GraphData = {
			nodes: [
				{ id: 'a', parent: 'b' },
				{ id: 'b', parent: 'a' }
			],
			edges: []
		};

		expect([...getDescendantIds(cyclic, 'a')]).toEqual(['b']);
	});
});

describe('applyCollapse', () => {
	it('returns the same graph when nothing is collapsed', () => {
		expect(applyCollapse(tree, [])).toBe(tree);
	});

	it('hides the subgraph and the edges touching it', () => {
		const result = applyCollapse(tree, ['2']);

		expect(result.nodes.map((node) => node.id)).toEqual(['1', '2', '3']);
		expect(result.edges.map((edge) => edge.id)).toEqual(['e1', 'e2']);
	});

	it('ignores unknown ids', () => {
		expect(applyCollapse(tree, ['nope'])).toBe(tree);
	});
});

describe('legends', () => {
	it('lists every node type once', () => {
		expect(buildNodeLegend(tree)).toEqual([
			{ key: 'concept', label: 'Concept', color: '#4682b4' },
			{ key: 'entity', label: 'Entity', color: '#32cd32' },
			{ key: 'attribute', label: 'Attribute', color: '#9370db' }
		]);
	});

	it('labels untyped nodes as Other', () => {
		expect(buildNodeLegend({ nodes: [{ id: 'a' }], edges: [] })).toEqual([
			{ key: 'unknown', label: 'Other', color: '#4682b4' }
		]);
	});

	it('lists every relationship label once', () => {
		expect(buildEdgeLegend(tree).map((item) => item.key)).toEqual(['has child', 'has attribute']);
	});
});

describe('resolveExportSize', () => {
	it('defaults to the rendered size', () => {
		expect(resolveExportSize({ width: 800, height: 600 })).toEqual({ width: 800, height: 600 });
	});

	it('applies the configured size and resolution', () => {
		expect(resolveExportSize({ width: 800, height: 600 }, { width: 400, scale: 3 })).toEqual({
			width: 1200,
			height: 1800
		});
	});

	it('ignores a non positive scale', () => {
		expect(resolveExportSize({ width: 800, height: 600 }, { scale: 0 }).width).toBe(800);
	});
});

describe('toBaseFilename', () => {
	it('strips a known extension and falls back', () => {
		expect(toBaseFilename('graph.png', 'fallback')).toBe('graph');
		expect(toBaseFilename('graph.SVG', 'fallback')).toBe('graph');
		expect(toBaseFilename('  ', 'fallback')).toBe('fallback');
		expect(toBaseFilename(undefined, 'fallback')).toBe('fallback');
	});
});

describe('toVisShape', () => {
	it('maps the shapes onto vis-network names', () => {
		expect(toVisShape('circle')).toBe('dot');
		expect(toVisShape('square')).toBe('box');
		expect(toVisShape('diamond')).toBe('diamond');
		expect(toVisShape('triangle')).toBe('triangle');
	});
});

describe('toSankeyInput', () => {
	it('maps ids onto indices and defaults the value', () => {
		const input = toSankeyInput(tree);

		expect(input?.nodes.map((node) => node.index)).toEqual([0, 1, 2, 3]);
		expect(input?.links[0]).toMatchObject({ source: 0, target: 1, value: 1 });
		expect(input?.links[2]).toMatchObject({ source: 1, target: 3, value: 4 });
	});

	it('returns null without usable flows', () => {
		expect(toSankeyInput({ nodes: [{ id: 'a' }], edges: [] })).toBeNull();
		expect(
			toSankeyInput({ nodes: [{ id: 'a' }], edges: [{ id: 'e', from: 'a', to: 'a' }] })
		).toBeNull();
	});
});
