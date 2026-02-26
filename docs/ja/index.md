---
layout: default
title: NumiSync Wizard — OpenNumismatコレクションを充実させる
lang: ja
page_id: index
---

<div style="text-align: center; margin: 2em 0 1em 0;">
  <img src="/assets/images/logo.svg" alt="NumiSync Wizard for OpenNumismat" style="max-width: 500px; width: 100%;" />
</div>

<div style="text-align: center; margin: 2em 0;">
  <a href="/ja/download" style="display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 1.1em; margin: 0.5em;">ダウンロード</a>
  <a href="https://github.com/inguy24/numismat-enrichment" style="display: inline-block; padding: 12px 24px; background: #24292e; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0.5em;">GitHubで見る</a>
</div>
<div style="text-align: center; margin: 0.5em 0 2em 0; color: #666; font-size: 0.9em;">
  Windows、macOS、Linux対応
</div>

---

## NumiSync Wizardについて

NumiSync WizardはOpenNumismatの貨幣コレクションデータベースを、充実したNumistaカタログと連携させ、コインの照合を自動的に行い、以下の情報でコレクションを充実させます：

- 詳細なカタログ情報（発行枚数、素材、統治者、デザイナー）
- 4段階のグレード別現在市場価格（UNC、XF、VF、F）
- タイプごとの複数バリエーション（年号、造幣局マーク、種別）
- 高解像度画像（表面・裏面・縁）
- ファジー検索と手動上書きによるスマートマッチング

データ入力に費やす時間を減らし、コレクションを楽しむ時間を増やしたいすべての収集家に最適です。

---

## 機能

### インテリジェントなコインマッチング
額面の正規化、発行機関の解決、非グレゴリオ暦対応（明治・ヒジュラ・タイ仏暦）を備えたファジー検索。

### 細かいデータ管理
同期するデータを正確に選択：カタログの基本情報、バリエーション、または価格データ。必要なフィールドのみ更新できます。

### フィールドの視覚的比較
既存データと新データを並べて比較。更新する個別フィールドを選択するか、すべての変更を一括で承認できます。

### 高速価格更新モード（プレミアム）
マッチしたすべてのコインの価格を数秒で一括更新。コインを一枚ずつクリックする必要はもうありません。*(Supporter Licenseが必要)*

### タイプデータの自動伝播
タイプレベルのデータ（発行枚数、素材、統治者、デザイナー）をコレクション内の一致するすべてのコインに自動適用します。*(Supporter Licenseが必要)*

### マルチマシン同期 *(Supporter Edition)*
共有ネットワークドライブ、Dropbox、またはNASを介して、複数のコンピューター間でAPIキャッシュと設定を共有。
APIの呼び出し数はすべてのマシンで正確に累計されます。新しいマシンへの設定インポートはワンクリック。

### スマートキャッシュ
永続的なAPIキャッシュにより冗長なリクエストを削減し、Numistaのレート制限を遵守します。キャッシュデータを使ってオフラインでも動作します。

### 高度なフィールドマッピング
Numistaの45以上のデータソースをOpenNumismatのフィールドにどのようにマッピングするかをカスタマイズ。データの完全な制御が可能です。

---

## スクリーンショット

### メインウィンドウ — コレクション管理
![メインウィンドウ](/assets/images/screenshots/main-window.png)
*充実したカタログデータ、画像、価格情報とともにコレクションを閲覧*

### インテリジェントなマッチ選択
![マッチ選択](/assets/images/screenshots/match-select.png)
*スマート検索が額面の正規化とファジーマッチングを使って正確な一致を見つけます*

### フィールドの並列比較
![フィールド比較](/assets/images/screenshots/field-comparison.png)
*更新前に既存データと新データを確認 — 個別フィールドを選択するかすべて承認*

### バリエーション選択
![Issue Picker](/assets/images/screenshots/issue-picker.png)
*年号、造幣局マーク、種別の違いなど、コインの正確なバリエーションを選択*

