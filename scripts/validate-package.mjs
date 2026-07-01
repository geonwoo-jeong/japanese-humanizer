#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const jsonFiles = [
  "package.json",
  "skills.sh.json",
  "skills.json",
  ".claude-plugin/marketplace.json",
  ".agents/plugins/marketplace.json",
  ".cursor-plugin/marketplace.json"
];

const requiredFiles = [
  "AGENTS.md",
  "LICENSE",
  "README.md",
  "skills/japanese-humanizer/SKILL.md",
  "skills/japanese-humanizer/agents/openai.yaml",
  "plugins/japanese-humanizer/.claude-plugin/plugin.json",
  "plugins/japanese-humanizer/.codex-plugin/plugin.json",
  "plugins/japanese-humanizer/.cursor-plugin/plugin.json",
  "plugins/japanese-humanizer/skills",
  ...jsonFiles
];

const failures = [];

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    failures.push(`${relativePath} が存在しません。`);
  }
}

function parseJson(relativePath) {
  try {
    return JSON.parse(readText(relativePath));
  } catch (error) {
    failures.push(`${relativePath} は JSON として読み込めません: ${error.message}`);
    return null;
  }
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    failures.push(`${label} は ${expected} である必要があります。現在値: ${actual}`);
  }
}

function assertSkillPath(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`スキル参照先 ${relativePath} が存在しません。`);
  }
}

function listFiles(directory, seenDirectories = new Set()) {
  const realDirectory = fs.realpathSync(directory);
  if (seenDirectories.has(realDirectory)) {
    return [];
  }
  seenDirectories.add(realDirectory);

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    const relativePath = path.relative(root, fullPath);
    if (relativePath.startsWith(".git")) {
      return [];
    }
    if (entry.isSymbolicLink()) {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        return listFiles(fullPath, seenDirectories);
      }
      if (stat.isFile()) {
        return [relativePath];
      }
      return [];
    }
    if (entry.isDirectory()) {
      return listFiles(fullPath, seenDirectories);
    }
    if (entry.isFile()) {
      return [relativePath];
    }
    return [];
  });
}

