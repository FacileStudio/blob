package blob

import "math"

// Pixel is one cell of a rasterized blob. Filled is false where the blob is not.
type Pixel struct {
	Color  RGB
	Filled bool
}

// Image is a square pixel grid, row-major, cropped to the blob's bounds.
type Image struct {
	Width, Height int
	Pix           []Pixel
}

// At returns the pixel at column x, row y.
func (m Image) At(x, y int) Pixel { return m.Pix[y*m.Width+x] }

const samples = 4

// Pixels rasterizes the blob onto a size×size grid over its 100×100 viewBox,
// then crops the empty margin.
func (b Blob) Pixels(size int) Image {
	head := make([][]point, 0, len(b.layout.extra)+1)
	for _, p := range b.layout.extra {
		head = append(head, p.polygon())
	}
	head = append(head, b.layout.body.polygon())
	eyes := make([][]point, len(b.layout.eyes))
	for i, e := range b.layout.eyes {
		eyes[i] = superellipse(e.cx, e.cy, e.rx, e.ry, e.n, e.rot).polygon()
	}
	full := Image{Width: size, Height: size, Pix: make([]Pixel, size*size)}
	cell := 100 / float64(size)
	for y := range size {
		for x := range size {
			var inHead, inEye int
			for sy := range samples {
				for sx := range samples {
					p := point{(float64(x) + (float64(sx)+0.5)/samples) * cell, (float64(y) + (float64(sy)+0.5)/samples) * cell}
					switch {
					case insideAny(eyes, p):
						inEye++
					case insideAny(head, p) || b.inPetal(p):
						inHead++
					}
				}
			}
			full.Pix[y*size+x] = b.shade(inHead, inEye)
		}
	}
	return full.cropped()
}

func (b Blob) shade(inHead, inEye int) Pixel {
	const total = samples * samples
	switch {
	case inEye*10 >= total*3:
		return Pixel{Color: b.Palette.Eye, Filled: true}
	case (inHead+inEye)*2 >= total:
		return Pixel{Color: b.Palette.Head, Filled: true}
	}
	return Pixel{}
}

func (b Blob) inPetal(p point) bool {
	for _, c := range b.layout.petals {
		if math.Hypot(p.x-c.cx, p.y-c.cy) <= c.r {
			return true
		}
	}
	return false
}

func insideAny(polys [][]point, p point) bool {
	for _, poly := range polys {
		if inside(poly, p) {
			return true
		}
	}
	return false
}

func inside(poly []point, p point) bool {
	in := false
	for i, j := 0, len(poly)-1; i < len(poly); j, i = i, i+1 {
		a, b := poly[i], poly[j]
		if (a.y > p.y) != (b.y > p.y) && p.x < (b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x {
			in = !in
		}
	}
	return in
}

func (m Image) cropped() Image {
	minX, minY, maxX, maxY := m.Width, m.Height, -1, -1
	for y := range m.Height {
		for x := range m.Width {
			if m.At(x, y).Filled {
				minX, minY = min(minX, x), min(minY, y)
				maxX, maxY = max(maxX, x), max(maxY, y)
			}
		}
	}
	if maxX < 0 {
		return Image{}
	}
	out := Image{Width: maxX - minX + 1, Height: maxY - minY + 1}
	for y := minY; y <= maxY; y++ {
		out.Pix = append(out.Pix, m.Pix[y*m.Width+minX:y*m.Width+maxX+1]...)
	}
	return out
}
