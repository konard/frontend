import type {
	Edge,
	EdgeStyle,
	ExportOptions,
	GraphData,
	GraphStyles,
	LegendItem,
	Node,
	NodeStyle,
	NodeType
} from './types';

/** Default styling per ontology node type. */
export const DEFAULT_NODE_STYLES: Record<NodeType, NodeStyle> = {
	concept: { color: '#4682b4', size: 10, shape: 'circle' },
	entity: { color: '#32cd32', size: 10, shape: 'square' },
	relation: { color: '#ff6347', size: 8, shape: 'diamond' },
	attribute: { color: '#9370db', size: 8, shape: 'triangle' }
};

export const FALLBACK_NODE_STYLE: NodeStyle = { color: '#4682b4', size: 10, shape: 'circle' };

export const DEFAULT_EDGE_STYLE: EdgeStyle = { color: '#999999', width: 1 };

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
	concept: 'Concept',
	entity: 'Entity',
	relation: 'Relation',
	attribute: 'Attribute'
};

/** Resolve the style of a node: per node value > per type override > default. */
export function resolveNodeStyle(node: Node, styles: GraphStyles = {}): NodeStyle {
	const typeStyle = node.type ? DEFAULT_NODE_STYLES[node.type] : undefined;
	const overrideByType = node.type ? styles.node?.byType?.[node.type] : undefined;

	return {
		color:
			node.color ??
			overrideByType?.color ??
			styles.node?.color ??
			typeStyle?.color ??
			FALLBACK_NODE_STYLE.color,
		size:
			node.size ??
			overrideByType?.size ??
			styles.node?.size ??
			typeStyle?.size ??
			FALLBACK_NODE_STYLE.size,
		shape:
			node.shape ??
			overrideByType?.shape ??
			styles.node?.shape ??
			typeStyle?.shape ??
			FALLBACK_NODE_STYLE.shape
	};
}

/** Resolve the style of an edge: per edge value > override > default. Width scales with `value`. */
export function resolveEdgeStyle(edge: Edge, styles: GraphStyles = {}): EdgeStyle {
	const baseWidth = styles.edge?.width ?? DEFAULT_EDGE_STYLE.width;
	const value = typeof edge.value === 'number' && edge.value > 0 ? edge.value : 1;

	return {
		color: edge.color ?? styles.edge?.color ?? DEFAULT_EDGE_STYLE.color,
		width: baseWidth * Math.sqrt(value)
	};
}

/**
 * Convert a CSS-ish dimension into pixels.
 * Percentages are resolved against `basis` (the measured container size).
 */
export function toPx(value: string | number, basis = 0, fallback = 600): number {
	if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;

	const trimmed = value.trim();
	if (trimmed.endsWith('%')) {
		const percent = parseFloat(trimmed);
		if (!Number.isFinite(percent) || basis <= 0) return fallback;
		return (percent / 100) * basis;
	}

	const parsed = parseFloat(trimmed);
	return Number.isFinite(parsed) ? parsed : fallback;
}

/** Turn a dimension prop into a CSS length. */
export function toCssSize(value: string | number): string {
	return typeof value === 'number' ? `${value}px` : value;
}

/** Drop edges pointing at unknown nodes, and nodes sharing an id, so layouts cannot crash. */
export function sanitizeGraph(data: GraphData | null | undefined): GraphData {
	const nodes: Node[] = [];
	const seen = new Set<string>();

	for (const node of data?.nodes ?? []) {
		if (!node || typeof node.id !== 'string' || seen.has(node.id)) continue;
		seen.add(node.id);
		nodes.push(node);
	}

	const edges = (data?.edges ?? []).filter(
		(edge) => edge && seen.has(edge.from) && seen.has(edge.to)
	);

	return { nodes, edges };
}

/** Nodes that declare `node` as their parent. */
export function getChildren(data: GraphData, id: string): Node[] {
	return data.nodes.filter((node) => node.parent === id);
}

export function hasChildren(data: GraphData, id: string): boolean {
	return data.nodes.some((node) => node.parent === id);
}

