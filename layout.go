package blob

import (
	"math"
	"slices"
)

type body struct {
	cx, cy, rx, ry, n, rot float64
	radii                  []float64
	sides                  int
	round                  float64
}

type ellipse struct{ cx, cy, rx, ry float64 }

type circle struct{ cx, cy, r float64 }

type eye struct{ cx, cy, rx, ry, n, rot float64 }

type shape struct {
	name     string
	core     float64
	adjust   func(t traits, b *body)
	face     func(b body) ellipse
	decorate func(t traits, b body) ([]circle, []path)
	draw     func(b body) path
}

type layout struct {
	shape  string
	body   path
	petals []circle
	extra  []path
	eyes   []eye
}

func shrunk(k float64) func(b body) ellipse {
	return func(b body) ellipse { return ellipse{b.cx, b.cy, b.rx * k, b.ry * k} }
}

func splineFace(b body) ellipse { return shrunk(slices.Min(b.radii) * 0.95)(b) }

func spline(b body) path { return blobPath(b.cx, b.cy, b.rx, b.ry, b.radii, b.rot) }

func poly(b body) path { return polygon(b.cx, b.cy, b.rx, b.ry, b.sides, b.round, b.rot) }

func ring(t traits, prefix string, count int, at func(i int, r float64) circle, lo, hi float64) []circle {
	out := make([]circle, count)
	for i := range count {
		out[i] = at(i, t.num(indexed(prefix, i), lo, hi))
	}
	return out
}

var bands = []struct {
	shape shape
	upTo  float64
}{
	{shape{name: "round", core: 1}, 0.22},
	{shape{name: "organic", core: 0.98, draw: spline, face: splineFace}, 0.48},
	{shape{name: "boxy", core: 0.86, adjust: func(t traits, b *body) {
		b.n = t.num("body.n", 3.4, 6)
		b.rot = t.num("body.rot", -20, 20)
	}}, 0.6},
	{shape{name: "capsule", core: 1.02,
		adjust: func(t traits, b *body) { b.ry *= t.num("capsule.squat", 0.55, 0.68) },
		face:   shrunk(0.94),
		decorate: func(_ traits, b body) ([]circle, []path) {
			return []circle{{b.cx - (b.rx - b.ry), b.cy, b.ry}, {b.cx + (b.rx - b.ry), b.cy, b.ry}}, nil
		},
		draw: func(b body) path { return box(b.cx, b.cy, b.rx-b.ry, b.ry) },
	}, 0.7},
	{shape{name: "nub", core: 0.88, decorate: func(t traits, b body) ([]circle, []path) {
		count := t.int("nub.n", 1, 2)
		out := make([]circle, count)
		for i := range count {
			a := t.num(indexed("nub.a", i), 0, 2*math.Pi)
			out[i] = circle{b.cx + math.Cos(a)*b.rx*0.88, b.cy + math.Sin(a)*b.rx*0.88, b.rx * t.num(indexed("nub.r", i), 0.24, 0.4)}
		}
		return out, nil
	}}, 0.79},
	{shape{name: "cloud", core: 0.78, face: splineFace, draw: spline, decorate: func(t traits, b body) ([]circle, []path) {
		count := t.int("cloud.n", 4, 6)
		return ring(t, "cloud.r", count, func(i int, r float64) circle {
			a := math.Pi + (math.Pi*(float64(i)+0.5))/float64(count)
			return circle{b.cx + math.Cos(a)*b.rx*0.8, b.cy + math.Sin(a)*b.rx*0.5, b.rx * r}
		}, 0.44, 0.62), nil
	}}, 0.86},
	{shape{name: "droplet", core: 0.78,
		adjust: func(_ traits, b *body) { b.cy += 0.22 * b.ry; b.n = 2 },
		face:   func(b body) ellipse { return ellipse{b.cx, b.cy + b.ry*0.05, b.rx * 0.88, b.ry * 0.88} },
		decorate: func(t traits, b body) ([]circle, []path) {
			return nil, []path{taper(b.cx, b.cy, b.rx, b.ry, t.num("droplet.tip", 1.4, 1.65))}
		},
	}, 0.915},
	{shape{name: "hexagon", core: 1.05, draw: poly, face: shrunk(0.84), adjust: func(t traits, b *body) {
		b.sides = 6
		b.rot = t.num("body.rot", -12, 12)
		b.round = t.num("poly.round", 0.24, 0.5)
	}}, 0.95},
	{shape{name: "sun", core: 0.7, decorate: func(t traits, b body) ([]circle, []path) {
		count := t.int("sun.n", 6, 9)
		dist := b.rx * t.num("sun.dist", 1.0, 1.08)
		pr := b.rx * t.num("sun.r", 0.2, 0.26)
		off := t.num("sun.rot", 0, 2*math.Pi)
		out := make([]circle, count)
		for i := range count {
			a := off + (2*math.Pi*float64(i))/float64(count)
			out[i] = circle{b.cx + math.Cos(a)*dist, b.cy + math.Sin(a)*dist, pr}
		}
		return out, nil
	}}, 0.98},
	{shape{name: "triangle", core: 1.15, draw: poly,
		adjust: func(t traits, b *body) {
			b.sides = 3
			b.rot = t.num("body.rot", -5, 5)
			b.round = t.num("poly.round", 0.24, 0.5)
		},
		face: func(b body) ellipse { return ellipse{b.cx, b.cy + b.ry*0.1, b.rx * 0.54, b.ry * 0.36} },
	}, 1},
}

