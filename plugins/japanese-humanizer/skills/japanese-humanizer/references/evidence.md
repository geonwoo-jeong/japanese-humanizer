# 根拠資料メモ

この文書は、`taxonomy.md` と `quick-rules.md` の判断を支える最小限の根拠メモである。研究や公的資料は、文章の出自判定をしない前提で、文体改善の監査信号としてだけ使う。

## 修正優先度エンジンへの変換

研究で有効とされた特徴量を、そのまま判定器にしない。意味保持しやすい表層修正、文脈判断が必要な修正、監査だけに留める修正へ分ける。

| 信号 | スキル内の扱い | 主な反映先 |
| --- | --- | --- |
| 機能語、助詞 bigram、品詞 bigram、読点位置 | 係り受け、文長、助詞連続、接続表現の監査信号 | JA-WR-08、JA-WR-09、JA-WR-10、JA-AI-11 |
| 句パターン、品詞 n-gram | 定型的な締め、均質な段落構成、過剰整形の監査信号 | JA-AI-13、JA-AI-14、JA-LLM-20 |
| post-editese の simplification、normalisation、interference | 短くしすぎ、無難化、原文言語干渉の監査信号 | JA-MT-16、JA-MT-17、JA-MT-18 |
| 翻訳における明示化 | 原文にない指示対象、接続補強、背景説明、強調を足していないかの監査信号 | JA-MT-18、JA-AI-11、JA-AI-15 |
| 役割語・女ことばの過剰付与 | 話者像、性別、年齢、階層を訳文側で増幅していないかの監査信号 | JA-LLM-20 |
| テクストジャンルによる翻訳プロセス差 | 文学、詩、報道、技術文で同じ自然化をしないための方針 | JA-MT-16、JA-MT-17、JA-LLM-20 |
| 事実性、モダリティ、スコープ | 断定、推量、否定、条件、従属節の範囲を変えないための監査信号 | JA-MT-22 |
| 専門翻訳の用語、時制、注記 | 自然化の前に用語一貫性、用語の不統一、時間関係、略語注記を保つための監査信号 | JA-TL-06、JA-MT-18、JA-MT-22、JA-SP-23 |
| 公用文、読点、外来語、ポストエディットの指針 | 読み手配慮、意味保持、高リスク文書の安全基準 | JA-TL-06、JA-TL-07、JA-WR-09、JA-RB-19 |
| 公用文、JIS、技術文の簡潔化規則 | 一文一論点、重複削減、能動態優先、冗長表現の短縮 | JA-TL-03、JA-TL-04、JA-TL-05、JA-WR-09、JA-RB-19 |
| 外来語・専門語の言い換え資料 | 未定着語は読者に合わせ、専門語は削らず必要なら説明を添える判断 | JA-TL-06、JA-SP-23 |
| 連語・コロケーション、無生物主語の翻訳教育資料 | 直訳調の名詞句を、日本語の自然な主題・述語・連語へ直す判断 | JA-TL-02、JA-TL-04、JA-RB-19 |

`修正優先度エンジン` は、taxonomy の P1/P2/P3 重みを作業順へ変換するための目安である。`quick-rules.md` は、この対応を「パターン」と「処方」に圧縮した高速実行用の参照である。

## 主要資料

