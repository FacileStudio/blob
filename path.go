package blob

import (
	"math"
	"strconv"
	"strings"
)

type command struct {
	op   byte
	args []float64
}

type path []command

type point struct{ x, y float64 }

func r2(v float64) string {
	s := math.Floor(v*100+0.5) / 100
	if s == 0 {
		return "0"
	}
	return strconv.FormatFloat(s, 'f', -1, 64)
}

func (p path) String() string {
	var b strings.Builder
	for _, c := range p {
		b.WriteByte(c.op)
		for i, v := range c.args {
			if i > 0 {
				b.WriteByte(' ')
			}
			b.WriteString(r2(v))
		}
	}
	return b.String()
}

func (p path) polygon() []point {
	var out []point
	var at point
	for _, c := range p {
		a := c.args
		switch c.op {
		case 'M', 'L':
			at = point{a[0], a[1]}
			out = append(out, at)
		case 'H':
			at = point{a[0], at.y}
			out = append(out, at)
		case 'V':
			at = point{at.x, a[0]}
			out = append(out, at)
		case 'Q':
			out = append(out, curve(at, []point{{a[0], a[1]}, {a[2], a[3]}})...)
			at = point{a[2], a[3]}
		case 'C':
			out = append(out, curve(at, []point{{a[0], a[1]}, {a[2], a[3]}, {a[4], a[5]}})...)
			at = point{a[4], a[5]}
		}
	}
	return out
}

func curve(from point, rest []point) []point {
	const steps = 16
	ctrl := append([]point{from}, rest...)
	out := make([]point, 0, steps)
	for i := 1; i <= steps; i++ {
		out = append(out, casteljau(ctrl, float64(i)/steps))
	}
	return out
}

func casteljau(ctrl []point, t float64) point {
	pts := append([]point(nil), ctrl...)
	for n := len(pts) - 1; n > 0; n-- {
		for i := range n {
			pts[i] = point{pts[i].x + (pts[i+1].x-pts[i].x)*t, pts[i].y + (pts[i+1].y-pts[i].y)*t}
		}
	}
	return pts[0]
}

func superellipse(cx, cy, rx, ry, n, rot float64) path {
	k := math.Min(1, (8*math.Pow(2, -1/n)-4)/3)
	ak, bk := rx*k, ry*k
	pts := [13][2]float64{
		{rx, 0},
		{rx, bk}, {ak, ry}, {0, ry},
		{-ak, ry}, {-rx, bk}, {-rx, 0},
		{-rx, -bk}, {-ak, -ry}, {0, -ry},
		{ak, -ry}, {rx, -bk}, {rx, 0},
	}
	t := (rot * math.Pi) / 180
	cos, sin := math.Cos(t), math.Sin(t)
	at := func(i int) []float64 {
		x, y := pts[i][0], pts[i][1]
		return []float64{cx + x*cos - y*sin, cy + x*sin + y*cos}
	}
	p := path{{'M', at(0)}}
	for i := 1; i < 13; i += 3 {
		p = append(p, command{'C', append(append(at(i), at(i+1)...), at(i+2)...)})
	}
	return append(p, command{op: 'Z'})
}

func blobPath(cx, cy, rx, ry float64, radii []float64, rot float64) path {
	n := len(radii)
	t0 := (rot * math.Pi) / 180
	pts := make([]point, n)
	for i, m := range radii {
		a := t0 + (2*math.Pi*float64(i))/float64(n)
		pts[i] = point{cx + rx*m*math.Cos(a), cy + ry*m*math.Sin(a)}
	}
	at := func(i int) point { return pts[((i%n)+n)%n] }
	p := path{{'M', []float64{at(0).x, at(0).y}}}
	for i := range n {
		p0, p1, p2, p3 := at(i-1), at(i), at(i+1), at(i+2)
		p = append(p, command{'C', []float64{
			p1.x + (p2.x-p0.x)/6, p1.y + (p2.y-p0.y)/6,
			p2.x - (p3.x-p1.x)/6, p2.y - (p3.y-p1.y)/6,
			p2.x, p2.y,
		}})
	}
	return append(p, command{op: 'Z'})
}

func polygon(cx, cy, rx, ry float64, sides int, round, rot float64) path {
	k := 0.0
	if round > 0 {
		k = 0.5
		if round < 1 {
			k = round / 2
		}
	}
	t0 := (rot*math.Pi)/180 - math.Pi/2
	v := make([]point, sides)
	for i := range v {
		a := t0 + (2*math.Pi*float64(i))/float64(sides)
		v[i] = point{cx + rx*math.Cos(a), cy + ry*math.Sin(a)}
	}
	at := func(i int) point { return v[((i%sides)+sides)%sides] }
	cut := func(i, j int) []float64 {
		a, b := at(i), at(j)
		return []float64{a.x + (b.x-a.x)*k, a.y + (b.y-a.y)*k}
	}
	p := path{{'M', cut(0, -1)}}
	for i := range sides {
		c := at(i)
		p = append(p, command{'Q', append([]float64{c.x, c.y}, cut(i, i+1)...)})
		if k < 0.5 {
			p = append(p, command{'L', cut(i+1, i)})
		}
	}
	return append(p, command{op: 'Z'})
}

func box(cx, cy, rx, ry float64) path {
	l, r := cx-rx, cx+rx
	return path{{'M', []float64{l, cy - ry}}, {'H', []float64{r}}, {'V', []float64{cy + ry}}, {'H', []float64{l}}, {op: 'Z'}}
}

func taper(cx, cy, rx, ry, tip float64) path {
	t := math.Max(1.05, tip)
	tx := rx * math.Sqrt(1-1/(t*t))
	ty := cy - ry/t
	apex := cy - t*ry
	px := tx * 0.14
	py := ty + 0.86*(apex-ty)
	return path{
		{'M', []float64{cx - tx, ty}},
		{'L', []float64{cx - px, py}},
		{'Q', []float64{cx, apex, cx + px, py}},
		{'L', []float64{cx + tx, ty}},
		{op: 'Z'},
	}
}
