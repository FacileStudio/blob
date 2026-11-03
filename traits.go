package blob

import (
	"math"
	"strconv"
)

type traits struct {
	state     uint32
	overrides map[string]float64
}

func newTraits(seed string, overrides map[string]float64) traits {
	return traits{state: seedState(NormalizeSeed(seed)), overrides: overrides}
}

func (t traits) at(key string) float64 {
	v, ok := t.overrides[key]
	if !ok {
		return stream(t.state, key)
	}
	if !(v > 0) {
		return 0
	}
	if v < 1 {
		return v
	}
	return 0.999999
}

func (t traits) num(key string, min, max float64) float64 {
	return min + t.at(key)*(max-min)
}

func (t traits) int(key string, min, max int) int {
	return min + int(math.Floor(t.at(key)*float64(max-min+1)))
}

func (t traits) jitter(key string, amount float64) float64 {
	return (t.at(key)*2 - 1) * amount
}

func indexed(prefix string, i int) string {
	return prefix + strconv.Itoa(i)
}
