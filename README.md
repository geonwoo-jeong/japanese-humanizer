# 日本語ヒューマナイザー

日本語の文章を、意味を変えずに自然で人間らしい文体へ整えるための Agent Skill 配布リポジトリです。

このリポジトリでは `plugins/japanese-humanizer/skills/japanese-humanizer/SKILL.md` を唯一のスキル本文として管理し、ルートの `skills/japanese-humanizer` はその入口として同じ実体を参照します。Claude Code、Codex、Cursor、skills.sh、GitHub CLI の各配布経路は、この同じスキル本文を使います。

## 配布構成

```text
skills/japanese-humanizer/SKILL.md       # ルートから参照できるスキル入口
.claude-plugin/marketplace.json          # Claude Code 用マーケットプレイス
.agents/plugins/marketplace.json         # Codex 用マーケットプレイス
.cursor-plugin/marketplace.json          # Cursor 用マーケットプレイス
plugins/japanese-humanizer/              # 各エージェントがインストールするプラグイン本体
skills.sh.json                           # skills.sh 用グルーピング
skills.json                              # 汎用カタログメタデータ
```

`plugins/japanese-humanizer/skills/japanese-humanizer/SKILL.md` をスキル本文の実体として管理し、`skills/japanese-humanizer` はそこへのシンボリックリンクにしています。これにより、root の `skills/` 規約と Codex plugin cache の両方で同じスキル本文を使えます。

## インストール

以下では公開先の例として `github-user/japanese-humanizer` を使います。実際の公開先に合わせて読み替えてください。

### skills.sh

```bash
npx skills add github-user/japanese-humanizer
```

### GitHub CLI

```bash
gh skill install github-user/japanese-humanizer japanese-humanizer --agent codex
```

`--agent` を省略すると、非対話環境では GitHub Copilot が既定のインストール先になります。Codex、Claude Code、Cursor などに入れる場合は対象を明示してください。

### Claude Code

```text
/plugin marketplace add github-user/japanese-humanizer
/plugin install japanese-humanizer@japanese-humanizer
```

### Codex

```bash
codex plugin marketplace add github-user/japanese-humanizer
codex plugin add japanese-humanizer@japanese-humanizer
```

### Cursor

Cursor の marketplace import 機能で、このリポジトリを追加し、`japanese-humanizer` プラグインを選択してください。マーケットプレイス定義は `.cursor-plugin/marketplace.json`、プラグイン本体は `plugins/japanese-humanizer` にあります。

## 開発

検証は Node.js だけで実行できます。

```bash
npm test
```

新しい文章やコメントを追加するときは、リポジトリ運用ルールに従って日本語で記述します。外部 API 名、コマンド、ファイル名、識別子などは互換性を優先してそのまま使えます。
