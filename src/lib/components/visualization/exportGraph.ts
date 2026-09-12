import { exportSvg, exportPng } from '$lib/utils/export';
import { resolveExportSize, toBaseFilename } from './graph';
import type { ExportOptions } from './types';

/** Rendered size of the element that is about to be exported. */
function renderedSize(element: SVGSVGElement | HTMLCanvasElement): {
	width: number;
	height: number;
} {
	if (element instanceof HTMLCanvasElement) {
		return { width: element.width, height: element.height };
	}

	const rect = element.getBoundingClientRect();
	return {
		width: Math.round(rect.width) || Number(element.getAttribute('width')) || 800,
		height: Math.round(rect.height) || Number(element.getAttribute('height')) || 600
	};
}

function download(href: string, filename: string): void {
	const link = document.createElement('a');
	link.href = href;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

/**
 * Export as SVG. A canvas based visualisation (vis-network) is wrapped into an
 * SVG document holding the rasterised frame, so every visualisation type exports.
 */
export function exportGraphSvg(
	element: SVGSVGElement | HTMLCanvasElement | null,
	options: ExportOptions = {}
): boolean {
	if (!element) return false;

	const name = toBaseFilename(options.filename, 'graph-visualization');
	const { width, height } = resolveExportSize(renderedSize(element), { ...options, scale: 1 });

	if (element instanceof HTMLCanvasElement) {
		const source =
			`<?xml version="1.0" standalone="no"?>\r\n` +
			`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
			`width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
			`<image width="${width}" height="${height}" xlink:href="${element.toDataURL('image/png')}"/>` +
			`</svg>`;
		download(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`, `${name}.svg`);
		return true;
	}

	const clone = element.cloneNode(true) as SVGSVGElement;
	clone.setAttribute('width', String(width));
	clone.setAttribute('height', String(height));
	exportSvg(clone, name);
	return true;
}

/** Export as PNG, honouring the configurable size and resolution (`scale`). */
export function exportGraphPng(
	element: SVGSVGElement | HTMLCanvasElement | null,
	options: ExportOptions = {}
): boolean {
	if (!element) return false;

	const name = toBaseFilename(options.filename, 'graph-visualization');
	const { width, height } = resolveExportSize(renderedSize(element), options);

	if (element instanceof HTMLCanvasElement) {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		if (!ctx) return false;
		ctx.drawImage(element, 0, 0, width, height);
		download(canvas.toDataURL('image/png'), `${name}.png`);
		return true;
	}

	exportPng(element, name, width, height);
	return true;
}
