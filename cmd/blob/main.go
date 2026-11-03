// Command blob prints the blob avatar a name seeds, as terminal pixel art or SVG.
package main

import (
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/FacileStudio/blob"
)

func main() {
	size := flag.Int("size", 24, "pixels across before cropping")
	svg := flag.Bool("svg", false, "print SVG markup instead of terminal art")
	flag.Usage = func() {
		fmt.Fprintln(os.Stderr, "usage: blob [-size N] [-svg] <name>")
		flag.PrintDefaults()
	}
	flag.Parse()
	if flag.NArg() == 0 {
		flag.Usage()
		os.Exit(2)
	}
	b := blob.New(strings.Join(flag.Args(), " "), blob.Options{})
	if *svg {
		fmt.Println(b.SVG())
		return
	}
	fmt.Println(b.Terminal(*size))
}
