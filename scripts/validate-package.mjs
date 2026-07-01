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
  "skills/japanese-humanizer/references/taxonomy.md",
  "skills/japanese-humanizer/references/quick-rules.md",
  "skills/japanese-humanizer/references/revision-playbook.md",
  "skills/japanese-humanizer/references/evidence.md",
  "skills/japanese-humanizer/scripts/profile-japanese-text.mjs",
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
const frontmatterEnd = skillText.indexOf("\n---", 4);
const frontmatterText = frontmatterEnd === -1 ? "" : skillText.slice(4, frontmatterEnd).trim();
const frontmatterKeys = frontmatterText
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => /^[A-Za-z_-]+:/.test(line))
  .map((line) => line.split(":")[0]);
for (const key of frontmatterKeys) {
  if (!["name", "description"].includes(key)) {
    failures.push(`SKILL.md の frontmatter は name と description だけにしてください。現在の余分なキー: ${key}`);
  }
}
for (const reference of ["taxonomy.md", "quick-rules.md", "revision-playbook.md", "evidence.md"]) {
  if (!skillText.includes(`references/${reference}`)) {
    failures.push(`SKILL.md は references/${reference} を案内する必要があります。`);
  }
}
if (!skillText.includes("scripts/profile-japanese-text.mjs")) {
  failures.push("SKILL.md は診断スクリプトを案内する必要があります。");
}
if (!skillText.includes("AIが作成した日本語") || !skillText.includes("AIっぽさを減ら")) {
  failures.push("SKILL.md は AIが作成した日本語のAIっぽさを減らす目的を明記してください。");
}
if (!skillText.includes("AI検出器回避、出自判定、偽装目的では使わない")) {
  failures.push("SKILL.md の description は検出回避、出自判定、偽装目的を対象外として明記してください。");
}
if (!skillText.includes("本文を書き換えない") || !skillText.includes("中立目的")) {
  failures.push("SKILL.md は検出回避や著者偽装が明示目的の依頼では本文を書き換えない方針を明記してください。");
}
if (!skillText.includes("修正文案と要確認箇所")) {
  failures.push("SKILL.md は高リスク文書や意味保持が不確実な場合の出力分岐を明記してください。");
}
if (!skillText.includes("rewrite_priority_score") || !skillText.includes("P1/P2/P3") || !skillText.includes("`engine`")) {
  failures.push("SKILL.md は修正優先度エンジン、P1/P2/P3、JSON の engine を明記してください。");
}
if (!skillText.includes("node plugins/japanese-humanizer/skills/japanese-humanizer/scripts/profile-japanese-text.mjs")) {
  failures.push("SKILL.md は診断スクリプトのリポジトリルートからの実行例を明記してください。");
}
if (!skillText.includes("本人性") || !skillText.includes("評価に関わる文書")) {
  failures.push("SKILL.md は本人性や評価に関わる文書を高リスク文書として扱ってください。");
}
if (!skillText.includes("protected_spans") || !skillText.includes("diagnostic_profile") || !skillText.includes("review_required")) {
  failures.push("SKILL.md は診断スクリプトの保護対象、高リスクヒント、要確認出力の扱いを明記してください。");
}
if (!skillText.includes("周辺の低リスク本文は確定反映してよい") || !skillText.includes("`review_required` が `true`")) {
  failures.push("SKILL.md は protected_spans と proposal_only の発火条件を分けて説明してください。");
}
if (skillText.includes("上等な健康") || skillText.includes("葉のかたまり") || skillText.includes("個体数が多い")) {
  failures.push("SKILL.md に分野別の詳細例を戻さず、revision-playbook.md に集約してください。");
}

const taxonomyText = readText("skills/japanese-humanizer/references/taxonomy.md");
for (const id of ["JA-TL-03", "JA-TL-05", "JA-WR-09", "JA-AI-14", "JA-LLM-20", "JA-MT-22", "JA-SP-23"]) {
  if (!taxonomyText.includes(id)) {
    failures.push(`taxonomy.md には ${id} が必要です。`);
  }
}
if (!taxonomyText.includes("文章の出自判定には使わない")) {
  failures.push("taxonomy.md は出自判定に使わない方針を明記してください。");
}
if (!taxonomyText.includes("AIが作成した日本語") || !taxonomyText.includes("AIっぽい均質さ")) {
  failures.push("taxonomy.md は AI生成文に見えやすい表層特徴を分類対象として明記してください。");
}
if (
  !taxonomyText.includes("実行優先度") ||
  !taxonomyText.includes("修正優先度スコア") ||
  !taxonomyText.includes("P1") ||
  !taxonomyText.includes("P2") ||
  !taxonomyText.includes("P3")
) {
  failures.push("taxonomy.md は P1/P2/P3 と修正優先度スコアを定義してください。");
}