function assertPathExistsFromRoot(label, relativePath) {
  const normalized = relativePath.replace(/^\.\//, "");
  if (!fs.existsSync(path.join(root, normalized))) {
    failures.push(`${label} の参照先 ${relativePath} が存在しません。`);
  }
}

function assertSymlink(relativePath, expectedTarget) {
  const fullPath = path.join(root, relativePath);
  const stat = fs.lstatSync(fullPath);
  if (!stat.isSymbolicLink()) {
    failures.push(`${relativePath} はシンボリックリンクである必要があります。`);
    return;
  }

  const actualTarget = fs.readlinkSync(fullPath);
  if (actualTarget !== expectedTarget) {
    failures.push(`${relativePath} は ${expectedTarget} を指す必要があります。現在値: ${actualTarget}`);
  }
}

for (const file of requiredFiles) {
  assertFile(file);
}

assertSymlink("skills/japanese-humanizer", "../plugins/japanese-humanizer/skills/japanese-humanizer");

const allFiles = listFiles(root);
const skillFiles = allFiles.filter((file) => file.endsWith("SKILL.md"));
const skillRealPaths = new Set(skillFiles.map((file) => fs.realpathSync(path.join(root, file))));
const expectedSkillRealPath = fs.realpathSync(path.join(root, "skills/japanese-humanizer/SKILL.md"));
if (skillRealPaths.size !== 1 || !skillRealPaths.has(expectedSkillRealPath)) {
  failures.push(`SKILL.md は単一原本だけにしてください。現在値: ${skillFiles.join(", ")}`);
}

const skillText = readText("skills/japanese-humanizer/SKILL.md");
if (!skillText.startsWith("---\n")) {
  failures.push("SKILL.md は YAML frontmatter で始まる必要があります。");
}
if (!/^name: japanese-humanizer$/m.test(skillText)) {
  failures.push("SKILL.md の name は japanese-humanizer である必要があります。");
}
if (!/^description: .+/m.test(skillText)) {
  failures.push("SKILL.md には description が必要です。");
}
if (!/^license: MIT$/m.test(skillText)) {
  failures.push("SKILL.md には license: MIT が必要です。");
}

const readmeText = readText("README.md");
if (!readmeText.includes("codex plugin add japanese-humanizer@japanese-humanizer")) {
  failures.push("README.md には Codex plugin add の手順が必要です。");
}
if (!readmeText.includes("--agent codex")) {
  failures.push("README.md の GitHub CLI 例では --agent codex を明示してください。");
}

for (const file of jsonFiles) {
  parseJson(file);
}

const codexPlugin = parseJson("plugins/japanese-humanizer/.codex-plugin/plugin.json");
if (codexPlugin) {
  assertEqual("Codex plugin name", codexPlugin.name, "japanese-humanizer");
  assertEqual("Codex plugin skills", codexPlugin.skills, "./skills/");
  assertSkillPath("plugins/japanese-humanizer/skills/japanese-humanizer/SKILL.md");
}

const codexMarketplace = parseJson(".agents/plugins/marketplace.json");
if (codexMarketplace) {
  const plugin = codexMarketplace.plugins?.find((entry) => entry.name === "japanese-humanizer");
  if (!plugin) {
    failures.push("Codex marketplace に japanese-humanizer の項目がありません。");
  } else {
    assertEqual("Codex marketplace source", plugin.source?.source, "local");
    assertEqual("Codex marketplace path", plugin.source?.path, "./plugins/japanese-humanizer");
    assertEqual("Codex marketplace installation", plugin.policy?.installation, "AVAILABLE");
    assertEqual("Codex marketplace authentication", plugin.policy?.authentication, "ON_INSTALL");
    assertEqual("Codex marketplace category", plugin.category, "Writing");
    assertPathExistsFromRoot("Codex marketplace", "plugins/japanese-humanizer/.codex-plugin/plugin.json");
  }
}

const claudePlugin = parseJson("plugins/japanese-humanizer/.claude-plugin/plugin.json");
if (claudePlugin) {
  assertEqual("Claude plugin name", claudePlugin.name, "japanese-humanizer");
  if (!claudePlugin.skills?.includes("./skills")) {
    failures.push("Claude plugin は ./skills を参照する必要があります。");
  }
}

const claudeMarketplace = parseJson(".claude-plugin/marketplace.json");
if (claudeMarketplace) {
  const plugin = claudeMarketplace.plugins?.find((entry) => entry.name === "japanese-humanizer");
  if (!plugin) {
    failures.push("Claude marketplace に japanese-humanizer の項目がありません。");
  } else {
    assertEqual("Claude marketplace source", plugin.source, "./plugins/japanese-humanizer");
    if (!plugin.skills?.includes("./skills/japanese-humanizer")) {
      failures.push("Claude marketplace は ./skills/japanese-humanizer を参照する必要があります。");
    }
    assertPathExistsFromRoot("Claude marketplace", "plugins/japanese-humanizer/skills/japanese-humanizer/SKILL.md");
  }
}

const cursorPlugin = parseJson("plugins/japanese-humanizer/.cursor-plugin/plugin.json");
if (cursorPlugin) {
  assertEqual("Cursor plugin name", cursorPlugin.name, "japanese-humanizer");
  assertEqual("Cursor plugin skills", cursorPlugin.skills, "skills");
}

const cursorMarketplace = parseJson(".cursor-plugin/marketplace.json");
if (cursorMarketplace) {
  const plugin = cursorMarketplace.plugins?.find((entry) => entry.name === "japanese-humanizer");
  if (!plugin) {
    failures.push("Cursor marketplace に japanese-humanizer の項目がありません。");
  } else {
    assertEqual("Cursor marketplace source", plugin.source, "./plugins/japanese-humanizer");
    assertEqual("Cursor marketplace skills", plugin.skills, "skills");
    assertPathExistsFromRoot("Cursor marketplace", "plugins/japanese-humanizer/skills/japanese-humanizer/SKILL.md");
  }
}

const skillsCatalog = parseJson("skills.json");
if (skillsCatalog) {
  const skill = skillsCatalog.skills?.find((entry) => entry.id === "japanese-humanizer");
  if (!skill) {
    failures.push("skills.json に japanese-humanizer の項目がありません。");
  } else {
    assertEqual("skills.json の path", skill.path, "skills/japanese-humanizer/SKILL.md");
    assertSkillPath(skill.path);
  }
}

const skillsSh = parseJson("skills.sh.json");
if (skillsSh) {
  const listed = skillsSh.groupings?.some((group) => group.skills?.includes("japanese-humanizer"));
  if (!listed) {
    failures.push("skills.sh.json の groupings に japanese-humanizer がありません。");
  }
}

const unresolvedMarkers = ["TO" + "DO", "FIX" + "ME", "[TO" + "DO"];
for (const file of allFiles) {
  const text = readText(file);
  const marker = unresolvedMarkers.find((value) => text.includes(value));
  if (marker) {
    failures.push(`${file} に未解決の作業メモが含まれています。`);
  }
}

if (failures.length > 0) {
  console.error("検証に失敗しました。");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("検証に成功しました。");
