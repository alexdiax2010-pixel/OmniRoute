import { NextResponse } from "next/server";
import { z } from "zod";
import { validateBody, isValidationFailure } from "@/shared/validation/helpers";
import { GLOBAL_SKILL_OWNER_ID, skillRegistry } from "@/lib/skills/registry";
import { isAuthenticated } from "@/shared/utils/apiAuth";
import { fetchSkillMd } from "@/lib/skills/skillssh";
import { getFeaturedSkill } from "@/lib/skills/featuredSkills";
import { sanitizeErrorMessage } from "@omniroute/open-sse/utils/error";

// Only a catalog id is accepted: repository, ref and path are pinned server-side
// in FEATURED_SKILLS, so this route cannot be pointed at an arbitrary GitHub path.
const featuredInstallSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
});

/** POST /api/skills/featured/install — install one curated community skill. */
export async function POST(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const validation = validateBody(featuredInstallSchema, rawBody);
  if (isValidationFailure(validation)) {
    return NextResponse.json(validation.error, { status: 400 });
  }
  const featured = getFeaturedSkill(validation.data.id);
  if (!featured) {
    return NextResponse.json({ error: "Unknown featured skill" }, { status: 404 });
  }

  try {
    const skillMdContent = await fetchSkillMd(featured.source, featured.skillId, {
      ref: featured.ref,
      skillsDir: featured.skillsDir,
    });
    const skill = await skillRegistry.register({
      name: featured.name,
      version: "1.0.0",
      description: featured.description,
      schema: { input: { content: "string" }, output: { result: "string" } },
      handler: `// Installed from featured skills (${featured.project}, ${featured.license})\n// Source: ${featured.repositoryUrl} (${featured.ref}/${featured.skillsDir}/${featured.skillId})\n// SKILL.md content:\n${skillMdContent}`,
      apiKeyId: GLOBAL_SKILL_OWNER_ID,
      enabled: true,
      mode: "auto",
      sourceProvider: "skillssh",
      tags: ["featured", "community"],
      installCount: 1,
    });
    return NextResponse.json({ success: true, id: skill.id });
  } catch (err: unknown) {
    const error = sanitizeErrorMessage(err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error }, { status: 500 });
  }
}
