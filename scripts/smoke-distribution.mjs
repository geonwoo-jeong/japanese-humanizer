#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const requireTools = process.env.SMOKE_REQUIRE_TOOLS === "1";
const failures = [];

function hasCommand(command) {
  const result = spawnSync(command, ["--help"], { stdio: "ignore" });
  return result.status === 0;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    ...options,
    env: {
      ...process.env,
      ...options.env
    }
  });

  if (result.status !== 0) {
    failures.push(`${command} ${args.join(" ")} が失敗しました。\n${result.stderr || result.stdout}`);
  }

  return result;
}

function skip(command) {
  const message = `${command} が見つからないためスモーク検証をスキップしました。`;
  if (requireTools) {
    failures.push(message);
  } else {
    console.log(message);
  }
}

function verifyCodex() {
  if (!hasCommand("codex")) {
    skip("codex");
    return;
  }

  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "japanese-humanizer-codex-"));
  const env = { HOME: tempHome };

  try {
    run("codex", ["plugin", "marketplace", "add", root], { env });

    const available = run("codex", ["plugin", "list", "--available", "--json"], { env });
    if (available.status === 0) {
      const parsed = JSON.parse(available.stdout);
      const found = parsed.available?.some((plugin) => plugin.pluginId === "japanese-humanizer@japanese-humanizer");
      if (!found) {
        failures.push("Codex marketplace に japanese-humanizer@japanese-humanizer が表示されません。");
      }
    }

    run("codex", ["plugin", "add", "japanese-humanizer@japanese-humanizer"], { env });

    const installed = run("codex", ["plugin", "list", "--json"], { env });
    if (installed.status === 0) {
      const parsed = JSON.parse(installed.stdout);
      const plugin = parsed.installed?.find((entry) => entry.pluginId === "japanese-humanizer@japanese-humanizer" && entry.enabled);
      if (!plugin) {
        failures.push("Codex plugin install 後に japanese-humanizer が有効化されていません。");
      } else {
        const installedSkill = path.join(
          tempHome,
          ".codex",
          "plugins",
          "cache",
          "japanese-humanizer",
          "japanese-humanizer",
          plugin.version,
          "skills",
          "japanese-humanizer",
          "SKILL.md"
        );
        if (!fs.existsSync(installedSkill)) {
          failures.push("Codex plugin cache 内に skills/japanese-humanizer/SKILL.md が存在しません。");
        } else {
          const text = fs.readFileSync(installedSkill, "utf8");
          if (!/^name: japanese-humanizer$/m.test(text)) {
            failures.push("Codex plugin cache 内の SKILL.md が japanese-humanizer として認識できません。");
          }
        }
      }
    }
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
}

function verifyClaude() {
  if (!hasCommand("claude")) {
    skip("claude");
    return;
  }

  run("claude", ["plugin", "validate", root]);
}

function verifyGitHubSkill() {
  if (!hasCommand("gh")) {
    skip("gh");
    return;
  }

  run("gh", ["skill", "publish", "--dry-run"]);
}

verifyCodex();
verifyClaude();
verifyGitHubSkill();

if (failures.length > 0) {
  console.error("スモーク検証に失敗しました。");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("スモーク検証に成功しました。");
