package blob

import (
	"fmt"
	"math"
)

type oklch struct{ l, c, h float64 }

// RGB is an 8-bit sRGB colour.
type RGB struct{ R, G, B uint8 }

// Hex is the colour as #rrggbb.
func (c RGB) Hex() string {
	return fmt.Sprintf("#%02x%02x%02x", c.R, c.G, c.B)
}

// Palette holds the three colours a blob is painted with.
type Palette struct{ Background, Head, Eye RGB }

func toLinear(o oklch) [3]float64 {
	r := (o.h * math.Pi) / 180
	a := o.c * math.Cos(r)
	b := o.c * math.Sin(r)
	l := o.l + 0.3963377774*a + 0.2158037573*b
	m := o.l - 0.1055613458*a - 0.0638541728*b
	s := o.l - 0.0894841775*a - 1.291485548*b
	L, M, S := l*l*l, m*m*m, s*s*s
	return [3]float64{
		4.0767416621*L - 3.3077115913*M + 0.2309699292*S,
		-1.2684380046*L + 2.6097574011*M - 0.3413193965*S,
		-0.0041960863*L - 0.7034186147*M + 1.707614701*S,
	}
}

func inGamut(rgb [3]float64) bool {
	for _, v := range rgb {
		if v < -1e-4 || v > 1+1e-4 {
			return false
		}
	}
	return true
}

func clampedLinear(o oklch) [3]float64 {
	rgb := toLinear(o)
	if !inGamut(rgb) {
		lo, hi := 0.0, o.c
		for range 12 {
			mid := (lo + hi) / 2
			if inGamut(toLinear(oklch{o.l, mid, o.h})) {
				lo = mid
			} else {
				hi = mid
			}
		}
		rgb = toLinear(oklch{o.l, lo, o.h})
	}
	for i, v := range rgb {
		rgb[i] = math.Min(1, math.Max(0, v))
	}
	return rgb
}

func luminance(o oklch) float64 {
	c := clampedLinear(o)
	return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]
}

func contrast(a, b oklch) float64 {
	x, y := luminance(a), luminance(b)
	return (math.Max(x, y) + 0.05) / (math.Min(x, y) + 0.05)
}

func ensureContrast(fg, bg oklch, min float64) oklch {
	if contrast(fg, bg) >= min {
		return fg
	}
	lean := -1.0
	if fg.l >= bg.l {
		lean = 1
	}
	for _, dir := range []float64{lean, -lean} {
		probe := fg
		for range 60 {
			probe.l = math.Min(1, math.Max(0, probe.l+dir*0.02))
			if contrast(probe, bg) >= min {
				return probe
			}
			if probe.l == 0 || probe.l == 1 {
				break
			}
		}
	}
	black, white := oklch{0, 0, fg.h}, oklch{1, 0, fg.h}
	if contrast(black, bg) >= contrast(white, bg) {
		return black
	}
	return white
}

func toRGB(o oklch) RGB {
	var out [3]uint8
	for i, v := range clampedLinear(o) {
		s := 12.92 * v
		if v > 0.0031308 {
			s = 1.055*math.Pow(v, 1/2.4) - 0.055
		}
		out[i] = uint8(math.Floor(s*255 + 0.5))
	}
	return RGB{out[0], out[1], out[2]}
}

var tones = []struct{ edge, l, c float64 }{
	{0.2, 0.86, 0.085},
	{0.36, 0.9, 0.028},
	{0.62, 0.73, 0.135},
	{0.8, 0.62, 0.165},
	{0.93, 0.87, 0.16},
	{1.0, 0.34, 0.035},
}

var darkSurface = oklch{0.145, 0, 0}

func palette(hue, tone float64) Palette {
	t := tones[0]
	for _, candidate := range tones {
		if tone < candidate.edge {
			t = candidate
			break
		}
	}
	bg := oklch{0.965, 0.01, hue}
	head := ensureContrast(oklch{t.l, t.c, hue}, darkSurface, 1.5)
	eye := oklch{0.97, 0.012, hue}
	if head.l >= 0.5 {
		eye = oklch{0.17, 0.02, hue}
	}
	head = ensureContrast(head, bg, 1.25)
	eye = ensureContrast(eye, head, 4.5)
	return Palette{Background: toRGB(bg), Head: toRGB(head), Eye: toRGB(eye)}
}
