---
layout: default
title: インストールガイド
lang: ja
page_id: installation
---

# インストールガイド

NumiSync Wizardは**Windows**、**macOS**、**Linux**対応です。インストール手順については、お使いのプラットフォームを以下から選択してください。

---

## システム要件

### 共通
- **OpenNumismat**がインストール済み（[opennumismat.github.io](https://opennumismat.github.io/)）
- **Numista APIキー**（[numista.com](https://www.numista.com/)で無料取得）
- **RAM：** 最低4 GB、8 GB推奨
- **ストレージ：** 200 MB以上＋キャッシュ用の空き領域

### Windows
- **OS：** Windows 10（64-bit）またはWindows 11
- **プロセッサー：** Intel Core i3または同等品

### macOS
- **OS：** macOS 10.13 High Sierra以降
- **アーキテクチャ：** Intel（x64）およびApple Silicon（M1/M2/M3 arm64）

### Linux
- **OS：** Ubuntu 20.04+、Debian 10+、Fedora 32+、または互換OS
- **アーキテクチャ：** x64
- **ディスプレイサーバー：** X11またはWayland

---

## Windowsへのインストール {#windows-installation}

### オプション1：Microsoft Store（近日公開）

NumiSync WizardはMicrosoft Storeに申請済みで、認定を待っています。承認後は、Storeから直接インストールでき、自動更新が利用でき、SmartScreen警告も表示されません。

### オプション2：直接ダウンロード

#### ステップ1：NumiSync Wizardをダウンロード

1. [リリースページ](https://github.com/inguy24/numismat-enrichment/releases/latest)にアクセス
2. 最新のインストーラーをダウンロード：
   - **64-bitシステム：** `NumiSync-Wizard-Setup-1.0.0-x64.exe`
   - **32-bitシステム：** `NumiSync-Wizard-Setup-1.0.0-ia32.exe`

**どちらを選べばよいかわからない場合？** 最近のWindowsシステムはほとんど64-bitです。確認するには：
- **PC**を右クリック → **プロパティ**
- 「システムの種類」を確認（例：「64ビット オペレーティング システム」）

#### ステップ2：インストーラーを実行

1. ダウンロードしたインストーラーを**ダブルクリック**
2. WindowsがSmartScreen警告を表示する場合があります（未署名インストーラー）
   - **「詳細情報」** → **「実行」**をクリック
3. 使用許諾契約（EULA）に同意
4. インストール先ディレクトリを選択（デフォルト：`C:\Program Files\NumiSync Wizard`）
5. **インストール**をクリック
6. インストールが完了するまで待つ
7. **完了**をクリックしてNumiSync Wizardを起動

#### ステップ3：初回起動

初回起動時、NumiSync Wizardは：
- `%LOCALAPPDATA%\numisync-wizard-cache`にキャッシュディレクトリを作成
- コレクションを開かない状態で起動します

---

## macOSへのインストール {#macos-installation}

**重要：** NumiSync WizardはApple Developerの証明書で**署名されていません**。macOSはデフォルトでブロックします。以下の手順に従ってインストールしてください：

### ステップ1：NumiSync Wizardをダウンロード

1. [リリースページ](https://github.com/inguy24/numismat-enrichment/releases/latest)にアクセス
2. 最新のDMGをダウンロード：
   - **ユニバーサルDMG：** `NumiSync-Wizard-1.0.0-universal.dmg`（IntelとApple Silicon両方で動作）
   - **Intel専用：** `NumiSync-Wizard-1.0.0-x64.dmg`
   - **Apple Silicon：** `NumiSync-Wizard-1.0.0-arm64.dmg`

**ほとんどのユーザーはユニバーサルDMGをダウンロードしてください。**

### ステップ2：アプリをインストール

1. DMGをダブルクリックして**開く**
2. **NumiSync Wizard**をApplicationsフォルダにドラッグ
3. DMGを**取り出す**（右クリック → 取り出す）

### ステップ3：Gatekeeperの回避（必須）

アプリが未署名のため、macOSがブロックします。最も簡単な**方法1**を使用してください：

#### 方法1：右クリックで開く（推奨）

1. Finderで**Applicationsフォルダ**に移動
2. NumiSync Wizardを**右クリック**（またはControlキーを押しながらクリック）
3. メニューから**「開く」**を選択
4. セキュリティダイアログで**「開く」**をクリック
5. アプリが起動 — **以降の起動は通常通り**（ダブルクリックするだけ）

#### 方法2：システム環境設定での上書き

1. 通常の方法でアプリを開こうとする（ブロックされます）
2. **システム環境設定** → **セキュリティとプライバシー** → **一般**に移動
3. ブロックされたアプリのメッセージの横の**「このまま開く」**をクリック
4. 確認ダイアログで**「開く」**をクリック

#### 方法3：Terminalでの上書き（上級者向け）

```bash
cd /Applications
xattr -d com.apple.quarantine "NumiSync Wizard.app"
```

**詳細なトラブルシューティングについては、[macOSインストールガイド](/macos-install)をご覧ください。**

### ステップ4：初回起動

初回起動時、NumiSync Wizardは：
- `~/Library/Application Support/numisync-wizard-cache`にキャッシュディレクトリを作成
- コレクションを開かない状態で起動します

---

## Linuxへのインストール {#linux-installation}

NumiSync WizardはLinux向けに3つの形式で提供されています。お使いのディストリビューションに合わせて選択してください：

### オプション1：AppImage（汎用 — 推奨）

**最適：** すべてのディストリビューション

1. [リリースページ](https://github.com/inguy24/numismat-enrichment/releases/latest)から`NumiSync-Wizard-1.0.0.AppImage`をダウンロード
2. 実行可能にする：
   ```bash
   chmod +x NumiSync-Wizard-1.0.0.AppImage
   ```
3. 実行する：
   ```bash
   ./NumiSync-Wizard-1.0.0.AppImage
   ```

**オプション：** [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher)でデスクトップ環境と統合

### オプション2：Debian/Ubuntu (.deb)

**最適：** Debian、Ubuntu、Linux Mint、Pop!_OS

```bash
# .debファイルをダウンロード
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0-amd64.deb

# インストール
sudo dpkg -i NumiSync-Wizard-1.0.0-amd64.deb

# 必要に応じて依存関係をインストール
sudo apt-get install -f
```

アプリケーションメニューから起動するか、以下を実行：
```bash
numisync-wizard
```

### オプション3：Fedora/RHEL (.rpm)

**最適：** Fedora、RHEL、CentOS、Rocky Linux

```bash
# .rpmファイルをダウンロード
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0.x86_64.rpm

# インストール
sudo rpm -i NumiSync-Wizard-1.0.0.x86_64.rpm

# またはdnfを使用（推奨）
sudo dnf install NumiSync-Wizard-1.0.0.x86_64.rpm
```

アプリケーションメニューから起動するか、以下を実行：
```bash
numisync-wizard
```

### 初回起動（Linux）

初回起動時、NumiSync Wizardは：
- `~/.config/numisync-wizard-cache`にキャッシュディレクトリを作成
- コレクションを開かない状態で起動します

---

## 初期設定

**注意：** これらの手順はすべてのプラットフォーム（Windows、macOS、Linux）で同一です。

### 1. Numista APIキーの追加

1. **Settings**（歯車アイコン）をクリックするか、`Ctrl+,`を押す
2. **API Settings**タブに移動
3. Numista APIキーを入力
4. **Save**をクリック

**APIキーの取得方法：**
1. [numista.com](https://www.numista.com/)にアクセスして無料アカウントを作成
2. ログイン → プロフィール → API Access
3. APIキーをリクエスト（個人利用は即時承認）
4. キーをコピーしてNumiSync Wizardに貼り付け

### 2. コレクションを開く

1. **File → Open Collection**をクリック（キーボードショートカットはプラットフォームによって異なります）
   - **Windows/Linux：** `Ctrl+O`
   - **macOS：** `Cmd+O`
2. OpenNumismatの`.db`ファイルに移動
3. ファイルを選択して**Open**をクリック
4. コインがメインウィンドウに読み込まれます

### 3. データ設定の構成（オプション）

1. **Settings → Data Settings**に移動
2. 同期するデータを選択：
   - **Basic** — タイプレベルのカタログデータ（発行枚数、素材、統治者、デザイナー）
   - **Issue** — バリエーション固有のデータ（年号、造幣局マーク、種別）
   - **Pricing** — 現在の市場価格（UNC、XF、VF、F）
3. 必要に応じてフィールドマッピングを設定（上級ユーザーのみ）

---

## インストールの確認

### 基本機能のテスト

1. コレクションからコインを数枚選択
2. **Search & Enrich**ボタンをクリック
3. NumiSyncがNumistaを検索してマッチを見つけるはずです
4. フィールド比較UIでマッチを確認
5. マッチを承認してデータ更新が機能することを確認

マッチが表示され、コインデータを更新できればインストール成功です！

---

## トラブルシューティング

### Windowsの問題

**インストーラーが起動しない：**
- SmartScreen警告：「詳細情報」→「実行」をクリック
- ウイルス対策がブロック：インストーラーの除外設定を追加
- ダウンロードが破損：再ダウンロードしてファイルサイズを確認

**アプリケーションが起動しない：**
- イベントビューアーを確認：Windowsログ → アプリケーション
- 依存関係の欠如：[Visual C++ 再頒布可能パッケージ](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)をインストール
- ウイルス対策の干渉：`NumiSync Wizard.exe`の除外設定を追加

### macOSの問題

**「NumiSync Wizardが壊れているため開けません」：**
- DMGを削除して再ダウンロード
- ファイルサイズがリリースページと一致することを確認
- 方法1（右クリック → 開く）を試す

**「セキュリティダイアログに「開く」オプションがない」：**
- 右クリックではなくダブルクリックで開こうとしています
- 上記のインストール手順から方法1または方法2を使用

**アプリがすぐにクラッシュする：**
- コンソールアプリでクラッシュログを確認
- macOSバージョンとクラッシュログを添えて問題を報告

**詳細なトラブルシューティングについては[macOSインストールガイド](/macos-install)をご覧ください。**

### Linuxの問題

**AppImageが起動しない：**
- 実行可能であることを確認：`chmod +x *.AppImage`
- FUSEをインストール：`sudo apt-get install fuse`（Ubuntu/Debian）
- ターミナルから実行してエラーメッセージを確認

**.debのインストールが失敗する：**
- 依存関係をインストール：`sudo apt-get install -f`
- システム要件を確認（Ubuntu 20.04+）

**.rpmのインストールが失敗する：**
- 依存関係をインストール：`sudo dnf install <パッケージ名>`
- システム要件を確認（Fedora 32+）

**ライブラリが不足している：**
```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils

# Fedora/RHEL
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils
```

### 共通の問題

**コレクションを開けない：**
- `.db`ファイルが存在し、破損していないことを確認
- 読み取り/書き込み権限があることを確認
- コレクションをOpenNumismatで開いている場合は閉じる
- File → Recent Collectionsを試す

**APIキーが機能しない：**
- 慎重にコピー＆ペースト（余分なスペースなし）
- レート制限を確認（120リクエスト/分）
- Numistaアカウントがアクティブであることを確認
- Numista APIドキュメントページでキーをテスト

**キャッシュディレクトリの問題：**
- **Windows：** `%LOCALAPPDATA%\numisync-wizard-cache`
- **macOS：** `~/Library/Application Support/numisync-wizard-cache`
- **Linux：** `~/.config/numisync-wizard-cache`
- 書き込み権限を確認
- 破損している場合はキャッシュをクリア

---

## アンインストール

### Windows

1. **設定 → アプリ → アプリと機能**に移動
2. 「NumiSync Wizard」を検索
3. **アンインストール**をクリック
4. アンインストーラーの指示に従う

**手動クリーンアップ（オプション）：**
- キャッシュを削除：`%LOCALAPPDATA%\numisync-wizard-cache`
- 設定を削除：`%APPDATA%\numisync-wizard`

### macOS

1. アプリケーションを終了
2. ApplicationsフォルダからNumiSync Wizard.appを削除
3. **オプションのクリーンアップ：**
   ```bash
   rm -rf ~/Library/Application\ Support/numisync-wizard-cache
   rm -rf ~/Library/Preferences/com.numisync.wizard.plist
   ```

### Linux

**AppImage：** `.AppImage`ファイルを削除するだけです

**Debian/Ubuntu (.deb)：**
```bash
sudo apt-get remove numisync-wizard
```

**Fedora/RHEL (.rpm)：**
```bash
sudo rpm -e numisync-wizard
# またはdnfで
sudo dnf remove numisync-wizard
```

**手動クリーンアップ（すべてのLinux）：**
```bash
rm -rf ~/.config/numisync-wizard-cache
rm -rf ~/.config/numisync-wizard
```

---

## 新しいバージョンへのアップグレード

NumiSync Wizardは起動時にアップデートを確認します（Settingsで有効にしている場合）。

### 自動アップデート（利用可能な場合）
1. **「Update Available」**通知をクリック
2. ダウンロードが自動的に開始されます
3. ダウンロード完了後にインストールが進みます
4. アプリケーションが新しいバージョンで再起動します

### 手動アップデート
1. [リリースページ](https://github.com/inguy24/numismat-enrichment/releases/latest)から最新のインストーラーをダウンロード
2. インストーラーを実行
3. 既存のインストールを自動的に検出してアップグレードします
4. 設定とキャッシュは保持されます

---

## 次のステップ

- **[クイックスタートガイド](/ja/quickstart)** — 5分で始める
- **[ユーザーマニュアル](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** — 包括的な機能ドキュメント
- **[Supporter Licenseを入手](#)** — Fast Pricing ModeとAuto-Propagateをアンロック

---

## サポートが必要な場合

- **問題の報告：** [GitHubで報告](https://github.com/inguy24/numismat-enrichment/issues)
- **ディスカッション：** [コミュニティに質問](https://github.com/inguy24/numismat-enrichment/discussions)
- **ドキュメント：** [完全なドキュメント](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

<div style="text-align: center; margin: 2em 0;">
  <a href="/ja/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">← ホームに戻る</a>
  <a href="/ja/quickstart" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 6px;">次へ：クイックスタート →</a>
</div>
