---
layout: default
title: クイックスタートガイド
lang: ja
page_id: quickstart
---

# クイックスタートガイド

NumiSync Wizardを5分で使い始めましょう。このガイドでは、貨幣コレクションを充実させる基本的なワークフローを説明します。

**プラットフォームについて：** このガイドはWindows、macOS、Linuxで共通です。キーボードショートカットが異なる場合はすべてのプラットフォームについて記載しています。

---

## 準備するもの

開始前に以下をご用意ください：

- **NumiSync Wizardがインストール済み**（[インストールガイド](/ja/installation)）
- **OpenNumismatコレクション**（コインが入った.dbファイル）
- **Numista APIキー**（[numista.com](https://www.numista.com/)で無料取得）

---

## ステップ1：起動と設定

### NumiSync Wizardを開く

1. NumiSync Wizardを起動：
   - **Windows：** スタートメニューまたはデスクトップのショートカット
   - **macOS：** Applicationsフォルダまたはランチパッド
   - **Linux：** アプリケーションメニュー、または`numisync-wizard`を実行（.deb/.rpm経由でインストールの場合）
2. 初回起動時にキャッシュディレクトリが自動的に作成されます

### APIキーを追加する

1. **Settings**（歯車アイコン）をクリックするか、以下を押す：
   - **Windows/Linux：** `Ctrl+,`
   - **macOS：** `Cmd+,`
2. **API Settings**タブに移動
3. Numista APIキーを貼り付け
4. **Save**をクリック

**APIキーをお持ちでない場合：** [numista.com](https://www.numista.com/) → プロフィール → API Accessで無料取得

---

## ステップ2：コレクションを開く

1. **File → Open Collection**をクリックするか、以下を押す：
   - **Windows/Linux：** `Ctrl+O`
   - **macOS：** `Cmd+O`
2. OpenNumismatの`.db`ファイルに移動
3. **Open**をクリック
4. コインがメインウィンドウに読み込まれます

**ヒント：** NumiSyncは最近のコレクションを記憶しています。**File → Recent Collections**でクイックアクセス。

---

## ステップ3：マッチを検索する

### 充実させるコインを選択する

コインは1枚ずつまたはまとめて充実させることができます：

- **1枚のコイン：** コインの行をクリックして選択
- **複数のコイン：** 修飾キーを押しながら複数の行をクリック
  - **Windows/Linux：** `Ctrl+Click`
  - **macOS：** `Cmd+Click`
- **範囲：** 最初のコインをクリック、`Shift`を押しながら最後のコインをクリック
- **すべてのコイン：** すべて選択
  - **Windows/Linux：** `Ctrl+A`
  - **macOS：** `Cmd+A`

### 検索を開始する

1. **Search & Enrich**ボタンをクリック（または`F2`を押す）
2. NumiSyncが各選択コインについてNumistaを検索します
3. 進行状況インジケーターが現在の状態を表示

**実行内容：**
- 額面、国、年号、造幣局マークで検索
- バリエーションを処理（例：「Cent」と「Cents」、「USA」と「United States」）
- 非グレゴリオ暦に対応（明治年号、ヒジュラ暦など）
- 利用可能な場合はキャッシュ済みの結果を使用（高速！）

---

## ステップ4：マッチを確認する

### マッチ結果を理解する

検索後、各コインには3つのステータスのいずれかが表示されます：

- **Match Found** — Numistaカタログのエントリーが見つかった
- **Multiple Matches** — 複数の候補あり（手動選択が必要）
- **No Match** — カタログエントリーが見つからない（手動検索を試す）

### フィールド比較を表示する

1. マッチのあるコインをクリック
2. **Field Comparison Panel**が表示：
   - **左列：** 既存のデータ
   - **右列：** Numistaカタログのデータ
   - **差異が色で強調表示**
3. 何が変わるかを確認

---

## ステップ5：マッチを承認または絞り込む

### すべての変更を承認する

マッチが正しいと判断した場合：
1. **Accept Match**ボタンをクリック（または`Enter`を押す）
2. すべてのNumistaデータがコインにすぐに反映されます
3. コインが充実済みとしてマーク

### フィールドを選んで更新する

特定のフィールドのみ更新するには：
1. Field Comparison Panelで更新したくないフィールドの**チェックを外す**
2. **Accept Match**をクリック
3. チェックしたフィールドのみが更新されます

### 別のバリエーションを選ぶ

多くのコインには複数のバリエーション（年号、造幣局マーク、種別）があります：

1. **Choose Issue**ボタンをクリック
2. **Issue Picker Dialog**にすべてのバリエーションが表示されます
3. コインの正しいバリエーションを選択
4. そのバリエーションのデータでフィールド比較が更新されます
5. **Accept Match**をクリック

### 手動検索

自動でマッチが見つからない場合：
1. **Manual Search**ボタンをクリックするか、以下を押す：
   - **Windows/Linux：** `Ctrl+F`
   - **macOS：** `Cmd+F`
2. 検索パラメーターを変更（額面、年号、国）
3. **Search**をクリック
4. 結果を閲覧して正しいエントリーを選択
5. **Accept Match**をクリック

---

## ステップ6：画像をダウンロードする（オプション）

### 自動画像ダウンロード

**Data Settings → Images**が有効の場合：
- マッチを承認すると画像が自動的にダウンロード
- 表面、裏面、縁の画像（利用可能な場合）
- OpenNumismatの画像ディレクトリに保存

### 手動画像ダウンロード

1. 充実済みのコインを選択
2. **Download Images**ボタンをクリック
3. ダウンロードする画像を選択（表面、裏面、縁）
4. **Download**をクリック

**ヒント：** 承認前に**Image Comparison**でプレビューを確認

---

## よくあるワークフロー

### ワークフロー1：新しいコレクションを充実させる

1. 多くの未充実コインがあるコレクションを開く
2. すべてのコインを選択（`Ctrl+A`）
3. **Search & Enrich**をクリック（または`F2`を押す）
4. マッチを1枚ずつ確認
5. 進めながらマッチを承認
6. マッチがないコインには手動検索を使用

**時間節約：** コイン1枚あたり2〜3分 → 10〜15秒

### ワークフロー2：価格のみ更新する

1. **Settings → Data Settings**に移動
2. **Basic**と**Issue**のチェックを外す（**Pricing**はチェックのまま）
3. 更新するコインを選択
4. **Search & Enrich**をクリック
5. マッチを承認（価格のみ更新）

**プロのヒント：** [Supporter License](#)を取得して**Fast Pricing Mode**を使用 — マッチしたすべてのコインを即座に更新！

### ワークフロー3：誤ったマッチを修正する

1. 誤ったデータのコインを選択
2. **Manual Search**をクリック
3. 正しいカタログエントリーを見つける
4. マッチを承認
5. 古いデータが上書きされます

**ヒント：** 承認前に**Field Comparison**で確認

---

## ベストな結果を得るためのヒント

### 検索のヒント

**推奨事項：**
- 完全な情報（年号、国、額面）があるコインから始める
- 標準的な額面の略語を使用（「1c」ではなく「1 Cent」）
- NumiSyncが自動的に額面を正規化するのに任せる

**避けること：**
- 重要なフィールド（国、額面）が欠けているコインを検索する
- 必要でない限り検索クエリを手動で編集する
- 最初のマッチが正しいと思い込む — 必ず確認してください！

### データの品質

**推奨事項：**
- 承認前にField Comparisonを確認
- 複数のバリエーションがある場合はIssue Pickerを使用
- 画像が実際のコインと一致していることを確認

**避けること：**
- すべてのマッチを盲目的に承認する
- 不完全なカタログデータで良いデータを上書きする
- まずコレクションのバックアップを取ることを忘れない！

### パフォーマンス

**推奨事項：**
- キャッシュを有効にする（Settings → General → Cache）
- 10〜20枚のコインのバッチで作業する
- 大規模な更新にはFast Pricing Modeを使用（Supporter License）

**避けること：**
- 1000枚以上のコインを一度に検索する（レート制限は守られますが遅い）
- キャッシュを無効にする（APIコールを無駄にする）
- 同じコインを繰り返し検索する（キャッシュを使用）

---

## キーボードショートカット

**Windows/Linux：**
- `Ctrl+O` — コレクションを開く
- `F2` — 選択したコインをSearch & Enrich
- `Ctrl+F` — 手動検索
- `Enter` — マッチを承認
- `Escape` — キャンセル/ダイアログを閉じる
- `Ctrl+A` — すべてのコインを選択
- `Ctrl+,` — 設定を開く
- `F1` — ヘルプを開く

**macOS：**
- `Cmd+O` — コレクションを開く
- `F2` — 選択したコインをSearch & Enrich
- `Cmd+F` — 手動検索
- `Enter` — マッチを承認
- `Escape` — キャンセル/ダイアログを閉じる
- `Cmd+A` — すべてのコインを選択
- `Cmd+,` — 設定を開く
- `F1` — ヘルプを開く

---

## 次は何をする？

### プレミアム機能を試す

**[Supporter License（$10）](#)**を取得してアンロック：
- **Fast Pricing Mode** — マッチしたすべてのコインの価格を一括更新
- **Auto-Propagate** — タイプデータを一致するコインに自動適用
- **煩わしい通知なし！**

### 高度な機能

- **Field Mapping** — Numistaデータをフィールドにマッピングする方法をカスタマイズ
- **Batch Operations** — 数百枚のコインを効率的に処理
- **Multi-Machine Support** — デバイス間でキャッシュを共有
- **Custom Cache Location** — ネットワークドライブにキャッシュを保存

### さらに詳しく

- **[ユーザーマニュアル](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** — 完全な機能ドキュメント
- **[FAQ](#)** — よくある質問への回答
- **[ビデオチュートリアル](#)** — 近日公開！

---

## サポートが必要な場合

### よくある質問

**Q: なぜコインがマッチしなかったのですか？**
- A: 国や額面の正規化が必要かもしれません。バリエーションを使って手動検索を試してください。

**Q: なぜ一部のフィールドが更新されないのですか？**
- A: **Data Settings**を確認してください — 一部のデータカテゴリが無効になっている可能性があります。

**Q: 承認したマッチを取り消せますか？**
- A: 自動的にはできません。バックアップから復元するか、手動でデータを元に戻してください。

**Q: 他のフィールドを変更せずに価格のみ更新するには？**
- A: Settings → Data Settings → BasicとIssueのチェックを外し、Pricingはチェックのまま。

**Q: コインを2回検索したらどうなりますか？**
- A: 「Refresh from API」をクリックしない限り、NumiSyncはキャッシュ済みの結果を使用します（即座）。

### サポートを受ける

- **問題の報告：** [GitHubで報告](https://github.com/inguy24/numismat-enrichment/issues)
- **ディスカッション：** [コミュニティに質問](https://github.com/inguy24/numismat-enrichment/discussions)
- **ドキュメント：** [完全なドキュメント](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

---

<div style="text-align: center; margin: 2em 0;">
  <a href="/ja/installation" style="display: inline-block; padding: 10px 20px; background: #6c757d; color: white; text-decoration: none; border-radius: 6px;">← インストールガイド</a>
  <a href="/ja/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">ホームに戻る</a>
</div>