const quickRulesText = readText("skills/japanese-humanizer/references/quick-rules.md");
if (
  !quickRulesText.includes("高速処方") ||
  !quickRulesText.includes("処方") ||
  !quickRulesText.includes("過剰修正ガード") ||
  !quickRulesText.includes("出自判定には使わない")
) {
  failures.push("quick-rules.md は高速処方、処方、過剰修正ガード、出自判定しない方針を明記してください。");
}
for (const phrase of [
  "によって",
  "することができる",
  "の連続",
  "このように",
  "明示化",
  "役割語",
  "事実性",
  "用語の不統一",
  "文長が均一",
  "post-editese",
  "function word",
  "Toral",
  "Zaitsu"
]) {
  if (!quickRulesText.includes(phrase)) {
    failures.push(`quick-rules.md には ${phrase} を含めてください。`);
  }
}

const playbookText = readText("skills/japanese-humanizer/references/revision-playbook.md");
if (!playbookText.includes("事実保持") || !playbookText.includes("JSON")) {
  failures.push("revision-playbook.md には監査と JSON 出力方針が必要です。");
}
if (!playbookText.includes("修正文案と要確認箇所") || !playbookText.includes("義務、禁止、条件、否定、責任主体")) {
  failures.push("revision-playbook.md には高リスク文書の修正文案と要確認箇所の出力分岐が必要です。");
}
if (
  !skillText.includes("rewrite_status") ||
  !skillText.includes("review_required") ||
  !playbookText.includes('"rewrite_status": "proposal_only"') ||
  !playbookText.includes('"review_required": true') ||
  !playbookText.includes("JSONでも確定書き換えにしない")
) {
  failures.push("SKILL.md と revision-playbook.md は JSON 出力でも高リスク文書を proposal_only にする必要があります。");
}
if (
  !playbookText.includes("原文にない具体例") ||
  !playbookText.includes("推測で補わない") ||
  playbookText.includes("支援の重複") ||
  playbookText.includes("優先すべき点を決める材料") ||
  playbookText.includes("重要な材料になる") ||
  playbookText.includes("欠かせません") ||
  playbookText.includes("抽象的な結論を具体化する")
) {
  failures.push("revision-playbook.md は原文にない具体性を足さない例示にしてください。");
}
if (
  !playbookText.includes("engine.rewrite_priority_score") ||
  !playbookText.includes("action_level") ||
  !playbookText.includes("priority_counts") ||
  !playbookText.includes('"engine"')
) {
  failures.push("revision-playbook.md は修正優先度エンジンの読み方と JSON の engine を説明してください。");
}
if (
  !playbookText.includes("翻訳後の最終パス") ||
  !playbookText.includes("明示化") ||
  !playbookText.includes("役割語") ||
  !playbookText.includes("ライトポストエディット") ||
  !playbookText.includes("事実性") ||
  !playbookText.includes("用語の不統一") ||
  !playbookText.includes("時制") ||
  !playbookText.includes("半角記号") ||
  !playbookText.includes("途中で切れた敬語") ||
  !playbookText.includes("含意を強めすぎない") ||
  !playbookText.includes("句読点を統一") ||
  !playbookText.includes("飼育下") ||
  !playbookText.includes("同じ性質をもつ子孫") ||
  !playbookText.includes("幼い個体") ||
  !playbookText.includes("個体数が多い") ||
  !playbookText.includes("安定して食物を得る") ||
  !playbookText.includes("変異した種") ||
  !playbookText.includes("一つがい") ||
  !playbookText.includes("外敵や事故") ||
  !playbookText.includes("頭打ちになる") ||
  !playbookText.includes("身体構造") ||
  !playbookText.includes("重要な意味を持つ") ||
  !playbookText.includes("上等な健康") ||
  !playbookText.includes("葉のかたまり") ||
  !playbookText.includes("一年生のとき") ||
  !playbookText.includes("銀行業") ||
  !playbookText.includes("バランスの取れた人間")
) {
  failures.push("revision-playbook.md は翻訳後の語感、敬語、含意保持の最終パスを説明してください。");
}
if (!playbookText.includes("出力形式の正本は `SKILL.md`") || !playbookText.includes("diagnostic_profile")) {
  failures.push("revision-playbook.md は出力形式の正本と診断スクリプト JSON の違いを明記してください。");
}
if (playbookText.includes("P1 / JA-TL-05: 「把握することを目的として」") || playbookText.includes("P3 / JA-AI-12: 「このように")) {
  failures.push("revision-playbook.md の例は taxonomy ID と対象表現を一致させてください。");
}

