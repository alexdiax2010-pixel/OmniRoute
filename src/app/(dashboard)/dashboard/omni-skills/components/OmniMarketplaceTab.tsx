"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/shared/components/Button";
import Input from "@/shared/components/Input";
import { Card } from "@/shared/components";
import type { SkillsProvider } from "@/lib/skills/providerSettings";
import type { JSX } from "react";

interface MarketplaceSkill {
  name: string;
  description: string;
  skillMdContent?: string;
  version?: string;
  sourceUrl?: string;
}

interface SkillsShSkill {
  id: string;
  skillId: string;
  name: string;
  installs: number;
  source: string;
}

interface FeaturedSkillEntry {
  id: string;
  name: string;
  project: string;
  description: string;
  source: string;
  skillId?: string;
  license: string;
  repositoryUrl: string;
  highlighted?: boolean;
}

interface FeaturedProject {
  name: string;
  count: number;
}

interface FeaturedResponse {
  skills?: FeaturedSkillEntry[];
  projects?: FeaturedProject[];
  total?: number;
}

/** Featured skills rendered per page; "Show more" reveals this many more. */
export const FEATURED_PAGE_SIZE = 24;
/** Debounce applied to the featured search box before refetching. */
const FEATURED_SEARCH_DEBOUNCE_MS = 250;

interface OmniMarketplaceTabProps {
  skillsProvider: SkillsProvider;
  onRefreshSkills: () => Promise<void>;
}

