import { NextResponse } from "next/server";
import { isAuthenticated } from "@/shared/utils/apiAuth";
import { FEATURED_SKILLS } from "@/lib/skills/featuredSkills";

/** GET /api/skills/featured — curated one-click community skills (static catalog). */
export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    skills: FEATURED_SKILLS.map((skill) => ({
      id: skill.id,
      name: skill.name,
      project: skill.project,
      description: skill.description,
      source: skill.source,
      license: skill.license,
      repositoryUrl: skill.repositoryUrl,
    })),
  });
}
