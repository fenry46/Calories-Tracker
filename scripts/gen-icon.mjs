// Generates the NutriPen launcher icons from the Claude Design "NutriPen Logo
// System": a purple-gradient tile with an open calorie ring (74%) around a bold
// "N" monogram. The "N" is drawn as vector paths (no system font needed) so the
// raster output is deterministic across machines.
//
// Run: node scripts/gen-icon.mjs
// Outputs: assets/app-logo.png (iOS, full-bleed) and
//          assets/app-logo-adaptive.png (Android adaptive foreground, safe-zone).

import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIZE = 1024;

// Palette (matches src/theme.ts + the logo prototype).
const PRIMARY = "#6D4AD9";
const PRIMARY_DARK = "#5A37C4";
const RING_FRACTION = 0.74;

/** Bold "N" as a filled path: left bar + diagonal parallelogram + right bar. */
function monogramN(cx, cy, h, w, t, fill) {
  const x0 = cx - w / 2; // left edge
  const x1 = cx + w / 2; // right edge
  const y0 = cy - h / 2; // top
  const y1 = cy + h / 2; // bottom
  const leftBar = `M${x0},${y0} H${x0 + t} V${y1} H${x0} Z`;
  const rightBar = `M${x1 - t},${y0} H${x1} V${y1} H${x1 - t} Z`;
  // Parallelogram from top-left down to bottom-right.
  const diag = `M${x0},${y0} L${x0 + t},${y0} L${x1},${y1} L${x1 - t},${y1} Z`;
  return `<path d="${leftBar} ${diag} ${rightBar}" fill="${fill}" />`;
}

/** Open calorie ring (track + gradient/white progress arc, 74%, round cap). */
function ring(cx, cy, r, stroke, { track, progress }) {
  const c = 2 * Math.PI * r;
  const offset = c * (1 - RING_FRACTION);
  // rotate -90deg around centre so the arc starts at 12 o'clock.
  return `
    <g transform="rotate(-90 ${cx} ${cy})">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}" />
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${progress}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}" />
    </g>`;
}

// ---- iOS / primary icon: full-bleed purple gradient tile, white ring + N ----
const iosSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="tile" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${PRIMARY}" />
      <stop offset="100%" stop-color="${PRIMARY_DARK}" />
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#tile)" />
  ${ring(512, 512, 330, 74, { track: "rgba(255,255,255,0.22)", progress: "#ffffff" })}
  ${monogramN(512, 524, 300, 232, 62, "#ffffff")}
</svg>`;

// ---- Android adaptive foreground: full-bleed gradient tile, ring + N kept in
// the centre safe zone so they survive the circular/rounded mask. The adaptive
// backgroundColor (app.json) is set to PRIMARY_DARK to blend the masked corners.
const adaptiveSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="tile" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${PRIMARY}" />
      <stop offset="100%" stop-color="${PRIMARY_DARK}" />
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#tile)" />
  ${ring(512, 512, 290, 66, { track: "rgba(255,255,255,0.22)", progress: "#ffffff" })}
  ${monogramN(512, 522, 262, 202, 54, "#ffffff")}
</svg>`;

function render(svg, outName) {
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: SIZE },
    background: "rgba(0,0,0,0)",
  })
    .render()
    .asPng();
  const out = join(ROOT, "assets", outName);
  writeFileSync(out, png);
  console.log(`wrote ${outName} (${png.length} bytes)`);
}

render(iosSvg, "app-logo.png");
render(adaptiveSvg, "app-logo-adaptive.png");
