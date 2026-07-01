#!/usr/bin/env node

import fs from "node:fs";
import process from "node:process";

const conjunctions = [
  "まず",
  "さらに",
  "また",
  "一方で",
  "このように",
  "したがって",
  "そのため",
  "つまり",
  "なお",
  "加えて"
];

const abstractWords = [
  "重要",
  "効果的",
  "包括的",
  "体系的",
  "可能性",
  "不可欠",
  "持続可能",
  "促進",
  "活用",
  "最適化"
];

const loanwords = [
  "アジェンダ",
  "インキュベーション",
  "インタラクティブ",
  "ソリューション",
  "イノベーション",
  "エンゲージメント",
  "コミットメント",
  "シナジー"
];

const issueMetadata = {
  "JA-TL-03": { category: "受動態・によって過多", priority: "P2", weight: 3, evidence_grade: "A/B", false_positive_risk: "medium" },
  "JA-TL-04": { category: "サ変名詞構文", priority: "P1", weight: 4, evidence_grade: "B/D", false_positive_risk: "medium" },
  "JA-TL-05": { category: "冗長な可能表現", priority: "P1", weight: 4, evidence_grade: "D", false_positive_risk: "low" },
  "JA-TL-06": { category: "外来語・英語表記過多", priority: "P3", weight: 1, evidence_grade: "A/B", false_positive_risk: "high" },
  "JA-WR-08": { category: "助詞連続・の連続", priority: "P1", weight: 4, evidence_grade: "A/D", false_positive_risk: "medium" },
  "JA-WR-09": { category: "文長・係り受け距離", priority: "P1", weight: 4, evidence_grade: "A", false_positive_risk: "medium" },
  "JA-AI-11": { category: "接続表現の型化", priority: "P2", weight: 3, evidence_grade: "A/D/E", false_positive_risk: "high" },
  "JA-AI-12": { category: "抽象語・総論語過多", priority: "P3", weight: 1, evidence_grade: "B/E", false_positive_risk: "high" },
  "JA-AI-14": { category: "定型的な結論", priority: "P2", weight: 3, evidence_grade: "B/E", false_positive_risk: "high" },
  "JA-MT-22": { category: "事実性・モダリティのずれ", priority: "P2", weight: 3, evidence_grade: "A/B", false_positive_risk: "high" },
  "JA-SP-23": { category: "専門翻訳の用語・表記不統一", priority: "P2", weight: 3, evidence_grade: "A/B", false_positive_risk: "medium" },
  "JA-RB-19": { category: "冗長表現・二重否定", priority: "P1", weight: 4, evidence_grade: "B/D", false_positive_risk: "medium" },
  "JA-WR-21": { category: "文末文体混在", priority: "P1", weight: 4, evidence_grade: "B/D", false_positive_risk: "medium" }
};

const defaultIssueMetadata = {
  category: "未分類の文体信号",
  priority: "P3",
  weight: 1,
  evidence_grade: "E",
  false_positive_risk: "high"
};

