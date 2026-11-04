import { writeFileSync } from "fs";
import { blobatar } from "../src/lib/core/blobatar";
import { execSync } from "child_process";

const seeds = [
  { name: "Bulle", label: "Bulle" },
  { name: "Pixel", label: "Pixel" },
  { name: "Spark", label: "Spark" },
  { name: "Nova", label: "Nova" },
  { name: "Luna", label: "Luna" },
  { name: "Linus", label: "Linus" }
];

const cardWidth = 840;
const cardHeight = 180;
const cols = seeds.length;
const spacing = cardWidth / cols;

let avatarsSvg = "";
seeds.forEach((item, i) => {
  const x = Math.round(i * spacing + spacing / 2);
  const rawSvg = blobatar(item.name);
  const inner = rawSvg.replace(/<svg[^>]*>|<\/svg>/g, "");
  
  avatarsSvg += `
    <g transform="translate(${x - 48}, 22)">
      <svg width="96" height="96" viewBox="0 0 100 100">
        ${inner}
      </svg>
    </g>
    <text x="${x}" y="146" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="600" fill="#94a3b8" letter-spacing="0.5">${item.label}</text>
  `;
});

const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cardWidth} ${cardHeight}" width="${cardWidth}" height="${cardHeight}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="${cardWidth - 2}" height="${cardHeight - 2}" rx="14" fill="url(#bgGrad)" stroke="url(#borderGrad)" stroke-width="1.5"/>
  ${avatarsSvg}
</svg>`;

writeFileSync("assets/hero.svg", heroSvg.trim());
console.log("Wrote assets/hero.svg");

const termOutput = execSync("go run ./cmd/blob Bulle", { encoding: "utf8" });
const termLines = termOutput.split("\n").filter((l) => l.length > 0);

const cellW = 9.5;
const cellH = 17;
const termPadX = 28;
const termPadY = 56;
const termWidth = 560;
const termHeight = 320;

let termCellsSvg = "";
termLines.forEach((line, row) => {
  let col = 0;
  let fgColor = "#ffffff";
  let bgColor = "transparent";
  let i = 0;
  
  while (i < line.length) {
    if (line[i] === "\x1b" && line[i + 1] === "[") {
      const end = line.indexOf("m", i);
      if (end !== -1) {
        const code = line.slice(i + 2, end);
        if (code === "0") {
          fgColor = "#ffffff";
          bgColor = "transparent";
        } else if (code === "49") {
          bgColor = "transparent";
        } else if (code.startsWith("38;2;")) {
          const [, , r, g, b] = code.split(";");
          fgColor = `rgb(${r},${g},${b})`;
        } else if (code.startsWith("48;2;")) {
          const [, , r, g, b] = code.split(";");
          bgColor = `rgb(${r},${g},${b})`;
        }
        i = end + 1;
        continue;
      }
    }
    
    const char = line[i];
    const x = termPadX + col * cellW;
    const y = termPadY + row * cellH;
    
    if (char === "▀") {
      if (bgColor !== "transparent") {
        termCellsSvg += `<rect x="${x}" y="${y}" width="${cellW + 0.5}" height="${cellH}" fill="${bgColor}"/>`;
      }
      termCellsSvg += `<rect x="${x}" y="${y}" width="${cellW + 0.5}" height="${cellH / 2}" fill="${fgColor}"/>`;
    } else if (char === "▄") {
      if (bgColor !== "transparent") {
        termCellsSvg += `<rect x="${x}" y="${y}" width="${cellW + 0.5}" height="${cellH}" fill="${bgColor}"/>`;
      }
      termCellsSvg += `<rect x="${x}" y="${y + cellH / 2}" width="${cellW + 0.5}" height="${cellH / 2}" fill="${fgColor}"/>`;
    } else if (char === " ") {
      if (bgColor !== "transparent") {
        termCellsSvg += `<rect x="${x}" y="${y}" width="${cellW + 0.5}" height="${cellH}" fill="${bgColor}"/>`;
      }
    }
    col++;
    i++;
  }
});

const terminalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${termWidth} ${termHeight}" width="${termWidth}" height="${termHeight}">
  <defs>
    <linearGradient id="termGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0d14"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="${termWidth - 2}" height="${termHeight - 2}" rx="12" fill="url(#termGrad)" stroke="#1e293b" stroke-width="1.5"/>
  <rect x="1" y="1" width="${termWidth - 2}" height="38" rx="12" fill="#0f172a"/>
  <rect x="1" y="26" width="${termWidth - 2}" height="13" fill="#0f172a"/>
  <line x1="1" y1="39" x2="${termWidth - 1}" y2="39" stroke="#1e293b" stroke-width="1"/>
  <circle cx="20" cy="20" r="5.5" fill="#ef4444"/>
  <circle cx="36" cy="20" r="5.5" fill="#f59e0b"/>
  <circle cx="52" cy="20" r="5.5" fill="#10b981"/>
  <text x="${termWidth / 2}" y="24" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="12" fill="#64748b">blob Bulle</text>

  <g transform="translate(24, 62)">
    <text font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="13" fill="#38bdf8">~</text>
    <text x="14" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="13" fill="#64748b">❯</text>
    <text x="30" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="13" font-weight="600" fill="#f1f5f9">blob Bulle</text>
  </g>

  <g transform="translate(18, 48)">
    ${termCellsSvg}
  </g>
</svg>`;

writeFileSync("assets/terminal.svg", terminalSvg.trim());
console.log("Wrote assets/terminal.svg");

execSync("magick -density 192 assets/hero.svg assets/hero.png");
execSync("magick -density 192 assets/terminal.svg assets/terminal.png");
console.log("Rendered assets/hero.png and assets/terminal.png");
