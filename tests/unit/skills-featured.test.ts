import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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
const { FEATURED_SKILLS, getFeaturedSkill } =
  await import("../../src/lib/skills/featuredSkills.ts");
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

test("GET /api/skills/featured lists the catalog", async () => {
  const res = await listRoute.GET(new Request("http://localhost/api/skills/featured"));
  const data = (await res.json()) as { skills: Array<{ id: string; project: string }> };
  assert.equal(res.status, 200);
  assert.equal(data.skills.length, FEATURED_SKILLS.length);
  assert.ok(data.skills.some((s) => s.id === "ppt-master" && s.project === "PPT Master"));
});

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