const protectedPatterns = [
  { type: "code_block", pattern: /```[\s\S]*?```/g },
  { type: "table_row", pattern: /^\s*\|.*\|\s*$/gm },
  { type: "blockquote", pattern: /^\s*>.*$/gm },
  { type: "url", pattern: /https?:\/\/[^\s)）]+/g },
  { type: "inline_code", pattern: /`[^`\n]+`/g },
  { type: "direct_quote", pattern: /「[\s\S]{1,1200}?」/g },
  { type: "direct_quote", pattern: /"[^"]{1,1200}"/g }
];

const riskHintPatterns = [
  { id: "legal_contract", label: "法務・契約", review_required: true, pattern: /契約|規約|条項|法令|法律|義務|禁止|責任|損害|支払|料金/ },
  { id: "medical", label: "医療", review_required: true, pattern: /医療|診断|治療|薬|副作用|症状|患者|安全性/ },
  { id: "finance", label: "金融", review_required: true, pattern: /金融|投資|融資|利率|返済|保険|証券|税務/ },
  { id: "specification", label: "仕様・規格", review_required: true, pattern: /仕様|要件|規格|しなければならない|してはならない|required|must|shall/i },
  { id: "research", label: "研究", review_required: true, pattern: /研究|査読|統計|有意|被験者/ },
  { id: "authorship_evaluation", label: "本人性・評価依存文書", review_required: true, pattern: /志望理由書|成績評価|推薦状|査読コメント|本人(?:の)?経験|候補者本人|本人性/ }
];

function splitSentences(text) {
  return text
    .replace(/\r\n/g, "\n")
    .split(/(?<=[。！？!?])\s*/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function splitParagraphs(text) {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function compactSample(text) {
  return text.replace(/\s+/g, " ").trim().slice(0, 80);
}

function collectProtectedSpans(text) {
  const spans = protectedPatterns.flatMap(({ type, pattern }) =>
    [...text.matchAll(pattern)].map((match) => ({
      type,
      start: match.index,
      end: match.index + match[0].length,
      sample: compactSample(match[0])
    }))
  );

  return spans
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .reduce((collected, span) => {
      const previous = collected.at(-1);
      if (previous && span.start < previous.end) {
        return collected;
      }
      return [...collected, span];
    }, []);
}

function maskProtectedText(text) {
  const protectedSpans = collectProtectedSpans(text);
  let maskedText = "";
  let cursor = 0;

  for (const span of protectedSpans) {
    maskedText += text.slice(cursor, span.start);
    maskedText += " ".repeat(span.end - span.start);
    cursor = span.end;
  }
  maskedText += text.slice(cursor);

  return { maskedText, protectedSpans };
}

function detectRiskHints(text) {
  return riskHintPatterns
    .filter(({ pattern }) => pattern.test(text))
    .map(({ id, label, review_required }) => ({
      id,
      label,
      review_required,
      handling: "意味保持を優先し、確定書き換えではなく候補提示を検討してください。"
    }));
}

function pushIssue(issues, id, span, reason, suggestion, severity = "medium") {
  const metadata = issueMetadata[id] ?? defaultIssueMetadata;
  issues.push({
    id,
    category: metadata.category,
    span,
    reason,
    suggestion,
    severity,
    priority: metadata.priority,
    weight: metadata.weight,
    evidence_grade: metadata.evidence_grade,
    false_positive_risk: metadata.false_positive_risk
  });
}

function summarizeEngine(issues) {
  const priority_counts = { P1: 0, P2: 0, P3: 0 };
  const rawScore = issues.reduce((sum, issue) => {
    if (Object.prototype.hasOwnProperty.call(priority_counts, issue.priority)) {
      priority_counts[issue.priority] += 1;
    }
    return sum + issue.weight;
  }, 0);
  const rewritePriorityScore = Math.min(100, rawScore * 8);
  const actionLevel =
    rewritePriorityScore >= 70
      ? "full_pass"
      : rewritePriorityScore >= 35
        ? "standard_pass"
        : rewritePriorityScore > 0
          ? "light_pass"
          : "none";
  const topIds = [...new Set([...issues].sort((a, b) => b.weight - a.weight).map((issue) => issue.id))].slice(0, 5);

  return {
    rewrite_priority_score: rewritePriorityScore,
    action_level: actionLevel,
    raw_weight: rawScore,
    priority_counts,
    top_ids: topIds,
    note: "文章の出自判定ではなく、AIっぽさを減らす修正順の目安です。"
  };
}

function profileText(text) {
  const { maskedText, protectedSpans } = maskProtectedText(text);
  const riskHints = detectRiskHints(text);
  const reviewRequired = riskHints.some((hint) => hint.review_required);
  const sentences = splitSentences(maskedText);
  const paragraphs = splitParagraphs(maskedText);
  const issues = [];

  for (const sentence of sentences) {
    const sentenceLength = [...sentence].length;
    const commaCount = countMatches(sentence, /[、,]/g);

    if (sentenceLength > 100 || commaCount >= 4) {
      pushIssue(
        issues,
        "JA-WR-09",
        sentence.slice(0, 120),
        "文が長い、または読点が多く、係り受けを追いにくい可能性があります。",
        "文を分け、主語と述語を近づけます。"
      );
    }

    const redundantPotentialPattern = /[^\s。！？!?、,]{2,}ことが(?:でき(?:る|ます)|可能(?:です|である)?)/;
    if (redundantPotentialPattern.test(sentence)) {
      pushIssue(
        issues,
        "JA-TL-05",
        sentence.match(/[^。！？!?]*[^\s。！？!?、,]{2,}ことが(?:でき(?:る|ます)|可能(?:です|である)?)[^。！？!?]*/)?.[0] ?? sentence,
        "冗長な可能表現です。",
        "意味差がなければ「できます」「可能です」を簡潔にします。",
        "low"
      );
    }

    if (/[一-龠々ぁ-んァ-ンー]{2,}を(?:行う|行います|実施する|実施します|実行する|実行します)/.test(sentence)) {
      pushIssue(
        issues,
        "JA-TL-04",
        sentence,
        "サ変名詞と汎用動詞が重なり、文が重くなっています。",
        "用語化していなければ動詞化します。"
      );
    }

    if (/(?:によって|により).*(?:された|される|されました|行われた|行われます|実施された|決定された)/.test(sentence)) {
      pushIssue(
        issues,
        "JA-TL-03",
        sentence,
        "受動態と「によって」「により」が重なっています。",
        "主体が明確なら能動態にします。"
      );
    }

    if (/(?:[^。！？!?、,\s]{1,12}の){3,}[^。！？!?、,\s]{1,12}/.test(sentence)) {
      pushIssue(
        issues,
        "JA-WR-08",
        sentence,
        "「の」が連続し、係り受けが読みにくい可能性があります。",
        "動詞化、名詞結合、句分割で整理します。"
      );
    }

    if (/ないわけではない|ないとはいえない|なくもない/.test(sentence)) {
      pushIssue(
        issues,
        "JA-RB-19",
        sentence,
        "二重否定により意味が遠回しになっています。",
        "法的・研究上の慎重表現でなければ肯定形に近づけます。"
      );
    }

    if (/このように.*(?:重要です|重要である|不可欠です)|今後も注目され/.test(sentence)) {
      pushIssue(
        issues,
        "JA-AI-14",
        sentence,
        "結論が定型的で、判断や条件が残りにくい表現です。",
        "原文内の対象、条件、理由、限界を前面化します。",
        "low"
      );
    }
  }

  const conjunctionCounts = Object.fromEntries(
    conjunctions.map((word) => [word, countMatches(maskedText, new RegExp(word, "g"))])
  );
  const repeatedConjunctions = Object.entries(conjunctionCounts).filter(([, count]) => count >= 2);
  const totalConjunctions = Object.values(conjunctionCounts).reduce((sum, count) => sum + count, 0);
  if (repeatedConjunctions.length > 0 || totalConjunctions >= 5) {
    pushIssue(
      issues,
      "JA-AI-11",
      repeatedConjunctions.map(([word, count]) => `${word}:${count}`).join(", ") || `接続表現合計:${totalConjunctions}`,
      "接続表現が型として反復している可能性があります。",
      "不要な接続詞を削り、原文に明示された因果・対比・例示だけを残します。"
    );
  }

  const politeEndings = countMatches(maskedText, /(?:です|ます|ました|ください)[。！？!?]/g);
  const plainEndings = countMatches(maskedText, /(?:だ|である|する|した|なる|なった)[。！？!?]/g);
  if (politeEndings >= 2 && plainEndings >= 2) {
    pushIssue(
      issues,
      "JA-WR-21",
      `敬体:${politeEndings}, 常体:${plainEndings}`,
      "敬体と常体が本文内で混在している可能性があります。",
      "引用や表を除外し、用途に合う文体へ統一します。"
    );
  }

  for (const word of loanwords) {
    const count = countMatches(maskedText, new RegExp(word, "g"));
    if (count >= 2) {
      pushIssue(
        issues,
        "JA-TL-06",
        `${word}:${count}`,
        "未定着の外来語が反復している可能性があります。",
        "定着度と読者を確認し、必要なら言い換えか説明を添えます。"
      );
    }
  }

  const abstractWordCounts = Object.fromEntries(
    abstractWords.map((word) => [word, countMatches(maskedText, new RegExp(word, "g"))])
  );
  const abstractTotal = Object.values(abstractWordCounts).reduce((sum, count) => sum + count, 0);
  if (abstractTotal >= 5) {
    pushIssue(
      issues,
      "JA-AI-12",
      Object.entries(abstractWordCounts)
        .filter(([, count]) => count > 0)
        .map(([word, count]) => `${word}:${count}`)
        .join(", "),
      "抽象語・総論語が多く、結論が丸く見える可能性があります。",
      "原文内の対象、条件、理由、限界を前面化します。"
    );
  }

  const sentenceLengths = sentences.map((sentence) => [...sentence].length);
  const averageSentenceLength =
    sentenceLengths.length === 0
      ? 0
      : sentenceLengths.reduce((sum, length) => sum + length, 0) / sentenceLengths.length;

  return {
    schema: "japanese_humanizer_diagnostic_profile",
    schema_version: "2026-07-01",
    mode: "diagnostic_profile",
    version: "2026-07-01",
    metrics: {
      characters: [...text].length,
      paragraphs: paragraphs.length,
      sentences: sentences.length,
      average_sentence_length: Number(averageSentenceLength.toFixed(1)),
      comma_count: countMatches(maskedText, /[、,]/g),
      conjunction_count: totalConjunctions,
      abstract_word_count: abstractTotal,
      protected_span_count: protectedSpans.length
    },
    engine: summarizeEngine(issues),
    review_required: reviewRequired,
    risk_hints: riskHints,
    has_protected_spans: protectedSpans.length > 0,
    protected_spans: protectedSpans,
    diagnostic_note: "この出力は低レベル診断であり、最終JSON出力ではありません。protected_spans 自体は自動編集せず、review_required が true の場合は rewrite_status を proposal_only とし、本文へ確定反映しない候補を分けてください。",
    issues
  };
}

function runSelfTest() {
  const sample =
    "この調査は、利用者の満足度を確認することができますし、委員会によって実施されました。このように、制度の変更の影響の確認は重要です。";
  const result = profileText(sample);
  const ids = new Set(result.issues.map((issue) => issue.id));
  for (const expected of ["JA-TL-05", "JA-TL-03", "JA-WR-08", "JA-AI-14"]) {
    if (!ids.has(expected)) {
      throw new Error(`${expected} が検出されませんでした。`);
    }
  }
  if (result.engine.rewrite_priority_score <= 0 || result.issues.some((issue) => !issue.priority || !issue.evidence_grade)) {
    throw new Error("実行優先度メタデータが出力されませんでした。");
  }

  const potentialPhraseSample = "AI技術を活用することによって業務効率を向上させることができます。";
  const potentialPhraseResult = profileText(potentialPhraseSample);
  if (!potentialPhraseResult.issues.some((issue) => issue.id === "JA-TL-05")) {
    throw new Error("動詞句を含む冗長な可能表現が検出されませんでした。");
  }

  const highRiskSample = "本契約に基づき、利用者は料金を支払うものとします。法律で定められている事項は変更しません。";
  const highRiskResult = profileText(highRiskSample);
  if (highRiskResult.issues.length !== 0) {
    throw new Error("高リスク文書の保守的な例で不要な指摘が発生しました。");
  }
  if (highRiskResult.engine.action_level !== "none") {
    throw new Error("指摘がない場合の実行優先度が none になりませんでした。");
  }
  if (!highRiskResult.review_required || highRiskResult.risk_hints.length === 0) {
    throw new Error("高リスク文書の確認ヒントが出力されませんでした。");
  }

  const protectedSample =
    "仕様書では `確認することができます` を用語例として示します。\n| 表現 | 説明 |\n| --- | --- |\n| このように重要です | 例 |\n本文では、改善を実施することができます。";
  const protectedResult = profileText(protectedSample);
  const protectedIds = protectedResult.issues.map((issue) => issue.id);
  if (!protectedIds.includes("JA-TL-05") || protectedIds.includes("JA-AI-14")) {
    throw new Error("保護対象を除外した診断になっていません。");
  }
  if (protectedResult.protected_spans.length < 2) {
    throw new Error("保護対象の検出結果が出力されませんでした。");
  }

  const longQuoteSample = `「これは非常に重要であり、さらに、このように今後も注目されることが期待されます。
