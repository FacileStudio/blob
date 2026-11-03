package blob

import (
	"bufio"
	"crypto/sha256"
	"encoding/hex"
	"os"
	"strings"
	"testing"
)

func golden(t *testing.T) map[string]map[string]string {
	f, err := os.Open("testdata/gen2.txt")
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	out := map[string]map[string]string{}
	section := ""
	scan := bufio.NewScanner(f)
	scan.Buffer(make([]byte, 1<<20), 1<<20)
	for scan.Scan() {
		line := scan.Text()
		switch {
		case line == "" || strings.HasPrefix(line, "#"):
		case strings.HasPrefix(line, "["):
			section = strings.Trim(line, "[]")
			out[section] = map[string]string{}
		default:
			key, value, _ := strings.Cut(line, "\t")
			out[section][key] = value
		}
	}
	return out
}

func TestSVGMatchesGoldenMarkup(t *testing.T) {
	cases := map[string]Options{
		"shape:round": {Traits: map[string]float64{"shape": 0.11}}, "shape:organic": {Traits: map[string]float64{"shape": 0.35}},
		"shape:boxy": {Traits: map[string]float64{"shape": 0.54}}, "shape:capsule": {Traits: map[string]float64{"shape": 0.65}},
		"shape:nub": {Traits: map[string]float64{"shape": 0.745}}, "shape:cloud": {Traits: map[string]float64{"shape": 0.825}},
		"shape:droplet": {Traits: map[string]float64{"shape": 0.888}}, "shape:hexagon": {Traits: map[string]float64{"shape": 0.933}},
		"shape:sun": {Traits: map[string]float64{"shape": 0.965}}, "shape:triangle": {Traits: map[string]float64{"shape": 0.99}},
		"plain":      {},
		"configured": {Traits: map[string]float64{"shape": 0.96, "eye.ratio": 0, "hue": 0.5}},
	}
	markup := golden(t)["markup"]
	for key, opts := range cases {
		if got := New("alain", opts).SVG(); got != markup[key] {
			t.Errorf("%s\n got %s\nwant %s", key, got, markup[key])
		}
	}
	if got := New("🦊", Options{}).SVG(); got != markup["astral"] {
		t.Errorf("astral\n got %s\nwant %s", got, markup["astral"])
	}
}

func TestSVGMatchesGoldenHashes(t *testing.T) {
	checked := 0
	for seed, want := range golden(t)["hashes"] {
		if strings.Contains(seed, "\x00") {
			continue
		}
		sum := sha256.Sum256([]byte(New(seed, Options{}).SVG()))
		if got := hex.EncodeToString(sum[:])[:16]; got != want {
			t.Errorf("%q: got %s want %s", seed, got, want)
		}
		checked++
	}
	if checked != 1000 {
		t.Fatalf("checked %d seeds, want 1000", checked)
	}
}

func TestTerminalDrawsEyesInsideHead(t *testing.T) {
	img := New("bulle", Options{}).Pixels(32)
	head, eye := 0, 0
	b := New("bulle", Options{})
	for _, p := range img.Pix {
		switch {
		case p.Filled && p.Color == b.Palette.Eye:
			eye++
		case p.Filled:
			head++
		}
	}
	if head == 0 || eye == 0 || eye >= head {
		t.Fatalf("head %d eye %d pixels", head, eye)
	}
}
