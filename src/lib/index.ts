export { default as Blob } from './Blob.svelte';
export type { BlobProps } from './types';
export { gaze, type GazeAttachment, type GazeAttachmentOptions, type GazeTarget } from './gaze';
export { blobatar as blob, _parts as parts, _marks as marks, _layout as layout } from './core/blobatar';
export type { Animate, BlobatarOptions as BlobOptions, Expression, Mark } from './core/blobatar';
export { blobatarUri as blobUri } from './core/uri';
export { palette, ramp, contrast, type Palette, type Oklch } from './core/color';
export { traits, type Traits, type TraitOverrides } from './core/traits';
export { normalizeSeed } from './core/hash';
export {
	idle, happy, sad, mad, surprised, wink, sleepy, smug, unsure, scared, love, shy, sick, thinking
} from './core/expression';