/** All transitive children of `id` (cycle safe). */
export function getDescendantIds(data: GraphData, id: string): Set<string> {
	const descendants = new Set<string>();
	const queue = [id];

	while (queue.length > 0) {
		const current = queue.shift() as string;
		for (const child of getChildren(data, current)) {
			if (descendants.has(child.id) || child.id === id) continue;
			descendants.add(child.id);
			queue.push(child.id);
		}
	}

	return descendants;
}

/**
 * Hide the subgraphs of every collapsed node.
 * Edges touching a hidden node are dropped as well.
 */
export function applyCollapse(data: GraphData, collapsed: Iterable<string>): GraphData {
	const hidden = new Set<string>();

	for (const id of collapsed) {
		if (!data.nodes.some((node) => node.id === id)) continue;
		for (const descendant of getDescendantIds(data, id)) hidden.add(descendant);
	}

	if (hidden.size === 0) return data;

	const nodes = data.nodes.filter((node) => !hidden.has(node.id));
	const edges = data.edges.filter((edge) => !hidden.has(edge.from) && !hidden.has(edge.to));

	return { nodes, edges };
}

/** Legend entries for the node types present in the data. */
export function buildNodeLegend(data: GraphData, styles: GraphStyles = {}): LegendItem[] {
	const items = new Map<string, LegendItem>();

	for (const node of data.nodes) {
		const key = node.type ?? 'unknown';
		if (items.has(key)) continue;
		items.set(key, {
			key,
			label: node.type ? NODE_TYPE_LABELS[node.type] : 'Other',
			color: node.type
				? resolveNodeStyle({ id: key, type: node.type }, styles).color
				: FALLBACK_NODE_STYLE.color
		});
	}

	return [...items.values()];
}

/** Legend entries for the relationship labels present in the data. */
export function buildEdgeLegend(data: GraphData, styles: GraphStyles = {}): LegendItem[] {
	const items = new Map<string, LegendItem>();

	for (const edge of data.edges) {
		const key = edge.label ?? 'related';
		if (items.has(key)) continue;
		items.set(key, { key, label: key, color: resolveEdgeStyle(edge, styles).color });
	}

	return [...items.values()];
}

/** Resolve the pixel size of an exported image from the rendered size and the export options. */
export function resolveExportSize(
	rendered: { width: number; height: number },
	options: ExportOptions = {}
): { width: number; height: number } {
	const scale = options.scale && options.scale > 0 ? options.scale : 1;
	const width = options.width && options.width > 0 ? options.width : rendered.width;
	const height = options.height && options.height > 0 ? options.height : rendered.height;

	return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Strip the extension a caller may have passed, the export helpers append their own. */
export function toBaseFilename(filename: string | undefined, fallback: string): string {
	const name = (filename ?? '').trim() || fallback;
	return name.replace(/\.(png|svg)$/i, '');
}

/** Map our shape names onto the ones vis-network understands. */
export function toVisShape(shape: NodeStyle['shape']): string {
	switch (shape) {
		case 'square':
			return 'box';
		case 'diamond':
			return 'diamond';
		case 'triangle':
			return 'triangle';
		default:
			return 'dot';
	}
}

/** Sankey needs indices, not ids. Returns null when the graph cannot form a flow. */
export function toSankeyInput(data: GraphData): {
	nodes: Array<Node & { index: number }>;
	links: Array<Edge & { source: number; target: number; value: number }>;
} | null {
	if (data.nodes.length === 0 || data.edges.length === 0) return null;

	const indexById = new Map(data.nodes.map((node, index) => [node.id, index]));
	const nodes = data.nodes.map((node, index) => ({ ...node, index }));
	const links = data.edges
		.filter((edge) => edge.from !== edge.to)
		.map((edge) => ({
			...edge,
			source: indexById.get(edge.from) as number,
			target: indexById.get(edge.to) as number,
			value: typeof edge.value === 'number' && edge.value > 0 ? edge.value : 1
		}));

	return links.length > 0 ? { nodes, links } : null;
}
