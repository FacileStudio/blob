import type { HTMLImgAttributes, SVGAttributes } from 'svelte/elements';
import type { BlobatarOptions } from './core/render';

/** Props of the `Blob` component: every core option plus the attributes of the element it renders. */
export type BlobProps = BlobatarOptions & {
	name: string;
	class?: string;
	style?: string;
} & Omit<SVGAttributes<SVGSVGElement> & HTMLImgAttributes, keyof BlobatarOptions | 'class' | 'style'>;
