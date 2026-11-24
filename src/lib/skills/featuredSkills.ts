/**
 * Featured community skills — the curated catalog of open-source agent skills that
 * install with one click from the dashboard (Omni Skills → Marketplace).
 *
 * The catalog covers every skill shipped by PPT Master, Paperclip, REA, ECC
 * (Everything Claude Code) and VoiceStudio. It is generated from local clones of
 * those repositories by `scripts/skills/generate-featured-skills.mjs` into
 * `featuredSkills.data.json` — regenerate instead of editing the JSON by hand.
 *
 * Every entry is pinned server-side (repository, ref, directory, skill id): the
 * install route only accepts a featured `id`, so callers can never steer the
 * GitHub raw fetch to an arbitrary path. Content is fetched live from GitHub via
 * `fetchSkillMd()`, so the installed SKILL.md always matches the upstream repo.
 */
import data from "./featuredSkills.data.json";
import { SKILLS_DIRS, type SkillsDir } from "./skillssh";

export interface FeaturedSkill {
  /** Stable catalog id (also the install key). */
  id: string;
  /** Skill name registered in OmniRoute (matches the SKILL.md `name`). */
  name: string;
  /** Project the skill belongs to (shown as the card group). */
  project: string;
  description: string;
  /** GitHub `owner/repo`. */
  source: string;
  /** Skill directory name under `skillsDir`. */
  skillId: string;
  /** Branch the SKILL.md is read from. */
  ref: string;
  skillsDir: SkillsDir;
  /** SPDX license id of the upstream repository. */
  license: string;
  repositoryUrl: string;
  /** Pinned at the top of the list (the flagship skill of each project). */
  highlighted: boolean;
}

function validateEntries(raw: unknown): readonly FeaturedSkill[] {
  if (!Array.isArray(raw)) throw new Error("featuredSkills.data.json must be an array");
  const seen = new Set<string>();
  for (const entry of raw as FeaturedSkill[]) {
    if (!/^[a-z0-9-]+$/.test(entry.id) || seen.has(entry.id)) {
      throw new Error(`Invalid or duplicate featured skill id: ${entry.id}`);
    }
    if (!(SKILLS_DIRS as readonly string[]).includes(entry.skillsDir)) {
      throw new Error(`Invalid skills directory for featured skill ${entry.id}`);
    }
    seen.add(entry.id);
  }
  return Object.freeze(raw as FeaturedSkill[]);
}

export const FEATURED_SKILLS: readonly FeaturedSkill[] = validateEntries(data);

/** Project names in catalog order. */
export const FEATURED_PROJECTS: readonly string[] = Object.freeze([
  ...new Set(FEATURED_SKILLS.map((skill) => skill.project)),
]);

export function getFeaturedSkill(id: string): FeaturedSkill | undefined {
  return FEATURED_SKILLS.find((skill) => skill.id === id);
}

export interface FeaturedSkillFilter {
  /** Case-insensitive substring over name, description, project and skillId. */
  q?: string | null;
  /** Exact project name. */
  project?: string | null;
}

/** Filter the catalog; highlighted skills first, then catalog order. */
export function filterFeaturedSkills(filter: FeaturedSkillFilter = {}): FeaturedSkill[] {
  const q = filter.q?.trim().toLowerCase() || "";
  const project = filter.project?.trim() || "";
  const matches = FEATURED_SKILLS.filter((skill) => {
    if (project && skill.project !== project) return false;
    if (!q) return true;
    return [skill.name, skill.description, skill.project, skill.skillId].some((field) =>
      field.toLowerCase().includes(q)
    );
  });
  return [...matches.filter((s) => s.highlighted), ...matches.filter((s) => !s.highlighted)];
}