| 資料 | 使いどころ |
| --- | --- |
| [Zaitsu & Jin 2023, PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0288453) | 日本語文体の機能語、品詞 bigram、助詞 bigram、読点位置。 |
| [Zaitsu et al. 2024, PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0299031) | 日本語公共コメントの句パターン、品詞 bigram/trigram、機能語。 |
| [PLOS ONE 2025, multi-LLM stylometry](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0335369) | 複数LLMの日本語文体における function word、品詞 bigram、句パターン。 |
| [Frontiers 2026, Japanese LLM fingerprint](https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2026.1771115/full) | 日本語LLM文体 fingerprint の参考。 |
| Y. F. Meldrum, Translationese-Specific Linguistic Characteristics | 翻訳文に出やすい三人称代名詞、長い段落、翻訳文体。 |
| 阿辺川武ほか「英日翻訳における受動態の訳し方の分析」 | 英日翻訳の受動態を一律に残さず、文体と主体関係で判断する根拠。 |
| 文化庁「公用文作成の考え方」 | 係り受け、二重否定、外来語、読み手配慮。 |
| [JSA「JIS原案作成のための手引」](https://webdesk.jsa.or.jp/pdf/dev/md_1249.pdf) | 技術文の能動態、長文分割、冗長な規定表現の簡潔化。 |
| 国立国語研究所「外来語」言い換え提案、読点に関する解説 | 未定着外来語、読点と係り受け距離。 |
| [国立国語研究所「病院の言葉」](https://www2.ninjal.ac.jp/byoin/) | 専門語を消さず、読者に応じて説明を添える判断。 |
| [Toral 2019, Post-editese](https://aclanthology.org/W19-6627/) | post-editese の simplification、normalisation、interference。 |
| [AAMT「機械翻訳ポストエディットガイドライン」](https://aamt.info/wp-content/uploads/2025/07/AAMT_PE_Guideline_Ver1.0.pdf) | 生成AIを含む機械翻訳後の人手確認、品質仕様、ライト/フルの範囲、用語、locale、リスク管理。 |
| [大西夢「AI生成文からみた『自然な日本語』についての研究」](https://home.hiroshima-u.ac.jp/jshira/papers/AI%E7%94%9F%E6%88%90%E6%96%87%E3%81%8B%E3%82%89%E3%81%BF%E3%81%9F%E3%80%8C%E8%87%AA%E7%84%B6%E3%81%AA%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%80%8D%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6%E3%81%AE%E7%A0%94%E7%A9%B6%EF%BC%88%E5%A4%A7%E8%A5%BF%E5%A4%A2%EF%BC%89.pdf) | 文長、接続、文末、段落の均質さを自然さの監査信号として扱う参考。 |
| [田野村忠温「日本語コーパスとコロケーション」](https://www.jstage.jst.go.jp/article/gengo/138/0/138_1/_pdf) | 語の自然な結びつき、連語単位での不自然さを確認する参考。 |
| [劉明綱「コーパスに見る中日翻訳における『明示化』の特徴」](https://jaits.jpn.org/home/kaishi2010/pdf/08_Liu_MingKang.pdf) | 翻訳で指示対象、接続、強調、含意、背景説明が明示化されやすいことへの注意。 |
| [島田紗裕華ほか「機械翻訳向けプリエディットのための情報明示化方略の体系化」](https://www.anlp.jp/proceedings/annual_meeting/2022/pdf_dir/F7-2.pdf) | 翻訳後の過剰な明示化を、本文補足と注記候補に分ける判断。 |
| [「翻訳者がおこなうプリエディットの有効な手段」](https://www.anlp.jp/proceedings/annual_meeting/2020/pdf_dir/G2-4.pdf) | MT向けに整えられた日本語が残す主語・係り受け・無生物主語の監査。 |
| [古川弘子「女ことばと翻訳」](https://jaits.jpn.org/home/kaishi2013/01_furukawa.pdf) | 翻訳で女性登場人物の文末詞や女ことばが過剰に付与されるリスク。 |
| [古川弘子「翻訳・非翻訳小説における女ことば」](https://www.jstage.jst.go.jp/article/its/17/0/17_1705/_article/-char/ja/) | 翻訳小説と非翻訳小説の文末詞使用、読者受容。 |
| [石原知英「テクストジャンルによる翻訳プロセスの違い」](https://jaits.jpn.org/home/kaishi2010/pdf/06_Ishihara.pdf) | 詩、小説、新聞記事で翻訳時の注意点と原文志向・訳文志向が変わる根拠。 |
| [「日本語学を応用した英日翻訳者用教材冊子 OJT 実践報告」](https://www.jstage.jst.go.jp/article/iits/19/0/19_1910/_pdf/-char/ja) | 無生物主語、`have` 型、SVO直訳を日本語の主題構文へ戻す例。 |
| [村田匡輝ほか「日本語テキストにおける読点位置の検出」](https://www.anlp.jp/proceedings/annual_meeting/2010/pdf_dir/D3-7.pdf) | 読点位置を形態素、係り受け、節境界で見る根拠。 |
| [Wang & Li 2025, PMLR](https://proceedings.mlr.press/v278/wang25c.html) | 専門翻訳の post-editing で用語、時制、技術注記、構造的一貫性を確認する根拠。 |
| [成田和弥ほか「誤り分析に基づく日本語事実性解析の課題抽出」](https://www.jstage.jst.go.jp/article/jnlp/22/5/22_397/_pdf) | 日本語の事実性がモダリティ、機能表現、スコープに依存することへの注意。 |
| [JTF「翻訳品質評価ガイドライン」](https://www.jtf.jp/pdf/jtf_translation_quality_guidelines_v1.pdf) | 正確さ、事実性、用語、用語の不統一、スタイル、locale の評価軸。 |
| [JTF「日本語標準スタイルガイド」](https://www.jtf.jp/pdf/jtf_style_guide.pdf) | 和文句読点、表記、全半角、スタイル一貫性。 |
| [AAMT UTX Specification](https://aamt.info/wp-content/uploads/2019/06/utx1.20-specification-e.pdf) | UTX 用語集と文書内用語の一貫性。 |
| textlint / textlint-ja rules | 文長、冗長表現、同語反復、助詞連続などの実装参考。 |
