#!/usr/bin/env node
// scripts/skills/generate-featured-skills.mjs
//
// Generates src/lib/skills/featuredSkills.data.json — the Featured community skills
// catalog (Omni Skills → Marketplace) — from local clones of the five upstream repos.
// Every `<repo>/<skillsDir>/<skillId>/SKILL.md` (depth exactly 2) becomes one entry.
//
// Usage:
//   node scripts/skills/generate-featured-skills.mjs [--check] [key=/path/to/clone ...]
//   keys: ppt-master, paperclip, rea, ecc, voicestudio
//   --check  exit 1 if the JSON on disk differs from what would be generated

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "src/lib/skills/featuredSkills.data.json");
const DESCRIPTION_MAX = 300;
const NAME_MAX = 64;

const REPOS = [
  {
    key: "ppt-master",
    project: "PPT Master",
    source: "hugohe3/ppt-master",
    ref: "main",
    skillsDir: "skills",
    license: "MIT",
    prefix: "ppt",
    defaultPath: "/home/user/hugohe3/ppt-master",
  },
  {
    key: "paperclip",
    project: "Paperclip",
    source: "paperclipai/paperclip",
    ref: "master",
    skillsDir: "skills",
    license: "MIT",
    prefix: "paperclip",
    defaultPath: "/home/user/paperclipai/paperclip",
  },
  {
    key: "rea",
    project: "REA",
    source: "morluto/rea",
    ref: "main",
    skillsDir: ".agents/skills",
    license: "MIT",
    prefix: "rea",
    defaultPath: "/home/user/morluto/rea",
  },
  {
    key: "ecc",
    project: "ECC (Everything Claude Code)",
    source: "affaan-m/everything-claude-code",
    ref: "main",
    skillsDir: "skills",
    license: "MIT",
    prefix: "ecc",
    defaultPath: "/home/user/affaan-m/everything-claude-code",
  },
  {
    key: "voicestudio",
    project: "VoiceStudio",
    source: "debpalash/VoiceStudio",
    ref: "main",
    skillsDir: "skills",
    license: "AGPL-3.0",
    prefix: "voicestudio",
    defaultPath: "/home/user/debpalash/VoiceStudio",
  },
];

const HIGHLIGHTED = new Set([
  "ppt-master",
  "paperclip",
  "rea-reverse-engineer-anything",
  "ecc-guide",
  "ecc-security-review",
  "ecc-tdd-workflow",
  "ecc-verification-loop",
  "voicestudio",
]);

function unquote(value) {
  const v = value.trim();
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    return v.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, " ").replace(/\\\\/g, "\\");
  }
  if (v.length >= 2 && v.startsWith("'") && v.endsWith("'")) {
    return v.slice(1, -1).replace(/''/g, "'");
  }
  return v;
}

/** Minimal YAML frontmatter reader for top-level scalar keys (plain, quoted, `>` / `|` blocks). */
export function parseFrontmatter(text) {
  const result = {};
  const normalized = text.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return result;
  const end = normalized.indexOf("\n---", 4);
  if (end === -1) return result;
  const lines = normalized.slice(4, end).split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = /^([A-Za-z0-9_-]+):(.*)$/.exec(lines[i]);
    if (!match) continue;
    const key = match[1];
    const rest = match[2].trim();
    if (/^[>|][+-]?$/.test(rest)) {
      const block = [];
      while (i + 1 < lines.length && (/^\s+\S/.test(lines[i + 1]) || lines[i + 1].trim() === "")) {
        block.push(lines[++i].trim());
      }
      result[key] = block.join(" ");
    } else if (rest === "") {
      // nested mapping or multi-line plain scalar: take indented continuation lines only
      // when they are not `key:` pairs (mapping) — otherwise leave unset.
      const block = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) block.push(lines[++i].trim());
      if (block.length && !block.some((l) => /^[A-Za-z0-9_-]+:/.test(l))) {
        result[key] = block.join(" ");
      }
    } else {
      let value = rest;
      // multi-line quoted or plain scalar continuation
      while (
        i + 1 < lines.length &&
        /^\s+\S/.test(lines[i + 1]) &&
        !(value.startsWith('"') && value.endsWith('"') && value.length > 1) &&
        !(value.startsWith("'") && value.endsWith("'") && value.length > 1)
      ) {
        value += " " + lines[++i].trim();
      }
      result[key] = unquote(value);
    }
  }
  return result;
}

function clean(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, max) {
  return value.length > max ? value.slice(0, max - 1).trimEnd() + "…" : value;
}

function makeId(prefix, skillId) {
  return skillId === prefix || skillId.startsWith(`${prefix}-`) ? skillId : `${prefix}-${skillId}`;
}

export function generate(paths = {}) {
  const entries = [];
  for (const repo of REPOS) {
    const repoPath = paths[repo.key] || repo.defaultPath;
    const dir = path.join(repoPath, repo.skillsDir);
    if (!fs.existsSync(dir)) throw new Error(`Skills directory not found: ${dir}`);
    const skillIds = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, "SKILL.md")))
      .map((d) => d.name)
      .sort();
    for (const skillId of skillIds) {
      const fm = parseFrontmatter(fs.readFileSync(path.join(dir, skillId, "SKILL.md"), "utf8"));
      const name = clean(fm.name) || skillId;
      if (name.length > NAME_MAX) throw new Error(`Skill name too long (${skillId}): ${name}`);
      const description = truncate(
        clean(fm.description) || `${repo.project} skill: ${name}`,
        DESCRIPTION_MAX
      );
      const id = makeId(repo.prefix, skillId);
      entries.push({
        id,
        name,
        project: repo.project,
        description,
        source: repo.source,
        skillId,
        ref: repo.ref,
        skillsDir: repo.skillsDir,
        license: repo.license,
        repositoryUrl: `https://github.com/${repo.source}`,
        highlighted: HIGHLIGHTED.has(id),
      });
    }
  }
  const seen = new Set();
  for (const entry of entries) {
    if (!/^[a-z0-9-]+$/.test(entry.id)) throw new Error(`Invalid featured skill id: ${entry.id}`);
    if (!/^[A-Za-z0-9_-]+$/.test(entry.skillId))
      throw new Error(`Invalid skillId: ${entry.skillId}`);
    if (seen.has(entry.id)) throw new Error(`Duplicate featured skill id: ${entry.id}`);
    seen.add(entry.id);
  }
  for (const id of HIGHLIGHTED) {
    if (!seen.has(id)) throw new Error(`Highlighted skill missing from catalog: ${id}`);
  }
  return JSON.stringify(entries, null, 2) + "\n";
}

function main(argv) {
  const check = argv.includes("--check");
  const paths = {};
  for (const arg of argv) {
    const m = /^([a-z-]+)=(.+)$/.exec(arg);
    if (m) paths[m[1]] = m[2];
  }
  const output = generate(paths);
  const count = JSON.parse(output).length;
  if (check) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (current !== output) {
      console.error(
        `[featured-skills] ${path.relative(ROOT, OUT)} is stale — run node scripts/skills/generate-featured-skills.mjs`
      );
      process.exit(1);
    }
    console.log(`[featured-skills] OK — ${count} skills up to date`);
    return;
  }
  fs.writeFileSync(OUT, output);
  console.log(`[featured-skills] wrote ${count} skills to ${path.relative(ROOT, OUT)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
