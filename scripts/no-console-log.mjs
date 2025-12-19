import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PATTERN = "console.log";
const MAX_SHOW = 20;

const EXCLUDE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".turbo",
  "coverage",
  "out",
]);

const EXCLUDE_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".7z",
  ".mp3",
  ".mp4",
  ".wav",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".map",
]);

function shouldSkip(filePath, stats) {
  const rel = path.relative(ROOT, filePath);
  const parts = rel.split(path.sep);
  if (parts.some((p) => EXCLUDE_DIRS.has(p))) return true;
  if (!stats.isFile()) return true;
  const ext = path.extname(filePath).toLowerCase();
  if (EXCLUDE_EXT.has(ext)) return true;
  // Skip minified files
  if (filePath.endsWith(".min.js") || filePath.endsWith(".min.css"))
    return true;
  return false;
}

function walk(dir, onFile) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (EXCLUDE_DIRS.has(ent.name)) continue;
      walk(full, onFile);
    } else {
      onFile(full);
    }
  }
}

function findMatchesInFile(filePath) {
  let buf;
  try {
    buf = fs.readFileSync(filePath);
  } catch {
    return [];
  }

  // Quick binary check
  const slice = buf.subarray(0, 8000);
  if (slice.includes(0)) return [];

  const text = buf.toString("utf8");
  if (!text.includes(PATTERN)) return [];

  const lines = text.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(PATTERN)) {
      hits.push(
        `${path.relative(ROOT, filePath)}:${i + 1}: ${lines[i].trim()}`
      );
      if (hits.length >= MAX_SHOW) break;
    }
  }
  return hits;
}

const matches = [];
walk(ROOT, (filePath) => {
  let stats;
  try {
    stats = fs.statSync(filePath);
  } catch {
    return;
  }
  if (shouldSkip(filePath, stats)) return;

  const hits = findMatchesInFile(filePath);
  if (hits.length) {
    for (const h of hits) {
      matches.push(h);
      if (matches.length >= MAX_SHOW) return;
    }
  }
});

if (matches.length) {
  console.error(matches.join("\n"));
  console.error("… (showing first 20)");
  process.exit(1);
}
process.exit(0);
