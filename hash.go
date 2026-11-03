package blob

import (
	"strings"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

// NormalizeSeed folds a name the way a person reads it: NFC, trimmed, lowercase.
func NormalizeSeed(seed string) string {
	trimmed := strings.TrimFunc(norm.NFC.String(seed), func(r rune) bool {
		return unicode.IsSpace(r) || r == 0xFEFF
	})
	return strings.ToLower(trimmed)
}

func feed(h uint32, bytes []byte) uint32 {
	for _, b := range bytes {
		h = (h ^ uint32(b)) * 3432918353
		h = h<<13 | h>>19
	}
	return h
}

func finalize(h uint32) uint32 {
	h = (h ^ h>>16) * 2246822507
	h = (h ^ h>>13) * 3266489909
	return h ^ h>>16
}

func utf16Len(s string) int {
	n := 0
	for _, r := range s {
		n++
		if r > 0xFFFF {
			n++
		}
	}
	return n
}

func seedState(seed string) uint32 {
	return feed(1779033703^uint32(utf16Len(seed)), []byte(seed))
}

func stream(state uint32, key string) float64 {
	return float64(finalize(feed(feed(state, []byte{0xff}), []byte(key)))) / 4294967296
}