### 高速価格更新モード（プレミアム）
![Fast Pricing Mode](/assets/images/screenshots/fast-pricing-mode.png)
*数百枚のコインの価格を数秒で一括更新（Supporter License機能）*

### 詳細データ設定
![データ設定](/assets/images/screenshots/data-settings.png)
*同期するデータカテゴリを正確に選択 — Basic、Issue、Pricing、Images*

### 高度なフィールドマッピング
![フィールドマッピング](/assets/images/screenshots/field-mappings.png)
*Numistaの45以上のデータソースをOpenNumismatフィールドにマッピングする方法をカスタマイズ*

### グリッドビューモード
![グリッドビュー](/assets/images/screenshots/grid-view.png)
*サムネイル画像と主要な詳細情報を使ったコレクションの代替表示*

---

## ダウンロード

<div style="text-align: center; margin: 2em 0;">
  <a href="/ja/download" style="display: flex; align-items: center; justify-content: center; gap: 2em; flex-wrap: wrap; text-decoration: none; color: inherit;">
    <span style="display: inline-flex; align-items: center; gap: 0.4em;">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 88 88"><path d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529l.028 34.453L.028 75.48.026 45.7zm4.326-39.025L87.314 0v41.527l-47.318.376zm47.329 39.349l-.011 41.34-47.318-6.678-.066-34.739z" fill="#00adef"/></svg>
      <strong>Windows</strong>
    </span>
    <span style="display: inline-flex; align-items: center; gap: 0.4em;">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" fill="#555"/></svg>
      <strong>macOS</strong>
    </span>
    <span style="display: inline-flex; align-items: center; gap: 0.4em;">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 48 48">
        <!-- Body -->
        <ellipse cx="24" cy="30" rx="12" ry="14" fill="#000"/>
        <!-- Belly -->
        <ellipse cx="24" cy="31" rx="8" ry="10" fill="#fff"/>
        <!-- Left wing -->
        <ellipse cx="13" cy="27" rx="4" ry="8" fill="#000"/>
        <!-- Right wing -->
        <ellipse cx="35" cy="27" rx="4" ry="8" fill="#000"/>
        <!-- Head -->
        <circle cx="24" cy="16" r="9" fill="#000"/>
        <!-- Left eye outer -->
        <ellipse cx="20" cy="15" rx="2.5" ry="3" fill="#fff"/>
        <!-- Right eye outer -->
        <ellipse cx="28" cy="15" rx="2.5" ry="3" fill="#fff"/>
        <!-- Left pupil -->
        <circle cx="20.5" cy="15.5" r="1.2" fill="#000"/>
        <!-- Right pupil -->
        <circle cx="28.5" cy="15.5" r="1.2" fill="#000"/>
        <!-- Beak -->
        <path d="M 22 19 L 24 21 L 26 19 Z" fill="#fdb603"/>
        <!-- Left foot -->
        <ellipse cx="18" cy="43" rx="3.5" ry="2" fill="#fdb603"/>
        <path d="M 15 43 L 14 45 M 17 43 L 17 45 M 19 43 L 20 45" stroke="#fdb603" stroke-width="1.2" fill="none"/>
        <!-- Right foot -->
        <ellipse cx="30" cy="43" rx="3.5" ry="2" fill="#fdb603"/>
        <path d="M 27 43 L 26 45 M 29 43 L 29 45 M 31 43 L 32 45" stroke="#fdb603" stroke-width="1.2" fill="none"/>
      </svg>
      <strong>Linux</strong>
    </span>
  </a>
  <p style="margin-top: 0.5em; color: #888; font-size: 0.9em;">上をクリックすると、お使いのプラットフォームのすべてのダウンロードオプションを確認できます</p>
</div>
---

## クイックスタート

5つの簡単なステップで始めましょう：

