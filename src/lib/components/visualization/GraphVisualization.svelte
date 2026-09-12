<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import { browser } from '$app/environment';
	import {
		applyCollapse,
		buildEdgeLegend,
		buildNodeLegend,
		hasChildren,
		resolveEdgeStyle,
		resolveNodeStyle,
		sanitizeGraph,
		toCssSize,
		toPx,
		toSankeyInput,
		toVisShape
	} from './graph';
	import { exportGraphPng, exportGraphSvg } from './exportGraph';
	import type {
		Edge,
		ExportOptions,
		GraphData,
		GraphStyles,
		Node,
		VisualizationType
	} from './types';

	type Props = {
		data?: GraphData;
		width?: string | number;
		height?: string | number;
		title?: string;
		visualizationType?: VisualizationType;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		options?: Record<string, any>;
		enableTooltips?: boolean;
		enableZoom?: boolean;
		/** Styling overrides for nodes and edges. */
		styles?: GraphStyles;
		showLegend?: boolean;
		showToolbar?: boolean;
		onNodeClick?: (node: Node, event: MouseEvent) => void;
		onEdgeClick?: (edge: Edge, event: MouseEvent) => void;
		onNodeHover?: (node: Node, event: MouseEvent) => void;
		onEdgeHover?: (edge: Edge, event: MouseEvent) => void;
	};

	let {
		data = { nodes: [], edges: [] },
		width = '100%',
		height = 600,
		title = 'Graph Visualization',
		visualizationType = $bindable<VisualizationType>('force'),
		options = {},
		enableTooltips = true,
		enableZoom = true,
		styles = {},
		showLegend = true,
		showToolbar = true,
		onNodeClick,
		onEdgeClick,
		onNodeHover,
		onEdgeHover
	}: Props = $props();

	const VISUALIZATION_TYPES: Array<{ value: VisualizationType; label: string }> = [
		{ value: 'force', label: 'Force-directed' },
		{ value: 'sankey', label: 'Sankey' },
		{ value: 'network', label: 'Network' }
	];

	let container = $state<HTMLDivElement | null>(null);
	let containerWidth = $state(0);
	let collapsed = $state<string[]>([]);
	let librariesReady = $state(false);
	let errorMessage = $state('');
	let tooltip = $state({ visible: false, x: 0, y: 0, text: '' });

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let d3: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let d3Sankey: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let visNetwork: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let simulation: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let network: any = null;
	let resizeObserver: ResizeObserver | null = null;

	const sanitized = $derived(sanitizeGraph(data));
	const visibleData = $derived(applyCollapse(sanitized, collapsed));
	const nodeLegend = $derived(buildNodeLegend(visibleData, styles));
	const edgeLegend = $derived(buildEdgeLegend(visibleData, styles));
	const cssWidth = $derived(toCssSize(width));
	const cssHeight = $derived(toCssSize(height));

	function showTooltip(event: MouseEvent, text: string): void {
		if (!enableTooltips || !text) return;
		tooltip = { visible: true, x: event.offsetX + 12, y: event.offsetY + 12, text };
	}

	function moveTooltip(event: MouseEvent): void {
		if (!tooltip.visible) return;
		tooltip = { ...tooltip, x: event.offsetX + 12, y: event.offsetY + 12 };
	}

	function hideTooltip(): void {
		if (tooltip.visible) tooltip = { ...tooltip, visible: false };
	}

	function nodeTooltipText(node: Node): string {
		return node.title ?? node.label ?? node.id;
	}

	function edgeTooltipText(edge: Edge): string {
		return edge.title ?? edge.label ?? `${edge.from} → ${edge.to}`;
	}

	/** Toggle the subgraph of a node that has children. */
	export function toggleCollapse(id: string): void {
		if (!hasChildren(sanitized, id)) return;
		collapsed = collapsed.includes(id)
			? collapsed.filter((item) => item !== id)
			: [...collapsed, id];
	}

	function exportTarget(): SVGSVGElement | HTMLCanvasElement | null {
		if (!container) return null;
		return container.querySelector('svg') ?? container.querySelector('canvas');
	}

	/** Export the current visualisation as PNG. Size and resolution are configurable. */
	export function exportToPNG(options: string | ExportOptions = {}): boolean {
		const resolved = typeof options === 'string' ? { filename: options } : options;
		return exportGraphPng(exportTarget(), resolved);
	}

	/** Export the current visualisation as SVG. Size is configurable. */
	export function exportToSVG(options: string | ExportOptions = {}): boolean {
		const resolved = typeof options === 'string' ? { filename: options } : options;
		return exportGraphSvg(exportTarget(), resolved);
	}

	function teardown(): void {
		if (simulation) {
			simulation.stop();
			simulation = null;
		}
		if (network) {
			network.destroy();
			network = null;
		}
		// The canvas element is intentionally left empty in the markup: D3 and
		// vis-network own its children, so Svelte never has to track them.
		// eslint-disable-next-line svelte/no-dom-manipulating
		if (container) container.innerHTML = '';
		hideTooltip();
	}

	function createSvg(widthPx: number, heightPx: number) {
		return d3
			.select(container)
			.append('svg')
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('viewBox', [0, 0, widthPx, heightPx].join(' '))
			.attr('preserveAspectRatio', 'xMidYMid meet')
			.attr('role', 'img')
			.attr('aria-label', `${title} (${visualizationType})`);
	}

	function createForceGraph(widthPx: number, heightPx: number): void {
		const svg = createSvg(widthPx, heightPx);
		const root = svg.append('g');

		const nodes = visibleData.nodes.map((node) => ({ ...node }));
		const links = visibleData.edges.map((edge) => ({
			...edge,
			source: edge.from,
			target: edge.to
		}));

		const link = root
			.append('g')
			.attr('class', 'c-graph__links')
			.attr('stroke-opacity', 0.6)
			.selectAll('line')
			.data(links)
			.join('line')
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr('stroke', (d: any) => resolveEdgeStyle(d, styles).color)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr('stroke-width', (d: any) => resolveEdgeStyle(d, styles).width)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.on('click', (event: MouseEvent, d: any) => onEdgeClick?.(d as Edge, event))
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.on('mouseenter', (event: MouseEvent, d: any) => {
				onEdgeHover?.(d as Edge, event);
				showTooltip(event, edgeTooltipText(d as Edge));
			})
			.on('mousemove', moveTooltip)
			.on('mouseleave', hideTooltip);

		const edgeLabel = root
			.append('g')
			.attr('class', 'c-graph__edge-labels')
			.attr('text-anchor', 'middle')
			.attr('font-size', 9)
			.selectAll('text')
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.data(links.filter((d: any) => !!d.label))
			.join('text')
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.text((d: any) => d.label);

		const symbolByShape = {
			circle: d3.symbolCircle,
			square: d3.symbolSquare,
			diamond: d3.symbolDiamond,
			triangle: d3.symbolTriangle
		};

		const node = root
			.append('g')
			.attr('class', 'c-graph__nodes')
			.attr('stroke', '#ffffff')
			.attr('stroke-width', 1.5)
			.selectAll('path')
			.data(nodes)
			.join('path')
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr('d', (d: any) => {
				const style = resolveNodeStyle(d, styles);
				return d3
					.symbol()
					.type(symbolByShape[style.shape] ?? d3.symbolCircle)
					.size(style.size * style.size * 3)();
			})
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr('fill', (d: any) => resolveNodeStyle(d, styles).color)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr('class', (d: any) => (hasChildren(sanitized, d.id) ? 'is-collapsible' : null))
			.style('cursor', 'pointer')
			.call(dragBehaviour())
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.on('click', (event: MouseEvent, d: any) => onNodeClick?.(d as Node, event))
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.on('dblclick', (event: MouseEvent, d: any) => {
				event.stopPropagation();
				toggleCollapse(d.id);
			})
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.on('mouseenter', (event: MouseEvent, d: any) => {
				onNodeHover?.(d as Node, event);
				showTooltip(event, nodeTooltipText(d as Node));
			})
			.on('mousemove', moveTooltip)
			.on('mouseleave', hideTooltip);

		const label = root
			.append('g')
			.attr('class', 'c-graph__labels')
			.attr('text-anchor', 'middle')
			.attr('font-size', 10)
			.selectAll('text')
			.data(nodes)
			.join('text')
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.text((d: any) => (collapsed.includes(d.id) ? `${d.label ?? d.id} (+)` : (d.label ?? d.id)))
			.attr('dy', 22);

		simulation = d3
			.forceSimulation(nodes)
			.force(
				'link',
				d3
					.forceLink(links)
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.id((d: any) => d.id)
					.distance(options.linkDistance ?? 100)
			)
			.force('charge', d3.forceManyBody().strength(options.chargeStrength ?? -300))
			.force('center', d3.forceCenter(widthPx / 2, heightPx / 2))
			.force('collision', d3.forceCollide().radius(options.collisionRadius ?? 30));

		// Large graphs settle off-screen: ticking synchronously keeps the frame rate stable.
		if (nodes.length > 500) {
			simulation.stop();
			simulation.tick(Math.ceil(Math.log(0.001) / Math.log(1 - 0.0228)));
			renderPositions();
		}

		function renderPositions(): void {
			link
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.attr('x1', (d: any) => d.source.x)
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.attr('y1', (d: any) => d.source.y)
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.attr('x2', (d: any) => d.target.x)
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.attr('y2', (d: any) => d.target.y);

			edgeLabel
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.attr('x', (d: any) => (d.source.x + d.target.x) / 2)
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.attr('y', (d: any) => (d.source.y + d.target.y) / 2);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
		}

		simulation.on('tick', renderPositions);

		if (enableZoom) {
			svg.call(
				d3
					.zoom()
					.scaleExtent([0.1, 8])
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.on('zoom', (event: any) => root.attr('transform', event.transform))
			);
		}
	}

	function dragBehaviour() {
		return (
			d3
				.drag()
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.on('start', (event: any) => {
					if (!event.active) simulation?.alphaTarget(0.3).restart();
					event.subject.fx = event.subject.x;
					event.subject.fy = event.subject.y;
				})
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.on('drag', (event: any) => {
					event.subject.fx = event.x;
					event.subject.fy = event.y;
				})
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.on('end', (event: any) => {
					if (!event.active) simulation?.alphaTarget(0);
					event.subject.fx = null;
					event.subject.fy = null;
				})
		);
	}

	function createSankeyDiagram(widthPx: number, heightPx: number): void {
		const input = toSankeyInput(visibleData);
		if (!input) {
			errorMessage = 'Sankey view needs at least one relation between two different nodes.';
			return;
		}

		const svg = createSvg(widthPx, heightPx);
		const layout = d3Sankey
			.sankey()
			.nodeWidth(options.nodeWidth ?? 15)
			.nodePadding(options.nodePadding ?? 12)
			.extent([
				[1, 1],
				[widthPx - 1, heightPx - 6]
			]);

		const { nodes, links } = layout({ nodes: input.nodes, links: input.links });

		svg
			.append('g')
			.attr('fill', 'none')
			.attr('stroke-opacity', 0.5)
			.selectAll('path')
			.data(links)
			.join('path')
			.attr('d', d3Sankey.sankeyLinkHorizontal())
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr('stroke', (d: any) => resolveNodeStyle(d.source, styles).color)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr('stroke-width', (d: any) => Math.max(1, d.width))
			.style('cursor', 'pointer')
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.on('click', (event: MouseEvent, d: any) => onEdgeClick?.(d as Edge, event))
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.on('mouseenter', (event: MouseEvent, d: any) => {
				onEdgeHover?.(d as Edge, event);
				showTooltip(
					event,
					`${d.source.label ?? d.source.id} → ${d.target.label ?? d.target.id}: ${d.value}`
				);
			})
			.on('mousemove', moveTooltip)
			.on('mouseleave', hideTooltip);

		svg
			.append('g')
			.attr('stroke', '#ffffff')
			.selectAll('rect')
			.data(nodes)
			.join('rect')
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr('x', (d: any) => d.x0)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr('y', (d: any) => d.y0)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr('width', (d: any) => d.x1 - d.x0)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr('height', (d: any) => Math.max(1, d.y1 - d.y0))
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr('fill', (d: any) => resolveNodeStyle(d, styles).color)
			.style('cursor', 'pointer')
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.on('click', (event: MouseEvent, d: any) => onNodeClick?.(d as Node, event))
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.on('dblclick', (event: MouseEvent, d: any) => toggleCollapse(d.id))
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.on('mouseenter', (event: MouseEvent, d: any) => {
				onNodeHover?.(d as Node, event);
				showTooltip(event, `${nodeTooltipText(d as Node)}: ${d.value ?? 0}`);
			})
			.on('mousemove', moveTooltip)
			.on('mouseleave', hideTooltip);

		svg
			.append('g')
			.attr('font-size', 11)
			.selectAll('text')
			.data(nodes)
			.join('text')
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr('x', (d: any) => (d.x0 < widthPx / 2 ? d.x1 + 6 : d.x0 - 6))
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr('y', (d: any) => (d.y1 + d.y0) / 2)
			.attr('dy', '0.35em')
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.attr('text-anchor', (d: any) => (d.x0 < widthPx / 2 ? 'start' : 'end'))
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.text((d: any) => d.label ?? d.id);
	}

	function createNetworkView(): void {
		const { DataSet, Network } = visNetwork;

		const visNodes = new DataSet(
			visibleData.nodes.map((node) => {
				const style = resolveNodeStyle(node, styles);
				// `value` is intentionally dropped: vis-network would use it to rescale the
				// element, which conflicts with the size and width resolved from the styles.
				const rest = { ...node, value: undefined };
				return {
					...rest,
					id: node.id,
					label: collapsed.includes(node.id)
						? `${node.label ?? node.id} (+)`
						: (node.label ?? node.id),
					title: node.title,
					color: style.color,
					shape: toVisShape(style.shape),
					size: style.size * 1.6
				};
			})
		);

		const visEdges = new DataSet(
			visibleData.edges.map((edge) => {
				const style = resolveEdgeStyle(edge, styles);
				const rest = { ...edge, value: undefined };
				return {
					...rest,
					id: edge.id,
					from: edge.from,
					to: edge.to,
					label: edge.label,
					title: edge.title,
					color: style.color,
					width: style.width
				};
			})
		);

		network = new Network(
			container,
			{ nodes: visNodes, edges: visEdges },
			{
				nodes: { font: { face: 'inherit', size: 14 } },
				edges: {
					arrows: { to: { enabled: true, scaleFactor: 0.8 } },
					smooth: { type: 'continuous' }
				},
				// Physics is costly above a few hundred nodes, so it is disabled for large graphs.
				physics: {
					enabled: visibleData.nodes.length <= 500,
					stabilization: { iterations: 100 }
				},
				interaction: {
					hover: enableTooltips,
					tooltipDelay: 200,
					dragNodes: true,
					dragView: enableZoom,
					zoomView: enableZoom
				},
				...options
			}
		);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		network.on('click', (params: any) => {
			const event = params.event?.srcEvent as MouseEvent;
			const nodeId = params.nodes?.[0];
			if (nodeId !== undefined) {
				const node = visibleData.nodes.find((item) => item.id === nodeId);
				if (node) onNodeClick?.(node, event);
				return;
			}
			const edgeId = params.edges?.[0];
			const edge = visibleData.edges.find((item) => item.id === edgeId);
			if (edge) onEdgeClick?.(edge, event);
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		network.on('doubleClick', (params: any) => {
			const nodeId = params.nodes?.[0];
			if (nodeId !== undefined) toggleCollapse(String(nodeId));
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		network.on('hoverNode', (params: any) => {
			const node = visibleData.nodes.find((item) => item.id === params.node);
			if (node) onNodeHover?.(node, params.event?.srcEvent as MouseEvent);
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		network.on('hoverEdge', (params: any) => {
			const edge = visibleData.edges.find((item) => item.id === params.edge);
			if (edge) onEdgeHover?.(edge, params.event?.srcEvent as MouseEvent);
		});
	}

	function render(): void {
		if (!container || !librariesReady) return;

		teardown();
		errorMessage = '';

		const widthPx = Math.max(1, Math.round(toPx(width, containerWidth, 800)));
		const heightPx = Math.max(1, Math.round(toPx(height, container.clientHeight, 600)));

		if (visibleData.nodes.length === 0) return;

		try {
			if (visualizationType === 'sankey') {
				createSankeyDiagram(widthPx, heightPx);
			} else if (visualizationType === 'network') {
				createNetworkView();
			} else {
				createForceGraph(widthPx, heightPx);
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to render the graph.';
		}
	}

	onMount(async () => {
		// Dynamic imports keep the component SSR safe: D3 and vis-network need a DOM.
		[d3, d3Sankey, visNetwork] = await Promise.all([
			import('d3'),
			import('d3-sankey'),
			import('vis-network/standalone')
		]);
		librariesReady = true;

		if (container) {
			containerWidth = container.clientWidth;
			resizeObserver = new ResizeObserver((entries) => {
				const next = Math.round(entries[0].contentRect.width);
				if (next !== containerWidth) containerWidth = next;
			});
			resizeObserver.observe(container);
		}
	});

	$effect(() => {
		// Re-render whenever the inputs of the visualisation change.
		void [
			visibleData,
			visualizationType,
			enableZoom,
			enableTooltips,
			styles,
			containerWidth,
			librariesReady
		];
		// `untrack` keeps the rendering side effects (tooltip reset, error message)
		// from becoming dependencies of this effect and re-triggering it.
		untrack(render);
	});

	onDestroy(() => {
		if (browser) {
			resizeObserver?.disconnect();
			teardown();
		}
	});
</script>

<div class="c-graph" style="width: {cssWidth};">
	<div class="c-graph__header">
		<h3 class="c-graph__title">{title}</h3>

		{#if showToolbar}
			<div class="c-graph__toolbar">
				<label class="c-graph__field">
					<span class="c-graph__field-label">View</span>
					<select
						class="c-graph__select"
						bind:value={visualizationType}
						aria-label="Visualization type"
					>
						{#each VISUALIZATION_TYPES as type (type.value)}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</label>

				<button type="button" class="c-graph__button" onclick={() => exportToPNG()}
					>Export PNG</button
				>
				<button type="button" class="c-graph__button" onclick={() => exportToSVG()}
					>Export SVG</button
				>

				{#if collapsed.length > 0}
					<button type="button" class="c-graph__button" onclick={() => (collapsed = [])}>
						Expand all
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<div class="c-graph__stage" style="height: {cssHeight};">
		<div bind:this={container} class="c-graph__canvas" data-testid="graph-canvas"></div>

		{#if !librariesReady}
			<p class="c-graph__status">Loading visualization…</p>
		{:else if visibleData.nodes.length === 0}
			<p class="c-graph__status">No data to display.</p>
		{:else if errorMessage}
			<p class="c-graph__status c-graph__status--error">{errorMessage}</p>
		{/if}

		{#if enableTooltips && tooltip.visible}
			<div class="c-graph__tooltip" style="left: {tooltip.x}px; top: {tooltip.y}px;" role="tooltip">
				{tooltip.text}
			</div>
		{/if}
	</div>

	{#if showLegend && (nodeLegend.length > 0 || edgeLegend.length > 0)}
		<div class="c-graph__legend">
			{#each nodeLegend as item (item.key)}
				<span class="c-graph__legend-item">
					<span class="c-graph__legend-swatch" style="background: {item.color};"></span>
					{item.label}
				</span>
			{/each}
			{#each edgeLegend as item (item.key)}
				<span class="c-graph__legend-item">
					<span class="c-graph__legend-line" style="background: {item.color};"></span>
					{item.label}
				</span>
			{/each}
		</div>
	{/if}
</div>

<style>
	.c-graph {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		color: var(--color-text-primary);
	}

	.c-graph__header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.c-graph__title {
		font-size: 1.125rem;
		font-weight: 600;
	}

	.c-graph__toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.c-graph__field {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.c-graph__field-label {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
	}

	.c-graph__select,
	.c-graph__button {
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-md);
		background: var(--color-background-primary);
		color: var(--color-text-primary);
		padding: 0.375rem 0.625rem;
		font: inherit;
		font-size: 0.875rem;
	}

	.c-graph__button {
		cursor: pointer;
	}

	.c-graph__button:hover {
		background: var(--color-background-secondary);
	}

	.c-graph__stage {
		position: relative;
		min-height: 240px;
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-lg);
		background: var(--color-background-primary);
		overflow: hidden;
	}

	.c-graph__canvas {
		width: 100%;
		height: 100%;
	}

	.c-graph__status {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-secondary);
		pointer-events: none;
	}

	.c-graph__status--error {
		color: #dc2626;
	}

	.c-graph__tooltip {
		position: absolute;
		z-index: 10;
		max-width: 18rem;
		padding: 0.375rem 0.5rem;
		border-radius: var(--radius-md);
		background: rgba(17, 24, 39, 0.92);
		color: #ffffff;
		font-size: 0.75rem;
		pointer-events: none;
	}

	.c-graph__legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
	}

	.c-graph__legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
	}

	.c-graph__legend-swatch {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
	}

	.c-graph__legend-line {
		width: 1rem;
		height: 0.125rem;
	}

	@media (max-width: 640px) {
		.c-graph__header {
			align-items: flex-start;
			flex-direction: column;
		}
	}
</style>
