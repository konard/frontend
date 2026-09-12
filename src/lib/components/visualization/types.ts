/** Node type known to the ontology visualisation system. */
export type NodeType = 'concept' | 'entity' | 'relation' | 'attribute';

/** Shape used to render a node. */
export type NodeShape = 'circle' | 'square' | 'diamond' | 'triangle';

export type Node = {
	id: string;
	label?: string;
	title?: string;
	color?: string;
	x?: number;
	y?: number;
	type?: NodeType;
	/** Optional parent id, enables collapsing/expanding of subgraphs. */
	parent?: string;
	/** Per node overrides of the styling defaults. */
	size?: number;
	shape?: NodeShape;
	value?: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
};

export type Edge = {
	id: string;
	from: string;
	to: string;
	label?: string;
	title?: string;
	color?: string;
	value?: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
};

export type GraphData = {
	nodes: Node[];
	edges: Edge[];
};

export type VisualizationType = 'force' | 'sankey' | 'network';

export type NodeStyle = {
	color: string;
	size: number;
	shape: NodeShape;
};

export type EdgeStyle = {
	color: string;
	width: number;
};

/** Styling overrides, either global or keyed by node type. */
export type GraphStyles = {
	node?: Partial<NodeStyle> & { byType?: Partial<Record<NodeType, Partial<NodeStyle>>> };
	edge?: Partial<EdgeStyle>;
};

export type ExportOptions = {
	filename?: string;
	/** Width of the exported image in pixels, defaults to the rendered width. */
	width?: number;
	/** Height of the exported image in pixels, defaults to the rendered height. */
	height?: number;
	/** Resolution multiplier applied on top of width/height (PNG only). */
	scale?: number;
};

export type LegendItem = {
	key: string;
	label: string;
	color: string;
};
