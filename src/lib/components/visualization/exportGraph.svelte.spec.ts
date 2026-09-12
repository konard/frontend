import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportGraphPng, exportGraphSvg } from './exportGraph';

/** Capture the download instead of letting the browser navigate. */
function captureDownload(): { calls: Array<{ href: string; download: string }> } {
	const calls: Array<{ href: string; download: string }> = [];
	const original = HTMLAnchorElement.prototype.click;

	vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
		this: HTMLAnchorElement
	) {
		calls.push({ href: this.href, download: this.download });
	});

	// Keep a reference so the spy restore in afterEach is meaningful.
	expect(original).toBeTypeOf('function');
	return { calls };
}

function createSvg(): SVGSVGElement {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('width', '400');
	svg.setAttribute('height', '300');
	svg.setAttribute('viewBox', '0 0 400 300');
	document.body.appendChild(svg);
	return svg;
}

function createCanvas(): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = 400;
	canvas.height = 300;
	document.body.appendChild(canvas);
	return canvas;
}

describe('exportGraphSvg', () => {
	let download: { calls: Array<{ href: string; download: string }> };

	beforeEach(() => {
		download = captureDownload();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		document.body.querySelectorAll('svg, canvas').forEach((element) => element.remove());
	});

	it('does nothing without an element', () => {
		expect(exportGraphSvg(null)).toBe(false);
	});

	it('downloads an svg document for an svg visualization', () => {
		expect(exportGraphSvg(createSvg(), { filename: 'ontology.svg' })).toBe(true);
		expect(download.calls).toHaveLength(1);
		expect(download.calls[0].download).toBe('ontology.svg');
		expect(decodeURIComponent(download.calls[0].href)).toContain('<svg');
	});

	it('wraps a canvas visualization into an svg document', () => {
		expect(exportGraphSvg(createCanvas(), { width: 800, height: 600 })).toBe(true);

		const source = decodeURIComponent(download.calls[0].href);
		expect(source).toContain('width="800"');
		expect(source).toContain('data:image/png');
	});
});

describe('exportGraphPng', () => {
	let download: { calls: Array<{ href: string; download: string }> };

	beforeEach(() => {
		download = captureDownload();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		document.body.querySelectorAll('svg, canvas').forEach((element) => element.remove());
	});

	it('does nothing without an element', () => {
		expect(exportGraphPng(null)).toBe(false);
	});

	it('rasterises a canvas visualization at the requested resolution', () => {
		expect(exportGraphPng(createCanvas(), { filename: 'ontology', scale: 2 })).toBe(true);
		expect(download.calls[0].download).toBe('ontology.png');
		expect(download.calls[0].href.startsWith('data:image/png')).toBe(true);
	});

	it('rasterises an svg visualization', async () => {
		expect(exportGraphPng(createSvg(), { filename: 'ontology' })).toBe(true);

		// The svg is drawn once the intermediate image has loaded.
		await expect.poll(() => download.calls.length, { timeout: 5000 }).toBe(1);
		expect(download.calls[0].download).toBe('ontology.png');
	});
});
