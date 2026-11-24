import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Featured community skills (PPT Master, Paperclip, REA, ECC, VoiceStudio): the
// install route accepts only a catalog id; repository, ref and directory are pinned
// server-side and must reach GitHub exactly as catalogued.

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniroute-featured-skills-"));
const originalDataDir = process.env.DATA_DIR;
process.env.DATA_DIR = tmpDir;

const core = await import("../../src/lib/db/core.ts");
const settingsDb = await import("../../src/lib/db/settings.ts");
const { skillRegistry } = await import("../../src/lib/skills/registry.ts");
const { fetchSkillMd } = await import("../../src/lib/skills/skillssh.ts");
const { FEATURED_SKILLS, FEATURED_PROJECTS, getFeaturedSkill, filterFeaturedSkills } =
  await import("../../src/lib/skills/featuredSkills.ts");

const HIGHLIGHTED_IDS = [
  "ppt-master",
  "paperclip",
  "rea-reverse-engineer-anything",
  "ecc-guide",
  "ecc-security-review",
  "ecc-tdd-workflow",
  "ecc-verification-loop",
  "voicestudio",
];
const PROJECT_COUNTS: Record<string, number> = {
  "PPT Master": 1,
  Paperclip: 9,
  REA: 5,
  "ECC (Everything Claude Code)": 328,
  VoiceStudio: 2,
};
// Local clones the generator reads by default; CI has none, so --check is skipped there.
const UPSTREAM_CLONES = [
  "/home/user/hugohe3/ppt-master",
  "/home/user/paperclipai/paperclip",
  "/home/user/morluto/rea",
  "/home/user/affaan-m/everything-claude-code",
  "/home/user/debpalash/VoiceStudio",
];
const listRoute = await import("../../src/app/api/skills/featured/route.ts");
const installRoute = await import("../../src/app/api/skills/featured/install/route.ts");

type RegistryInternals = {
  registeredSkills?: { clear?: () => void };
  versionCache?: { clear?: () => void };
};

function clearSkillRegistry() {
  const internals = skillRegistry as unknown as RegistryInternals;
  internals.registeredSkills?.clear?.();
  internals.versionCache?.clear?.();
}

const originalFetch = globalThis.fetch;

test.beforeEach(async () => {
  core.resetDbInstance();
  fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  fs.mkdirSync(tmpDir, { recursive: true });
  clearSkillRegistry();
  core.getDbInstance();
  await settingsDb.updateSettings({ requireLogin: false });
  globalThis.fetch = originalFetch;
});