export function OmniMarketplaceTab({
  skillsProvider,
  onRefreshSkills,
}: OmniMarketplaceTabProps): JSX.Element {
  const t = useTranslations("skills");
  const [mpQuery, setMpQuery] = useState("");
  const [mpResults, setMpResults] = useState<MarketplaceSkill[]>([]);
  const [mpLoading, setMpLoading] = useState(false);
  const [mpError, setMpError] = useState("");
  const [mpInstallingId, setMpInstallingId] = useState<string | null>(null);
  const [shQuery, setShQuery] = useState("");
  const [shResults, setShResults] = useState<SkillsShSkill[]>([]);
  const [shLoading, setShLoading] = useState(false);
  const [shError, setShError] = useState("");
  const [shInstallingId, setShInstallingId] = useState<string | null>(null);
  const [featured, setFeatured] = useState<FeaturedSkillEntry[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>([]);
  const [featuredTotal, setFeaturedTotal] = useState(0);
  const [featuredQuery, setFeaturedQuery] = useState("");
  const [featuredDebouncedQuery, setFeaturedDebouncedQuery] = useState("");
  const [featuredProject, setFeaturedProject] = useState<string | null>(null);
  const [featuredVisible, setFeaturedVisible] = useState(FEATURED_PAGE_SIZE);
  const [featuredLoadedKey, setFeaturedLoadedKey] = useState<string | null>(null);
  const [featuredError, setFeaturedError] = useState("");
  const [featuredInstallingId, setFeaturedInstallingId] = useState<string | null>(null);
  const [featuredInstalled, setFeaturedInstalled] = useState<string[]>([]);
  const featuredRequestId = useRef(0);

  const featuredKey = (() => {
    const params = new URLSearchParams();
    if (featuredDebouncedQuery) params.set("q", featuredDebouncedQuery);
    if (featuredProject) params.set("project", featuredProject);
    return params.toString();
  })();
  const featuredLoading = featuredLoadedKey !== featuredKey;

  useEffect(() => {
    const timer = setTimeout(
      () => setFeaturedDebouncedQuery(featuredQuery.trim()),
      FEATURED_SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [featuredQuery]);

  useEffect(() => {
    // Each fetch gets a sequence number; a response that is not the latest is dropped.
    const requestId = ++featuredRequestId.current;
    const params = new URLSearchParams();
    if (featuredDebouncedQuery) params.set("q", featuredDebouncedQuery);
    if (featuredProject) params.set("project", featuredProject);
    const qs = params.toString();
    fetch(`/api/skills/featured${qs ? `?${qs}` : ""}`)
      .then((res) => (res.ok ? res.json() : { skills: [] }))
      .then((data: FeaturedResponse) => {
        if (requestId !== featuredRequestId.current) return;
        setFeaturedLoadedKey(qs);
        const skills = data.skills || [];
        setFeatured(skills);
        if (Array.isArray(data.projects)) setFeaturedProjects(data.projects);
        setFeaturedTotal((prev) =>
          typeof data.total === "number" ? data.total : Math.max(prev, skills.length)
        );
      })
      .catch(() => {
        if (requestId !== featuredRequestId.current) return;
        setFeaturedLoadedKey(qs);
        setFeatured([]);
      });
  }, [featuredDebouncedQuery, featuredProject]);

  const installFeatured = async (skill: FeaturedSkillEntry) => {
    setFeaturedInstallingId(skill.id);
    setFeaturedError("");
    try {
      const res = await fetch("/api/skills/featured/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: skill.id }),
      });
      const data = await res.json();
      if (res.ok && (data as { success?: boolean }).success) {
        setFeaturedInstalled((prev) => [...prev, skill.id]);
        await onRefreshSkills();
      } else {
        setFeaturedError((data as { error?: string }).error || t("installError"));
      }
    } catch (err) {
      setFeaturedError(err instanceof Error ? err.message : t("installError"));
    } finally {
      setFeaturedInstallingId(null);
    }
  };

  const searchMarketplace = async () => {
    setMpLoading(true);
    setMpError("");
    setMpResults([]);
    try {
      const res = await fetch(`/api/skills/marketplace?q=${encodeURIComponent(mpQuery)}`);
      const data = await res.json();
      if (!res.ok) {
        setMpError((data as { error?: string }).error || t("marketplaceError"));
      } else {
        setMpResults(
          Array.isArray(data) ? data : (data as { skills?: MarketplaceSkill[] }).skills || []
        );
      }
    } catch (err) {
      setMpError(err instanceof Error ? err.message : t("marketplaceError"));
    } finally {
      setMpLoading(false);
    }
  };

  const installFromMarketplace = async (skill: MarketplaceSkill) => {
    setMpInstallingId(skill.name);
    try {
      const res = await fetch("/api/skills/marketplace/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: skill.name,
          description: skill.description,
          skillMdContent: skill.skillMdContent || skill.description,
          version: skill.version || "1.0.0",
          sourceUrl: skill.sourceUrl,
        }),
      });
      const data = await res.json();
      if (res.ok && (data as { success?: boolean }).success) {
        await onRefreshSkills();
        setMpInstallingId(null);
      } else {
        setMpError((data as { error?: string }).error || t("installError"));
        setMpInstallingId(null);
      }
    } catch (err) {
      setMpError(err instanceof Error ? err.message : t("installError"));
      setMpInstallingId(null);
    }
  };

  const searchSkillsSh = async () => {
    setShLoading(true);
    setShError("");
    setShResults([]);
    try {
      const res = await fetch(`/api/skills/skillssh?q=${encodeURIComponent(shQuery)}`);
      const data = await res.json();
      if (!res.ok) {
        setShError((data as { error?: string }).error || t("marketplaceError"));
      } else {
        setShResults((data as { skills?: SkillsShSkill[] }).skills || []);
      }
    } catch (err) {
      setShError(err instanceof Error ? err.message : t("marketplaceError"));
    } finally {
      setShLoading(false);
    }
  };

  const installFromSkillsSh = async (skill: SkillsShSkill) => {
    setShInstallingId(skill.id);
    try {
      const res = await fetch("/api/skills/skillssh/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: skill.name,
          description: `Installed from skills.sh (${skill.source})`,
          source: skill.source,
          skillId: skill.skillId,
        }),
      });
      const data = await res.json();
      if (res.ok && (data as { success?: boolean }).success) {
        await onRefreshSkills();
        setShInstallingId(null);
      } else {
        setShError((data as { error?: string }).error || t("installError"));
        setShInstallingId(null);
      }
    } catch (err) {
      setShError(err instanceof Error ? err.message : t("installError"));
      setShInstallingId(null);
    }
  };

  return (
    <div className="grid gap-4">
      {featuredTotal > 0 && (
        <Card>
          <h3 className="font-semibold mb-2">{t("featuredSkills")}</h3>
          <p className="text-sm text-text-muted mb-4">{t("featuredSkillsHint")}</p>
          <Input
            type="text"
            icon="search"
            value={featuredQuery}
            onChange={(e) => {
              setFeaturedQuery(e.target.value);
              setFeaturedVisible(FEATURED_PAGE_SIZE);
            }}
            placeholder={t("featuredSearchPlaceholder")}
            aria-label={t("featuredSearchPlaceholder")}
            className="mb-3"
          />
          <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label={t("featuredSkills")}>
            {[{ name: null as string | null, count: featuredTotal }, ...featuredProjects].map(
              (project) => {
                const active = featuredProject === project.name;
                return (
                  <button
                    key={project.name ?? "__all__"}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setFeaturedProject(project.name);
                      setFeaturedVisible(FEATURED_PAGE_SIZE);
                    }}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-text-muted hover:text-text"
                    }`}
                  >
                    {project.name ?? t("featuredAllProjects")} · {project.count}
                  </button>
                );
              }
            )}
          </div>
          <p className="text-xs text-text-muted mb-3" aria-live="polite">
            {t("featuredCount", {
              shown: Math.min(featuredVisible, featured.length),
              total: featured.length,
            })}
          </p>
          {featuredError && (
            <div className="p-3 rounded-lg bg-error/10 text-error text-sm mb-4">
              {featuredError}
            </div>
          )}
          {!featuredLoading && featured.length === 0 && (
            <div className="text-center py-6 text-text-muted text-sm">{t("featuredNoResults")}</div>
          )}
          <div className="grid gap-3">
            {featured.slice(0, featuredVisible).map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <h4 className="font-semibold flex items-center gap-1">
                    {skill.highlighted && (
                      <span
                        className="material-symbols-outlined text-[16px] text-primary"
                        aria-hidden="true"
                      >
                        star
                      </span>
                    )}
                    <span className="truncate">{skill.name}</span>
                    <span className="text-xs font-normal text-text-muted shrink-0">
                      · {skill.project}
                    </span>
                  </h4>
                  <p className="text-sm text-text-muted mt-1 line-clamp-2">{skill.description}</p>
                  <a
                    href={skill.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-text-muted underline"
                  >
                    {skill.source} · {skill.license}
                  </a>
                </div>
                <Button
                  size="sm"
                  onClick={() => installFeatured(skill)}
                  disabled={
                    featuredInstallingId === skill.id || featuredInstalled.includes(skill.id)
                  }
                >
                  {featuredInstallingId === skill.id
                    ? t("installing")
                    : featuredInstalled.includes(skill.id)
                      ? t("installed")
                      : t("installSkillButton")}
                </Button>
              </div>
            ))}
          </div>
          {featured.length > featuredVisible && (
            <div className="mt-3 flex justify-center">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setFeaturedVisible((v) => v + FEATURED_PAGE_SIZE)}
              >
                {t("featuredShowMore")}
              </Button>
            </div>
          )}
        </Card>
      )}
      <Card>
        <h3 className="font-semibold mb-2">{t("skillsMarketplace")}</h3>
        <p className="text-sm text-text-muted mb-4">
          {t("activeProvider")}{" "}
          <span className="font-medium">
            {skillsProvider === "skillsmp" ? "SkillsMP" : "skills.sh"}
          </span>
          . {t("changeInSettings")}
        </p>
        <div className="flex gap-2 mb-4">
          <Input
            type="text"
            icon="search"
            value={skillsProvider === "skillsmp" ? mpQuery : shQuery}
            onChange={(e) =>
              skillsProvider === "skillsmp"
                ? setMpQuery(e.target.value)
                : setShQuery(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === "Enter" &&
              (skillsProvider === "skillsmp" ? searchMarketplace() : searchSkillsSh())
            }
            placeholder={t("searchMarketplacePlaceholder")}
            aria-label={t("searchMarketplacePlaceholder")}
            className="flex-1"
          />
          <Button
            onClick={() => (skillsProvider === "skillsmp" ? searchMarketplace() : searchSkillsSh())}
            disabled={skillsProvider === "skillsmp" ? mpLoading : shLoading}
          >
            {skillsProvider === "skillsmp"
              ? mpLoading
                ? t("searching")
                : t("searchMarketplace")
              : shLoading
                ? t("searching")
                : t("searchMarketplace")}
          </Button>
        </div>
        {(skillsProvider === "skillsmp" ? mpError : shError) && (
          <div className="p-3 rounded-lg bg-error/10 text-error text-sm mb-4">
            {skillsProvider === "skillsmp" ? mpError : shError}
          </div>
        )}
      </Card>

      {skillsProvider === "skillsmp" && mpResults.length > 0 && (
        <div className="grid gap-3">
          {mpResults.map((skill) => (
            <Card key={skill.name}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{skill.name}</h4>
                  <p className="text-sm text-text-muted mt-1">{skill.description}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => installFromMarketplace(skill)}
                  disabled={mpInstallingId === skill.name}
                >
                  {mpInstallingId === skill.name ? t("installing") : t("installSkillButton")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {skillsProvider === "skillssh" && shResults.length > 0 && (
        <div className="grid gap-3">
          {shResults.map((skill) => (
            <Card key={skill.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{skill.name}</h4>
                  <p className="text-sm text-text-muted mt-1">
                    {skill.source} · {skill.installs.toLocaleString()} {t("installs")}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => installFromSkillsSh(skill)}
                  disabled={shInstallingId === skill.id}
                >
                  {shInstallingId === skill.id ? t("installing") : t("installSkillButton")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {skillsProvider === "skillsmp" && !mpLoading && mpResults.length === 0 && !mpError && (
        <Card>
          <div className="text-center py-8 text-text-muted">{t("marketplaceSkillsMpHint")}</div>
        </Card>
      )}
      {skillsProvider === "skillssh" && !shLoading && shResults.length === 0 && !shError && (
        <Card>
          <div className="text-center py-8 text-text-muted">{t("marketplaceSkillsShHint")}</div>
        </Card>
      )}
    </div>
  );
}

export default OmniMarketplaceTab;
