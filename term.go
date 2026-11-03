package blob

import (
	"fmt"
	"strings"
)

// Terminal renders the blob as truecolor pixel art, two pixels per character
// cell using half blocks, size pixels across before cropping.
func (b Blob) Terminal(size int) string {
	return b.Pixels(size).Terminal()
}

// Terminal prints the image with upper and lower half blocks so every pixel
// is square. Empty pixels keep the terminal's own background.
func (m Image) Terminal() string {
	var s strings.Builder
	for y := 0; y < m.Height; y += 2 {
		for x := range m.Width {
			top := m.At(x, y)
			bottom := Pixel{}
			if y+1 < m.Height {
				bottom = m.At(x, y+1)
			}
			s.WriteString(cell(top, bottom))
		}
		s.WriteString("\x1b[0m")
		if y+2 < m.Height {
			s.WriteByte('\n')
		}
	}
	return s.String()
}

func cell(top, bottom Pixel) string {
	switch {
	case top.Filled && bottom.Filled:
		return fg(top.Color) + bg(bottom.Color) + "▀"
	case top.Filled:
		return "\x1b[49m" + fg(top.Color) + "▀"
	case bottom.Filled:
		return "\x1b[49m" + fg(bottom.Color) + "▄"
	}
	return "\x1b[0m "
}

func fg(c RGB) string { return fmt.Sprintf("\x1b[38;2;%d;%d;%dm", c.R, c.G, c.B) }

func bg(c RGB) string { return fmt.Sprintf("\x1b[48;2;%d;%d;%dm", c.R, c.G, c.B) }
