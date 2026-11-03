<script lang="ts">
	import type { HTMLImgAttributes, SVGAttributes } from 'svelte/elements';
	import { _parts } from './core/blobatar';
	import { blobatarUri } from './core/uri';
	import type { BlobProps } from './types';

	let {
		name,
		size,
		background,
		backgroundColor,
		palette,
		hue,
		tone,
		normalize,
		contrast,
		title,
		animate,
		expression,
		traits,
		class: className,
		style: styleAttr,
		...rest
	}: BlobProps = $props();

	let opts = $derived({
		size,
		background,
		backgroundColor,
		palette,
		hue,
		tone,
		normalize,
		contrast,
		title,
		expression,
		traits
	});

	let src = $derived(animate ? '' : blobatarUri(name, opts));
	let parts = $derived(animate ? _parts(name, { ...opts, animate }) : null);
	let svgRest = $derived(rest as SVGAttributes<SVGSVGElement>);
	let imgRest = $derived.by(() => {
		const { alt: _, ...forwarded } = rest as HTMLImgAttributes;
		return forwarded;
	});
	let alt = $derived((rest as HTMLImgAttributes).alt ?? title ?? '');
	let styleStr = $derived(
		[
			...Object.entries(parts?.vars ?? {}).map(([k, v]) => `${k}:${v}`),
			...(styleAttr ? [styleAttr] : [])
		].join(';')
	);
</script>

{#if parts}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 100 100"
		width={size}
		height={size}
		role={title ? 'img' : undefined}
		aria-hidden={title ? undefined : true}
		class={className}
		style={styleStr}
		{...svgRest}
	>
		{#if title}
			<title>{title}</title>
		{/if}
		{#if parts.bg}
			<path d={parts.bg.d} fill={parts.bg.fill} />
		{/if}
		<g class={parts.cls}>
			{@html parts.inner}
		</g>
	</svg>
{:else}
	<img {src} width={size} height={size} {alt} class={className} style={styleAttr} {...imgRest} />
{/if}
