// Package blob draws the same deterministic blob avatars as the @facile/blob
// Svelte package: as SVG markup, as a pixel grid, or as truecolor terminal art.
package blob

import (
	"fmt"
	"strings"
)

// Options tune a blob. The zero value draws the blob the name seeds.
type Options struct {
	// Traits pins individual traits to a position in [0, 1), keyed as the
	// layout reads them, e.g. {"shape": 0.95} for a sun.
	Traits map[string]float64
}

// Blob is the resolved geometry and palette for one name.
type Blob struct {
	Shape   string
	Palette Palette
	layout  layout
}

// New resolves the blob a name seeds.
func New(name string, opts Options) Blob {
	t := newTraits(name, opts.Traits)
	l := build(t)
	return Blob{Shape: l.shape, Palette: palette(t.num("hue", 0, 360), t.at("tone")), layout: l}
}

// SVG renders the blob as markup identical to @facile/blob's static render.
func (b Blob) SVG() string {
	var s strings.Builder
	fmt.Fprintf(&s, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="%s">`, b.Palette.Head.Hex())
	for _, c := range b.layout.petals {
		fmt.Fprintf(&s, `<circle cx="%s" cy="%s" r="%s"/>`, r2(c.cx), r2(c.cy), r2(c.r))
	}
	for _, p := range b.layout.extra {
		fmt.Fprintf(&s, `<path d="%s"/>`, p)
	}
	fmt.Fprintf(&s, `<path d="%s"/></g><g fill="%s">`, b.layout.body, b.Palette.Eye.Hex())
	for _, e := range b.layout.eyes {
		fmt.Fprintf(&s, `<path d="%s"/>`, superellipse(e.cx, e.cy, e.rx, e.ry, e.n, e.rot))
	}
	s.WriteString(`</g></svg>`)
	return s.String()
}
