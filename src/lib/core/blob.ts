import { makeBlobatar, type BlobatarOptions } from "./render";
import { style } from "./styles/blob";
import type { Layout } from "./styles/compose";
import type { Traits } from "./traits";

export type { BlobatarOptions };
export type { TraitOverrides } from "./traits";

export type Shape =
  | "round" | "boxy" | "organic" | "cloud" | "sun" | "nub"
  | "capsule" | "triangle" | "hexagon" | "droplet";

export const blobatar = makeBlobatar(style);

export const layout = style.layout as (
  t: Traits,
) => Omit<Layout, "shape"> & { shape: Shape };