func pickShape(v float64) shape {
	for _, b := range bands {
		if v < b.upTo {
			return b.shape
		}
	}
	return bands[len(bands)-1].shape
}

func build(t traits) layout {
	s := pickShape(t.at("shape"))
	r := t.num("body.r", 31, 38) * s.core
	b := body{
		cx: 50 + t.jitter("body.x", 1.5),
		cy: 50 + t.jitter("body.y", 1.5),
		rx: r,
		ry: r * t.num("body.ratio", 0.92, 1.08),
		n:  t.num("body.n", 1.9, 2.5),
	}
	b.radii = make([]float64, t.int("body.pts", 6, 8))
	for i := range b.radii {
		b.radii[i] = 1 + t.jitter(indexed("body.r", i), 0.16)
	}
	if s.adjust != nil {
		s.adjust(t, &b)
	}
	face := ellipse{b.cx, b.cy, b.rx, b.ry}
	if s.face != nil {
		face = s.face(b)
	}
	l := layout{shape: s.name, eyes: faceFit(t, b, face)}
	if s.decorate != nil {
		l.petals, l.extra = s.decorate(t, b)
	}
	if s.draw != nil {
		l.body = s.draw(b)
	} else {
		l.body = superellipse(b.cx, b.cy, b.rx, b.ry, b.n, b.rot)
	}
	return l
}

func faceFit(t traits, b body, face ellipse) []eye {
	rx := b.rx
	er0 := t.num("eye.rx", 0.075, 0.105) * rx
	ratio := t.num("eye.ratio", 1.9, 3.2)
	scale := t.num("eye.scale", 0.78, 1.24)
	stretch := t.num("eye.stretch", 0.85, 1.18)
	clearance := t.num("eye.gap", 0.1, 0.24) * rx
	wide := er0 * math.Max(1, scale)
	tall := er0 * ratio * math.Max(1, scale*stretch)
	gap0 := wide + rx*0.03 + clearance

	gx := t.jitter("gaze.x", 0.09) * face.rx
	gy := t.num("gaze.y", -0.2, 0.08) * face.ry
	dy := t.jitter("eye.dy", 0.04) * face.ry
	reach := math.Hypot(wide, tall)
	need := math.Hypot(
		(math.Abs(gx)+gap0+reach)/face.rx,
		(math.Abs(gy)+math.Abs(dy)+reach)/face.ry,
	)
	fit := 1.0
	if need > 0.9 {
		fit = 0.9 / need
	}

	er := er0 * fit
	eyeRy := er * ratio
	gap := gap0 * fit
	room := math.Max(0, math.Min(1, clearance/tall))
	bound := math.Min(12, (math.Asin(room)*180)/math.Pi)
	lean := t.num("eye.lean", -1, 1) * bound
	lean2 := math.Max(-12, math.Min(12, lean+t.jitter("eye.lean2", 3.5)))

	cx := face.cx + gx*fit
	cy := face.cy + gy*fit
	n := t.num("eye.n", 3.5, 6)
	return []eye{
		{cx - gap, cy, er, eyeRy, n, lean},
		{cx + gap, cy + dy*fit, er * scale, eyeRy * scale * stretch, n, lean2},
	}
}
