# blob

Deterministic blob avatars for Facile tools. One name always draws the same blob, in the browser and in the terminal.

The repo ships two things:

- `@facile/blob`: a Svelte 5 package, consumed from source like `@facile/muse`
- `github.com/FacileStudio/blob`: a Go package that draws the same blob as SVG or as truecolor pixel art for CLIs

Byte-identical SVG on both sides means the web and the CLI cannot drift.

## Svelte

```sh
bun add github:FacileStudio/blob#v0.1.0
```

```svelte
<script lang="ts">
	import '@facile/blob/motion.css';
	import '@facile/blob/gaze.css';
	import { Blob, gaze } from '@facile/blob';

	const eyes = gaze({ travel: 6, target: 'pointer' });
</script>

<Blob name="Bulle" size={64} />
<Blob {@attach eyes} name="Bulle" size={128} animate="always" />
```

Without `animate` the component renders a static `<img>` with a data URI. With `animate="hover"` or `"always"` it renders inline SVG, which `motion.css` animates and `gaze` steers.

Other exports: `blob(name, opts)` returns SVG markup, `blobUri` returns a data URI, `parts` returns the inner markup for icon sets, and the expressions (`happy`, `sad`, `wink`, ...) go in the `expression` prop.

## Go

```sh
go get github.com/FacileStudio/blob
```

```go
b := blob.New("Bulle", blob.Options{})
fmt.Println(b.Terminal(24))
svg := b.SVG()
```

`Terminal(size)` rasterizes the blob so its wider side spans `size` pixels, on a grid centred on the blob itself so round shapes stay symmetric, and prints two pixels per cell with half blocks and 24-bit colour. `Pixels(size)` returns the grid itself.

Try it:

```sh
go run github.com/FacileStudio/blob/cmd/blob@latest Bulle
```

## Develop

```sh
mise run check
```

That runs `svelte-check`, the Bun golden test, `go vet` and the Go golden test.

## Release

The git tag is the distribution for both ecosystems: Bun pins `github:FacileStudio/blob#vX.Y.Z` and Go resolves the same `vX.Y.Z` tag.
