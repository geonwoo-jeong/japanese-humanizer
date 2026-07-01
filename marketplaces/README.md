# 外部ディレクトリ対応

このディレクトリは、skills.sh 以外の Agent Skill ディレクトリへ提出するための配布情報をまとめたものです。実行時のスキル本体ではありません。スキルの単一原本は `plugins/japanese-humanizer/skills/japanese-humanizer/SKILL.md` に置き、ここには提出文、状態、確認先だけを集約します。

## 共通プロフィール

| 項目 | 内容 |
| --- | --- |
| 名称 | `japanese-humanizer` |
| 表示名 | 日本語ヒューマナイザー |
| キャッチ | AI文を、自然な日本語へ |
| リポジトリ | https://github.com/geonwoo-jeong/japanese-humanizer |
| スキル入口 | `skills/japanese-humanizer/SKILL.md` |
| プラグイン本体 | `plugins/japanese-humanizer` |
| ライセンス | MIT |
| 対象言語 | 日本語 |

提出時の説明は `marketplaces/profile.json` を正本にします。各サービスのフォームには、`marketplaces/submissions/` の該当ファイルを貼り付けます。

## 対応表

| ID | サービス | 提出方法 | 状態 |
| --- | --- | --- | --- |
| `skills-sh` | skills.sh | 公開リポジトリの自動収集と実インストール確認 | 公開済み |
| `claude-plugin-marketplace` | Claude Code Plugin Marketplace | リポジトリ内の `.claude-plugin/marketplace.json` を公開 | 準備済み |
| `lobehub` | LobeHub Skills | 公開 SKILL.md バンドルとして登録または収集対象化 | 準備済み |
| `skillsmp` | SkillsMP | GitHub 上の SKILL.md と README を収集対象にする | 準備済み |
| `skillsllm` | SkillsLLM | 提出フォームにリポジトリ URL を送る | 準備済み |
| `mcpservers-agent-skills` | MCPServers Agent Skills | Agent Skills 用の提出フォームに送る | 準備済み |
| `mcpmarket` | MCP Market Agent Skills | 提出フォーム、または有料掲載を使う | 準備済み |
| `claudeskills-info` | ClaudeSkills.info | 提出フォームにリポジトリ URL と説明を送る | 準備済み |
| `awesomeskill` | AwesomeSkill.ai | ディレクトリ提出または公開リポジトリ収集を待つ | 準備済み |
| `shyft` | Shyft Skills | 公開フォームが明確でないため問い合わせまたは収集待ち | 問い合わせ必要 |
| `oneaway` | OneAway Skills | キュレーション型の可能性が高く問い合わせまたは収集待ち | キュレーション待ち |

## 提出時の固定文

```text
AI文を、自然な日本語へ

AI文や翻訳調の日本語を、意味を保ったまま自然な日本語へ整える Agent Skill です。検出回避、出自判定、著者偽装ではなく、読み手に引っかかる機械的な硬さを減らすための編集支援として設計しています。
```

## 確認手順

1. `marketplaces/profile.json` の URL、インストールコマンド、状態を確認する。
2. 対象サービスの `marketplaces/submissions/*.md` を開き、提出フォームに必要な項目だけを貼る。
3. 提出後に公開 URL が決まった場合は `marketplaces/profile.json` の `url` または `submissionUrl` を更新する。
4. `npm test` を実行し、README、カタログ、提出キットの整合性を確認する。
