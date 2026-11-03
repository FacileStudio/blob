package blob

import "math"

// Pixel is one cell of a rasterized blob. Filled is false where the blob is not.
type Pixel struct {
	Color  RGB
	Filled bool
}

// Image is a pixel grid, row-major, cropped to the blob's bounds.
type Image struct {
	Width, Height int
	Pix           []Pixel
}

// At returns the pixel at column x, row y.
func (m Image) At(x, y int) Pixel { return m.Pix[y*m.Width+x] }

const samples = 8

type grid struct {
	x0, y0, cell float64
	w, h         int
}

func (g grid) toPixel(x, y float64) (float64, float64) {
	return (x - g.x0) / g.cell, (y - g.y0) / g.cell
}

// Pixels rasterizes the blob so its wider side spans size pixels. The grid is
// fitted and centred on the blob's own bounds, so a round blob lands
// symmetric instead of being cut wherever the viewBox grid happens to fall.
func (b Blob) Pixels(size int) Image {
	head := make([][]point, 0, len(b.layout.extra)+1)
	for _, p := range b.layout.extra {
		head = append(head, p.polygon())
	}
	head = append(head, b.layout.body.polygon())
	g := b.fit(head, max(size, 4))
	out := Image{Width: g.w, Height: g.h, Pix: make([]Pixel, g.w*g.h)}
	for y := range g.h {
		for x := range g.w {
			if b.coverage(head, g, x, y)*2 >= samples*samples {
				out.Pix[y*g.w+x] = Pixel{Color: b.Palette.Head, Filled: true}
			}
		}
	}
	for _, e := range b.layout.eyes {
		b.stampEye(&out, g, e)
	}
	return out.cropped()
}

func (b Blob) fit(head [][]point, size int) grid {
	minX, minY, maxX, maxY := math.Inf(1), math.Inf(1), math.Inf(-1), math.Inf(-1)
	grow := func(x0, y0, x1, y1 float64) {
		minX, minY, maxX, maxY = min(minX, x0), min(minY, y0), max(maxX, x1), max(maxY, y1)
	}
	for _, poly := range head {
		for _, p := range poly {
			grow(p.x, p.y, p.x, p.y)
		}
	}
	for _, c := range b.layout.petals {
		grow(c.cx-c.r, c.cy-c.r, c.cx+c.r, c.cy+c.r)
	}
	cell := max(maxX-minX, maxY-minY) / float64(size)
	w := int(math.Ceil((maxX - minX) / cell))
	h := int(math.Ceil((maxY - minY) / cell))
	return grid{
		x0:   (minX+maxX)/2 - float64(w)*cell/2,
		y0:   (minY+maxY)/2 - float64(h)*cell/2,
		cell: cell, w: w, h: h,
	}
}

func (b Blob) coverage(head [][]point, g grid, x, y int) int {
	n := 0
	for sy := range samples {
		for sx := range samples {
			p := point{
				g.x0 + (float64(x)+(float64(sx)+0.5)/samples)*g.cell,
				g.y0 + (float64(y)+(float64(sy)+0.5)/samples)*g.cell,
			}
			if insideAny(head, p) || b.inPetal(p) {
				n++
			}
		}
	}
	return n
}

// stampEye draws an eye as a pixel block of whole pixels, snapped so that two
// eyes of the same size always get the same footprint whatever their
// sub-pixel position. Blocks of three or more pixels lose their corners.
func (b Blob) stampEye(m *Image, g grid, e eye) {
	cx, cy := g.toPixel(e.cx, e.cy)
	w := max(1, int(math.Round(2*e.rx/g.cell)))
	h := max(1, int(math.Round(2*e.ry/g.cell)))
	left := int(math.Round(cx - float64(w)/2))
	top := int(math.Round(cy - float64(h)/2))
	for y := range h {
		for x := range w {
			corner := (x == 0 || x == w-1) && (y == 0 || y == h-1)
			if corner && w >= 3 && h >= 3 {
				continue
			}
			px, py := left+x, top+y
			if px < 0 || py < 0 || px >= m.Width || py >= m.Height || !m.At(px, py).Filled {
				continue
			}
			m.Pix[py*m.Width+px].Color = b.Palette.Eye
		}
	}
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
