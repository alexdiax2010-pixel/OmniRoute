import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { CLI_TOOLS } = await import("../../src/shared/constants/cliTools.ts");
const { CliCatalogEntrySchema } = await import("../../src/shared/schemas/cliCatalog.ts");

test("paperclip is a schema-valid agent guide entry pointing at OmniRoute", () => {
  const entry = CLI_TOOLS.paperclip;
  assert.ok(entry, "paperclip must be registered in CLI_TOOLS");
  assert.equal(CliCatalogEntrySchema.safeParse(entry).success, true);
  assert.equal(entry.category, "agent");
  assert.equal(entry.configType, "guide");
  assert.equal(entry.baseUrlSupport, "full");
  assert.equal(entry.acpSpawnable, false);
  assert.ok(
    entry.guideSteps?.some((step) => step.value === "{{baseUrl}}"),
    "guide must surface the OmniRoute base URL"
  );
  assert.ok(entry.guideSteps?.some((step) => step.type === "apiKeySelector"));
  assert.ok(entry.guideSteps?.some((step) => step.type === "modelSelector"));
});

test("paperclip is declared in the CLI tools manifest as catalog-only", () => {
  const manifest = JSON.parse(readFileSync("config/cli-tools-manifest.json", "utf8"));
  const tool = manifest.tools.paperclip;
  assert.ok(tool, "paperclip must exist in config/cli-tools-manifest.json");
  assert.deepEqual(tool.binaries, ["paperclipai"]);
  assert.equal(tool.surfaces.catalog, true);
  assert.equal(tool.surfaces.run, false);
});