test.after(() => {
  core.resetDbInstance();
  clearSkillRegistry();
  globalThis.fetch = originalFetch;
  process.env.DATA_DIR = originalDataDir;
  fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function recordingFetch(urls: string[], body = "---\nname: x\n---\n# Skill\n") {
  return async (input: string | URL | Request) => {
    urls.push(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    return new Response(body, { status: 200 });
  };
}

function installRequest(body: unknown) {
  return new Request("http://localhost/api/skills/featured/install", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("catalog covers all five projects with unique ids and pinned GitHub coordinates", () => {
  const ids = FEATURED_SKILLS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, "featured ids must be unique");
  const sources = new Set(FEATURED_SKILLS.map((s) => s.source));
  for (const source of [
    "hugohe3/ppt-master",
    "paperclipai/paperclip",
    "morluto/rea",
    "affaan-m/everything-claude-code",
    "debpalash/VoiceStudio",
  ]) {
    assert.ok(sources.has(source), `missing featured project ${source}`);
  }
  for (const skill of FEATURED_SKILLS) {
    assert.match(skill.id, /^[a-z0-9-]+$/);
    assert.equal(skill.repositoryUrl, `https://github.com/${skill.source}`);
  }
  assert.equal(getFeaturedSkill("nope"), undefined);
});

test("fetchSkillMd keeps the main/skills default and honours a pinned ref and directory", async () => {
  const urls: string[] = [];
  globalThis.fetch = recordingFetch(urls) as typeof fetch;

  await fetchSkillMd("owner/repo", "a-skill");
  await fetchSkillMd("paperclipai/paperclip", "paperclip", { ref: "master" });
  await fetchSkillMd("morluto/rea", "reverse-engineer-anything", { skillsDir: ".agents/skills" });

  assert.deepEqual(urls, [
    "https://raw.githubusercontent.com/owner/repo/main/skills/a-skill/SKILL.md",
    "https://raw.githubusercontent.com/paperclipai/paperclip/master/skills/paperclip/SKILL.md",
    "https://raw.githubusercontent.com/morluto/rea/main/.agents/skills/reverse-engineer-anything/SKILL.md",
  ]);
});

test("fetchSkillMd rejects a traversal ref or an unlisted directory before fetching", async () => {
  const urls: string[] = [];
  globalThis.fetch = recordingFetch(urls) as typeof fetch;

  await assert.rejects(fetchSkillMd("owner/repo", "a", { ref: ".." }), /Invalid skills.sh ref/);
  await assert.rejects(fetchSkillMd("owner/repo", "a", { ref: "a/b" }), /Invalid skills.sh ref/);
  await assert.rejects(
    fetchSkillMd("owner/repo", "a", { skillsDir: "../x" as never }),
    /Invalid skills directory/
  );
  assert.deepEqual(urls, []);
});

test("catalog holds all 345 upstream skills with the expected per-project counts", () => {
  assert.equal(FEATURED_SKILLS.length, 345);
  assert.deepEqual([...FEATURED_PROJECTS], Object.keys(PROJECT_COUNTS));
  for (const [project, count] of Object.entries(PROJECT_COUNTS)) {
    assert.equal(
      FEATURED_SKILLS.filter((s) => s.project === project).length,
      count,
      `${project} skill count`
    );
  }
  assert.deepEqual(
    FEATURED_SKILLS.filter((s) => s.highlighted).map((s) => s.id),
    HIGHLIGHTED_IDS
  );
  for (const skill of FEATURED_SKILLS) {
    assert.ok(skill.name.length > 0 && skill.name.length <= 64, `${skill.id} name length`);
    assert.ok(skill.description.length > 0 && skill.description.length <= 300);
  }
});

test("filterFeaturedSkills searches case-insensitively, filters by project, highlighted first", () => {
  const all = filterFeaturedSkills();
  assert.equal(all.length, 345);
  assert.deepEqual(
    all.slice(0, HIGHLIGHTED_IDS.length).map((s) => s.id),
    HIGHLIGHTED_IDS
  );

  const paperclip = filterFeaturedSkills({ project: "Paperclip" });
  assert.equal(paperclip.length, 9);
  assert.equal(paperclip[0].id, "paperclip");

  const pptx = filterFeaturedSkills({ q: "PPTX" });
  assert.ok(pptx.some((s) => s.id === "ppt-master"));
  assert.ok(
    pptx.every((s) => /pptx/i.test(`${s.name} ${s.description} ${s.project} ${s.skillId}`))
  );

  assert.deepEqual(filterFeaturedSkills({ q: "zz-no-such-skill-zz" }), []);
  assert.deepEqual(filterFeaturedSkills({ project: "Unknown" }), []);
});

test("GET /api/skills/featured lists the catalog with project counts", async () => {
  const res = await listRoute.GET(new Request("http://localhost/api/skills/featured"));
  const data = (await res.json()) as {
    skills: Array<{ id: string; project: string; skillId: string; highlighted: boolean }>;
    projects: Array<{ name: string; count: number }>;
    total: number;
  };
  assert.equal(res.status, 200);
  assert.equal(data.total, 345);
  assert.equal(data.skills.length, 345);
  assert.deepEqual(
    data.projects,
    Object.entries(PROJECT_COUNTS).map(([name, count]) => ({ name, count }))
  );
  const ppt = data.skills.find((s) => s.id === "ppt-master");
  assert.equal(ppt?.project, "PPT Master");
  assert.equal(ppt?.skillId, "ppt-master");
  assert.equal(ppt?.highlighted, true);
  assert.equal(data.skills[0].highlighted, true);
});

test("GET /api/skills/featured honours ?q= and ?project= but keeps full totals", async () => {
  const res = await listRoute.GET(
    new Request("http://localhost/api/skills/featured?project=REA&q=reverse")
  );
  const data = (await res.json()) as {
    skills: Array<{ id: string; project: string }>;
    projects: Array<{ name: string; count: number }>;
    total: number;
  };
  assert.equal(res.status, 200);
  assert.equal(data.total, 345);
  assert.equal(data.projects.find((p) => p.name === "ECC (Everything Claude Code)")?.count, 328);
  assert.ok(data.skills.length > 0);
  assert.ok(data.skills.every((s) => s.project === "REA"));
  assert.equal(data.skills[0].id, "rea-reverse-engineer-anything");

  const long = await listRoute.GET(
    new Request(`http://localhost/api/skills/featured?q=${"a".repeat(500)}`)
  );
  assert.equal(long.status, 200);
  assert.equal(((await long.json()) as { skills: unknown[] }).skills.length, 0);
});

test(
  "generator --check confirms featuredSkills.data.json matches the upstream clones",
  { skip: !UPSTREAM_CLONES.every((p) => fs.existsSync(p)) && "upstream clones not present" },
  () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/skills/generate-featured-skills.mjs", "--check"],
      { encoding: "utf8" }
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /345 skills up to date/);
  }
);

test("POST /api/skills/featured/install fetches the pinned SKILL.md and registers the skill", async () => {
  const urls: string[] = [];
  globalThis.fetch = recordingFetch(
    urls,
    "---\nname: paperclip\n---\n# Paperclip\n"
  ) as typeof fetch;

  const res = await installRoute.POST(installRequest({ id: "paperclip" }));
  const data = (await res.json()) as { success?: boolean; id?: string };

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.deepEqual(urls, [
    "https://raw.githubusercontent.com/paperclipai/paperclip/master/skills/paperclip/SKILL.md",
  ]);
  const installed = skillRegistry.list().find((s) => s.name === "paperclip");
  assert.ok(installed, "paperclip skill must be registered");
  assert.match(String(installed.handler), /# Paperclip/);
});

test("POST /api/skills/featured/install rejects unknown or malformed ids without fetching", async () => {
  const urls: string[] = [];
  globalThis.fetch = recordingFetch(urls) as typeof fetch;

  const unknown = await installRoute.POST(installRequest({ id: "not-a-featured-skill" }));
  assert.equal(unknown.status, 404);

  const malformed = await installRoute.POST(installRequest({ id: "../etc" }));
  assert.equal(malformed.status, 400);

  const extraFields = await installRoute.POST(
    installRequest({ id: "paperclip", source: "evil/repo" })
  );
  // Unknown keys are ignored: coordinates always come from the catalog.
  assert.equal(extraFields.status, 200);
  assert.ok(urls.every((u) => u.includes("/paperclipai/paperclip/")));
});
