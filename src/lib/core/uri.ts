import { blobatar, type BlobatarOptions } from "./blobatar";

export function blobatarUri(name: string, opts?: BlobatarOptions): string {
  const svg = blobatar(name, opts)
    .replace(/"/g, "'")
    .replace(/[%#<>{}|\\^[\]`]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  return "data:image/svg+xml," + svg.replace(/\s+/g, " ");
}