const diagnosticScriptText = readText("skills/japanese-humanizer/scripts/profile-japanese-text.mjs");
for (const phrase of [
  "japanese_humanizer_diagnostic_profile",
  "diagnostic_profile",
  "protected_spans",
  "has_protected_spans",
  "risk_hints",
  "review_required",
  "authorship_evaluation",
  "JA-MT-22",
  "JA-SP-23",
  "category",
  "diagnostic_note"
]) {
  if (!diagnosticScriptText.includes(phrase)) {
    failures.push(`診断スクリプトには ${phrase} を含めてください。`);
  }
}
for (const phrase of ["code_block", "table_row", "url", "direct_quote"]) {
  if (!diagnosticScriptText.includes(phrase)) {
    failures.push(`診断スクリプトは保護対象 ${phrase} を扱ってください。`);
  }
}

const evidenceText = readText("skills/japanese-humanizer/references/evidence.md");
if (!evidenceText.includes("出自判定をしない") || !evidenceText.includes("textlint")) {
  failures.push("evidence.md は出自判定をしない方針と実装参考資料の扱いを明記してください。");
}
if (
  !evidenceText.includes("修正優先度エンジン") ||
  !evidenceText.includes("quick-rules.md") ||
  !evidenceText.includes("Zaitsu") ||
  !evidenceText.includes("劉明綱") ||
  !evidenceText.includes("古川弘子") ||
  !evidenceText.includes("石原知英") ||
  !evidenceText.includes("村田匡輝") ||
  !evidenceText.includes("Wang & Li 2025") ||
  !evidenceText.includes("成田和弥") ||
  !evidenceText.includes("JTF") ||
  !evidenceText.includes("UTX") ||
  !evidenceText.includes("Toral") ||
  !evidenceText.includes("AAMT")
) {
  failures.push("evidence.md は研究根拠を修正優先度エンジンと quick-rules.md へ変換する説明を含めてください。");
}
if (
  evidenceText.includes("## 説明時の言い方") ||
  evidenceText.includes("Koike, Kaneko, Okazaki") ||
  evidenceText.includes("Castilho et al. 2019") ||
  evidenceText.includes("Wu et al. 2025") ||
  evidenceText.includes("水野ほか")
) {
  failures.push("evidence.md は実行に不要な説明例や補助 bibliography を含めないでください。");
}

const openaiYamlText = readText("skills/japanese-humanizer/agents/openai.yaml");
function yamlStringValue(key) {
  const match = openaiYamlText.match(new RegExp(`^\\s+${key}:\\s+"([^"]+)"`, "m"));
  return match?.[1] ?? "";
}

const displayName = yamlStringValue("display_name");
const shortDescription = yamlStringValue("short_description");
const defaultPrompt = yamlStringValue("default_prompt");
const brandColor = yamlStringValue("brand_color");

if (displayName !== "日本語ヒューマナイザー") {
  failures.push("openai.yaml の display_name が SKILL.md と一致していません。");
}
const shortDescriptionLength = [...shortDescription].length;
if (shortDescriptionLength < 25 || shortDescriptionLength > 64) {
  failures.push(`openai.yaml の short_description は 25〜64 文字にしてください。現在値: ${shortDescriptionLength}`);
}
if (!defaultPrompt.includes("$japanese-humanizer")) {
  failures.push("openai.yaml の default_prompt には $japanese-humanizer を含めてください。");
}
if (!shortDescription.includes("AIっぽさ") || !defaultPrompt.includes("AIっぽさ")) {
  failures.push("openai.yaml は AIっぽさを減らす用途を説明してください。");
}
if (!defaultPrompt.includes("意味を保ったまま") || !defaultPrompt.includes("検出回避")) {
  failures.push("openai.yaml の default_prompt は意味保持と検出回避に使わない方針を含めてください。");
}
if (openaiYamlText.includes("AIが書いた")) {
  failures.push("openai.yaml はユーザー未明示の出自を断定しない表現にしてください。");
}
if (!/^#[0-9A-Fa-f]{6}$/.test(brandColor)) {
  failures.push("openai.yaml の brand_color は #RRGGBB 形式にしてください。");
}

const readmeText = readText("README.md");
if (!readmeText.includes("codex plugin add japanese-humanizer@japanese-humanizer")) {
  failures.push("README.md には Codex plugin add の手順が必要です。");
}
if (!readmeText.includes("--agent codex")) {
  failures.push("README.md の GitHub CLI 例では --agent codex を明示してください。");
}
if (!readmeText.includes("AIが作成した日本語") || !readmeText.includes("AIっぽさ")) {
  failures.push("README.md は AIが作成した日本語のAIっぽさを減らす目的を説明してください。");
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