1. **NumiSync Wizardをインストール**してアプリケーションを起動
2. **OpenNumismatコレクションを開く**（.dbファイル）
3. **Settings → Numista APIキーを追加**（[numista.com](https://www.numista.com/)で無料取得）
4. **コインを選択 → "Search & Enrich"をクリック**してマッチを検索
5. **マッチを確認 → 変更を承認 → 完了！**

詳細な手順については、[インストールガイド](/ja/installation)と[クイックスタートガイド](/ja/quickstart)をご覧ください。

**対応プラットフォーム：**
- **Windows 10/11** — インストーラーで完全サポート
- **macOS 10.13+** — Intel・Apple Silicon（M1/M2/M3）対応
- **Linux** — Debian/Ubuntu (.deb)、Fedora/RHEL (.rpm)、汎用（AppImage）

---

## 開発を支援する

### コレクター仲間の皆さんへ！

私はOpenNumismatでの貨幣コレクションのカタログ作業に費やす膨大な時間を節約しようとNumiSync Wizardを作りました。こういったお願いはよく耳にするかとは思いますが、この非常にニッチなソフトウェアへのサポートをぜひご検討ください。コーヒー2杯分の価格（最近は値上がりしましたね！）で、サポーターになることができます。

### NumiSync Wizardのコア機能は無料です：

- インテリジェントなコインマッチングと検索
- フィールドの視覚的比較と選択的更新
- バリエーション選択
- 画像のダウンロードと比較
- スマートキャッシュ — APIコールを削減し、キャッシュデータでオフライン動作
- 高度なフィールドマッピング

### Supporter License（$10）で得られるもの：

- **Fast Pricing Mode** — コレクション全体の価格を一括更新
- **Auto-Propagate** — タイプデータを一致するコインに自動適用
- **Multi-Machine Sync** — すべてのコンピューター間でキャッシュと設定を共有
- **煩わしい通知なし！**
- **将来のプレミアム機能の割引**
- インディペンデントソフトウェアを支援する満足感

<div style="text-align: center; margin: 2em 0;">
  <a href="/ja/license" style="display: inline-block; padding: 12px 24px; background: #6f42c1; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">サポーターになる — $10</a>
</div>

皆さまのサポートは開発コストをカバーし、コレクターコミュニティのためにNumiSyncを改善し続けることを可能にします。

**一度購入すれば永続利用可能** • 現在のプレミアム機能を永久にロック解除
**5台のデバイスで有効化可能** • サブスクリプションなし • オープンソース（MIT License）

<div style="text-align: center; margin: 1em 0;">
  <a href="https://github.com/inguy24/numismat-enrichment">GitHubでソースコードを見る</a>
</div>

**敬具、**
Shane（コレクター仲間）

---

## ドキュメント

- **ユーザーマニュアル** — アプリ内蔵（F1キーを押す）
- [インストールガイド](/ja/installation)
- [クイックスタートガイド](/ja/quickstart)
- [完全なドキュメント](https://github.com/inguy24/numismat-enrichment/tree/main/docs)
- [変更履歴](https://github.com/inguy24/numismat-enrichment/blob/main/docs/CHANGELOG.md)
- [ビルドガイド](https://github.com/inguy24/numismat-enrichment/blob/main/docs/guides/BUILD-GUIDE.md)（開発者向け）

---

## 必要なソフトウェア

### OpenNumismat
**[OpenNumismatをダウンロード](https://opennumismat.github.io/)** — Windows、macOS、Linux向けの無料オープンソースの貨幣コレクション管理ソフトウェアです。OpenNumismatはコインのカタログ作成のための強力なデータベースを提供し、NumiSync Wizardはカタログデータと価格を自動的に入力することでそれを強化します。

### Numista
**[Numista.comを訪問](https://www.numista.com/)** — 世界中のコインに関する詳細情報を持つ世界最大のオンライン貨幣カタログです。NumiSync WizardはNumista APIを使用してカタログデータ、価格、画像を取得します。APIキーを取得するには無料のNumistaアカウントが必要です。
