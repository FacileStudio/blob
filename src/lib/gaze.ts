import type { Attachment } from 'svelte/attachments';
import { gaze as start, type Gaze, type GazeTarget } from './core/gaze';

export type { GazeTarget };

export interface GazeAttachmentOptions {
	settle?: number;
	snap?: number;
	travel?: number;
	target?: GazeTarget;
}

export type GazeAttachment = Attachment<Element> & {
	lookAt: (target: GazeTarget) => void;
	remeasure: () => void;
};

/**
 * Builds a Svelte attachment that makes an animated `Blob` follow a target with its eyes.
 * Attach it with `{@attach eyes}` and steer it later with `eyes.lookAt(target)`.
 */
export function gaze(options: GazeAttachmentOptions = {}): GazeAttachment {
	const { settle, snap, travel, target = null } = options;
	let aimed: GazeTarget = target;
	let driver: Gaze | null = null;

	const attach = ((node: Element) => {
		if (node.tagName !== 'svg') return;
		const root = (node.querySelector('g.mo-root') ?? node) as SVGElement;
		if (travel !== undefined) root.style.setProperty('--mo-track-travel', `${travel}px`);
		const g = start(node as SVGSVGElement, { settle, snap, target: aimed });
		driver = g;
		return () => {
			if (driver === g) driver = null;
			g.stop();
			if (travel !== undefined) root.style.removeProperty('--mo-track-travel');
		};
	}) as GazeAttachment;

	attach.lookAt = (t) => {
		aimed = t;
		driver?.lookAt(t);
	};
	attach.remeasure = () => driver?.remeasure();
	return attach;
}
