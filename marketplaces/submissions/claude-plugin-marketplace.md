# Claude Code Plugin Marketplace 提出メモ

## 提出先

- サービス: Claude Code Plugin Marketplace
- 仕様: https://code.claude.com/docs/en/plugin-marketplaces
- リポジトリ: https://github.com/geonwoo-jeong/japanese-humanizer

## 現在の状態

`.claude-plugin/marketplace.json` と `plugins/japanese-humanizer/.claude-plugin/plugin.json` を用意済みです。ユーザーはリポジトリを marketplace として追加し、`japanese-humanizer` プラグインをインストールできます。

## 提出時に貼る内容

- 名称: `japanese-humanizer`
- 表示名: 日本語ヒューマナイザー
- キャッチ: AI文を、自然な日本語へ
- 説明: AI文や翻訳調の日本語を、意味を保ったまま自然な日本語へ整える Claude Code 向け Agent Skill です。検出回避、出自判定、著者偽装ではなく、自然な日本語への編集支援に限定します。

## インストール確認

```text
/plugin marketplace add geonwoo-jeong/japanese-humanizer
/plugin install geonwoo-jeong@japanese-humanizer
```
