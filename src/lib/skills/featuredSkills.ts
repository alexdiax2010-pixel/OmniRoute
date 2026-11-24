/**
 * Featured community skills — a small curated catalog of open-source agent skills
 * that install with one click from the dashboard (Omni Skills → Marketplace).
 *
 * Every entry is pinned server-side (repository, ref, directory, skill id): the
 * install route only accepts a featured `id`, so callers can never steer the
 * GitHub raw fetch to an arbitrary path. Content is fetched live from GitHub via
 * `fetchSkillMd()`, so the installed SKILL.md always matches the upstream repo.
 */
import type { SkillsDir } from "./skillssh";

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
}

export const FEATURED_SKILLS: readonly FeaturedSkill[] = [
  {
    id: "ppt-master",
    name: "ppt-master",
    project: "PPT Master",
    description:
      "Generate native, editable PowerPoint (.pptx) decks from documents (Word, PDF, notes), fill PPTX templates and enhance finished decks.",
    source: "hugohe3/ppt-master",
    skillId: "ppt-master",
    ref: "main",
    skillsDir: "skills",
    license: "MIT",
    repositoryUrl: "https://github.com/hugohe3/ppt-master",
  },
  {
    id: "paperclip",
    name: "paperclip",
    project: "Paperclip",
    description:
      "Work inside Paperclip-managed AI agent companies: read task context, deliver work, report blockers, delegate and follow company governance.",
    source: "paperclipai/paperclip",
    skillId: "paperclip",
    ref: "master",
    skillsDir: "skills",
    license: "MIT",
    repositoryUrl: "https://github.com/paperclipai/paperclip",
  },
  {
    id: "rea-reverse-engineer-anything",
    name: "reverse-engineer-anything",
    project: "REA",
    description:
      "Reverse engineer native, Electron/JavaScript, packaged, firmware and browser targets with the REA MCP server to understand how a feature works.",
    source: "morluto/rea",
    skillId: "reverse-engineer-anything",
    ref: "main",
    skillsDir: ".agents/skills",
    license: "MIT",
    repositoryUrl: "https://github.com/morluto/rea",
  },
  {
    id: "ecc-guide",
    name: "ecc-guide",
    project: "ECC (Everything Claude Code)",
    description:
      "Answer questions about ECC — agents, skills, commands, hooks, rules and install profiles — by reading the live repository surface.",
    source: "affaan-m/everything-claude-code",
    skillId: "ecc-guide",
    ref: "main",
    skillsDir: "skills",
    license: "MIT",
    repositoryUrl: "https://github.com/affaan-m/everything-claude-code",
  },
  {
    id: "ecc-security-review",
    name: "security-review",
    project: "ECC (Everything Claude Code)",
    description:
      "Security review checklist and patterns for auth, user input, secrets, API endpoints and payment or other sensitive features.",
    source: "affaan-m/everything-claude-code",
    skillId: "security-review",
    ref: "main",
    skillsDir: "skills",
    license: "MIT",
    repositoryUrl: "https://github.com/affaan-m/everything-claude-code",
  },
  {
    id: "ecc-tdd-workflow",
    name: "tdd-workflow",
    project: "ECC (Everything Claude Code)",
    description:
      "Test-driven development loop: failing test first, smallest change to green, then refactor with unit, integration and E2E coverage.",
    source: "affaan-m/everything-claude-code",
    skillId: "tdd-workflow",
    ref: "main",
    skillsDir: "skills",
    license: "MIT",
    repositoryUrl: "https://github.com/affaan-m/everything-claude-code",
  },
  {
    id: "ecc-verification-loop",
    name: "verification-loop",
    project: "ECC (Everything Claude Code)",
    description:
      "Six-phase verification of finished work — build, type check, lint, tests with coverage, security grep and diff review — with a PASS/FAIL report.",
    source: "affaan-m/everything-claude-code",
    skillId: "verification-loop",
    ref: "main",
    skillsDir: "skills",
    license: "MIT",
    repositoryUrl: "https://github.com/affaan-m/everything-claude-code",
  },
  {
    id: "voicestudio",
    name: "voicestudio",
    project: "VoiceStudio",
    description:
      "Generate local speech with saved or designed voices, transcribe audio and automate dubbing or narration through a running VoiceStudio backend.",
    source: "debpalash/VoiceStudio",
    skillId: "voicestudio",
    ref: "main",
    skillsDir: "skills",
    license: "AGPL-3.0",
    repositoryUrl: "https://github.com/debpalash/VoiceStudio",
  },
];

export function getFeaturedSkill(id: string): FeaturedSkill | undefined {
  return FEATURED_SKILLS.find((skill) => skill.id === id);
}