二行目でも確認することができます」と引用したうえで、本文では改善を実施します。`;
  const longQuoteResult = profileText(longQuoteSample);
  if (longQuoteResult.issues.some((issue) => issue.id === "JA-AI-14" || issue.id === "JA-TL-05")) {
    throw new Error("複数行引用が診断対象から保護されていません。");
  }

  const technicalArticleSample = "このAPIは認証トークンを受け取り、MCPサーバーへリクエストを送ります。";
  const technicalArticleResult = profileText(technicalArticleSample);
  if (technicalArticleResult.review_required || technicalArticleResult.risk_hints.length !== 0) {
    throw new Error("通常の技術説明が高リスク扱いになっています。");
  }

  const authorshipSample = "志望理由書では、候補者本人の経験と評価に関わる内容を扱います。";
  const authorshipResult = profileText(authorshipSample);
  if (!authorshipResult.review_required || !authorshipResult.risk_hints.some((hint) => hint.id === "authorship_evaluation")) {
    throw new Error("本人性・評価依存文書の確認ヒントが出力されませんでした。");
  }
  if (result.schema !== "japanese_humanizer_diagnostic_profile" || result.mode !== "diagnostic_profile") {
    throw new Error("診断スキーマ名が出力されませんでした。");
  }
}

function readInput(argv) {
  const file = argv.find((arg) => !arg.startsWith("--"));
  if (file) {
    return fs.readFileSync(file, "utf8");
  }
  return fs.readFileSync(0, "utf8");
}

if (process.argv.includes("--self-test")) {
  runSelfTest();
  console.log("自己検証に成功しました。");
} else {
  const text = readInput(process.argv.slice(2));
  console.log(JSON.stringify(profileText(text), null, 2));
}
