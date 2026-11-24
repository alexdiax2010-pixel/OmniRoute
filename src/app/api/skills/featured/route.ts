import { NextResponse } from "next/server";
import { isAuthenticated } from "@/shared/utils/apiAuth";
import {
  FEATURED_PROJECTS,
  FEATURED_SKILLS,
  filterFeaturedSkills,
} from "@/lib/skills/featuredSkills";

const QUERY_MAX_LENGTH = 100;

/**
 * GET /api/skills/featured — curated one-click community skills (static catalog).
 * Optional `?q=` (substring search, max 100 chars) and `?project=` (exact project name).
 */
export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").slice(0, QUERY_MAX_LENGTH);
  const project = searchParams.get("project") || "";

  const skills = filterFeaturedSkills({ q, project }).map((skill) => ({
    id: skill.id,
    name: skill.name,
    project: skill.project,
    description: skill.description,
    source: skill.source,
    skillId: skill.skillId,
    license: skill.license,
    repositoryUrl: skill.repositoryUrl,
    highlighted: skill.highlighted,
  }));
  const projects = FEATURED_PROJECTS.map((name) => ({
    name,
    count: FEATURED_SKILLS.filter((skill) => skill.project === name).length,
  }));

  return NextResponse.json({ skills, projects, total: FEATURED_SKILLS.length });
}
