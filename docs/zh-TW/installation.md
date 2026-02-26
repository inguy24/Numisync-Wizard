---
layout: default
title: 安裝指南
lang: zh-TW
page_id: installation
---

# 安裝指南

NumiSync Wizard 支援 **Windows**、**macOS** 及 **Linux**。請在下方選擇您的平台查看安裝說明。

---

## 系統需求

### 所有平台
- 已安裝 **OpenNumismat**（[opennumismat.github.io](https://opennumismat.github.io/)）
- **Numista API 金鑰**（從 [numista.com](https://www.numista.com/) 免費取得）
- **記憶體：** 最低 4 GB，建議 8 GB
- **儲存空間：** 200 MB + 快取空間

### Windows
- **作業系統：** Windows 10（64 位元）或 Windows 11
- **處理器：** Intel Core i3 或同等規格

### macOS
- **作業系統：** macOS 10.13 High Sierra 或更新版本
- **架構：** Intel（x64）及 Apple Silicon（M1/M2/M3 arm64）

### Linux
- **作業系統：** Ubuntu 20.04+、Debian 10+、Fedora 32+ 或相容系統
- **架構：** x64
- **顯示伺服器：** X11 或 Wayland

---

## Windows 安裝 {#windows-installation}

### 方式一：Microsoft Store（即將推出）

NumiSync Wizard 已提交至 Microsoft Store，正在等待認證。審核通過後，您將可以直接從 Store 安裝，享有自動更新，且不會出現 SmartScreen 警告。

### 方式二：直接下載

#### 第一步：下載 NumiSync Wizard

1. 造訪 [Releases 頁面](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. 下載最新安裝程式：
   - **64 位元系統：** `NumiSync-Wizard-Setup-1.0.0-x64.exe`
   - **32 位元系統：** `NumiSync-Wizard-Setup-1.0.0-ia32.exe`

**不確定要選哪個版本？** 大多數現代 Windows 系統都是 64 位元。檢查方式：
- 右鍵點擊 **本機** → **內容**
- 查找「系統類型」（例如「64 位元作業系統」）

#### 第二步：執行安裝程式

1. **雙擊**下載的安裝程式
2. Windows 可能會顯示 SmartScreen 警告（未簽署安裝程式）
   - 點擊 **「更多資訊」** → **「仍要執行」**
3. 接受一般使用者授權合約（EULA）
4. 選擇安裝目錄（預設：`C:\Program Files\NumiSync Wizard`）
5. 點擊 **安裝**
6. 等待安裝完成
7. 點擊 **完成** 啟動 NumiSync Wizard

#### 第三步：首次啟動

首次啟動時，NumiSync Wizard 將：
- 在 `%LOCALAPPDATA%\numisync-wizard-cache` 建立快取目錄
- 以無收藏狀態啟動

---

## macOS 安裝 {#macos-installation}

**⚠️ 重要提示：** NumiSync Wizard **未使用** Apple 開發者憑證簽署。macOS 預設會封鎖執行。請按以下步驟安裝：

### 第一步：下載 NumiSync Wizard

1. 造訪 [Releases 頁面](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. 下載最新 DMG：
   - **通用 DMG：** `NumiSync-Wizard-1.0.0-universal.dmg`（適用於 Intel 及 Apple Silicon）
   - **Intel 專用：** `NumiSync-Wizard-1.0.0-x64.dmg`
   - **Apple Silicon：** `NumiSync-Wizard-1.0.0-arm64.dmg`

**大多數使用者應下載通用 DMG。**

### 第二步：安裝應用程式

1. **雙擊** DMG 檔案開啟
2. **將 NumiSync Wizard 拖曳至**應用程式資料夾
3. **退出 DMG**（右鍵點擊 → 退出）

### 第三步：繞過 Gatekeeper（必要步驟）

由於應用程式未簽署，macOS 會封鎖執行。建議使用**方法一**（最簡單）：

#### 方法一：右鍵點擊開啟（建議）

1. 在 Finder 中**進入應用程式**資料夾
2. **右鍵點擊**（或按住 Control 鍵點擊）NumiSync Wizard
3. 從選單中選擇 **「打開」**
4. 在安全性對話框中點擊 **「打開」**
5. 應用程式將啟動——**之後每次啟動正常操作即可**（雙擊即可）

#### 方法二：系統偏好設定覆蓋

1. 嘗試正常開啟應用程式（將被封鎖）
2. 前往**系統偏好設定** → **安全性與隱私權** → **一般**
3. 點擊被封鎖應用程式訊息旁邊的 **「仍要開啟」**
4. 在確認對話框中點擊 **「打開」**

#### 方法三：終端機指令覆蓋（進階）

```bash
cd /Applications
xattr -d com.apple.quarantine "NumiSync Wizard.app"
```

**詳細疑難排解請參閱 [macOS 安裝指南](/macos-install)。**

### 第四步：首次啟動

首次啟動時，NumiSync Wizard 將：
- 在 `~/Library/Application Support/numisync-wizard-cache` 建立快取目錄
- 以無收藏狀態啟動

---

## Linux 安裝 {#linux-installation}

NumiSync Wizard 為 Linux 提供三種格式。請根據您的發行版選擇：

### 方式一：AppImage（通用版 - 建議）

**適用於：** 所有發行版

1. 從 [Releases](https://github.com/inguy24/numismat-enrichment/releases/latest) 下載 `NumiSync-Wizard-1.0.0.AppImage`
2. 賦予執行權限：
   ```bash
   chmod +x NumiSync-Wizard-1.0.0.AppImage
   ```
3. 執行：
   ```bash
   ./NumiSync-Wizard-1.0.0.AppImage
   ```

**選用：** 使用 [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher) 與桌面環境整合

### 方式二：Debian/Ubuntu（.deb）

**適用於：** Debian、Ubuntu、Linux Mint、Pop!_OS

```bash
# 下載 .deb 檔案
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0-amd64.deb

# 安裝
sudo dpkg -i NumiSync-Wizard-1.0.0-amd64.deb

# 若有需要，安裝相依套件
sudo apt-get install -f
```

從應用程式選單啟動，或執行：
```bash
numisync-wizard
```

### 方式三：Fedora/RHEL（.rpm）

**適用於：** Fedora、RHEL、CentOS、Rocky Linux

```bash
# 下載 .rpm 檔案
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0.x86_64.rpm

# 安裝
sudo rpm -i NumiSync-Wizard-1.0.0.x86_64.rpm

# 或使用 dnf（建議）
sudo dnf install NumiSync-Wizard-1.0.0.x86_64.rpm
```

從應用程式選單啟動，或執行：
```bash
numisync-wizard
```

### 首次啟動（Linux）

首次啟動時，NumiSync Wizard 將：
- 在 `~/.config/numisync-wizard-cache` 建立快取目錄
- 以無收藏狀態啟動

---

## 初始設定

**注意：** 以下步驟適用於所有平台（Windows、macOS、Linux）

### 1. 新增 Numista API 金鑰

1. 點擊 **Settings**（齒輪圖示）或按 `Ctrl+,`
2. 導覽至 **API Settings** 索引標籤
3. 輸入您的 Numista API 金鑰
4. 點擊 **Save**

**如何取得 API 金鑰：**
1. 前往 [numista.com](https://www.numista.com/) 建立免費帳號
2. 登入 → 個人資料 → API 存取
3. 申請 API 金鑰（個人用途即時核准）
4. 複製金鑰並貼上至 NumiSync Wizard

### 2. 開啟收藏

1. 點擊 **File → Open Collection**（快捷鍵因平台而異）
   - **Windows/Linux：** `Ctrl+O`
   - **macOS：** `Cmd+O`
2. 導覽至您的 OpenNumismat `.db` 檔案
3. 選取檔案並點擊 **Open**
4. 您的錢幣將載入主視窗

### 3. 設定資料設定（選用）

1. 前往 **Settings → Data Settings**
2. 選擇要同步的資料：
   - **Basic** - 類型級目錄資料（鑄造量、成分、統治者、設計師）
   - **Issue** - 版別專屬資料（年份、鑄幣標記、類型變體）
   - **Pricing** - 當前市場價格（UNC、XF、VF、F 品相）
3. 若有需要，設定欄位對應（僅限進階使用者）

---

## 驗證安裝

### 測試基本功能

1. 在收藏中選取幾枚錢幣
2. 點擊 **Search & Enrich** 按鈕
3. NumiSync 應搜尋 Numista 並找到比對項目
4. 在欄位比較介面查看比對結果
5. 接受一個比對以驗證資料更新正常

如果您能看到比對結果並成功更新錢幣資料，則安裝成功！

---

## 疑難排解

### Windows 問題

**安裝程式無法執行：**
- SmartScreen 警告：點擊「更多資訊」→「仍要執行」
- 防毒軟體封鎖：為安裝程式新增例外
- 下載損毀：重新下載並驗證檔案大小

**應用程式無法啟動：**
- 查看事件檢視器：Windows 記錄 → 應用程式
- 缺少相依項目：安裝 [Visual C++ 可轉散發套件](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)
- 防毒軟體干擾：為 `NumiSync Wizard.exe` 新增例外

### macOS 問題

**「NumiSync Wizard 已損毀，無法開啟」：**
- 刪除 DMG 並重新下載
- 驗證檔案大小與發布頁面一致
- 嘗試方法一（右鍵點擊 → 打開）

**「安全性對話框中沒有『打開』選項」：**
- 您是雙擊而非右鍵點擊
- 使用上述安裝步驟中的方法一或方法二

**應用程式立即當機：**
- 查看主控台應用程式中的當機記錄
- 附上 macOS 版本和當機記錄後在 GitHub 提交問題

**詳細疑難排解請參閱 [macOS 安裝指南](/macos-install)。**

### Linux 問題

**AppImage 無法執行：**
- 確保已賦予執行權限：`chmod +x *.AppImage`
- 安裝 FUSE：`sudo apt-get install fuse`（Ubuntu/Debian）
- 嘗試從終端機執行以查看錯誤訊息

**.deb 安裝失敗：**
- 安裝相依套件：`sudo apt-get install -f`
- 檢查系統需求（Ubuntu 20.04+）

**.rpm 安裝失敗：**
- 安裝相依套件：`sudo dnf install <套件名稱>`
- 檢查系統需求（Fedora 32+）

**缺少函式庫：**
```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils

# Fedora/RHEL
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils
```

### 所有平台

**無法開啟收藏：**
- 驗證 `.db` 檔案存在且未損毀
- 確保您有讀寫權限
- 如果 OpenNumismat 已開啟該收藏，請先關閉它
- 嘗試 File → Recent Collections

**API 金鑰無效：**
- 仔細複製貼上（無多餘空格）
- 檢查速率限制（每分鐘 120 次請求）
- 確認 Numista 帳號處於活躍狀態
- 在 Numista API 文件頁面測試金鑰

**快取目錄問題：**
- **Windows：** `%LOCALAPPDATA%\numisync-wizard-cache`
- **macOS：** `~/Library/Application Support/numisync-wizard-cache`
- **Linux：** `~/.config/numisync-wizard-cache`
- 檢查寫入權限
- 若快取損毀，清除快取

---

## 解除安裝

### Windows

1. 前往 **設定 → 應用程式 → 應用程式與功能**
2. 搜尋「NumiSync Wizard」
3. 點擊 **解除安裝**
4. 依解除安裝程式提示操作

**手動清理（選用）：**
- 刪除快取：`%LOCALAPPDATA%\numisync-wizard-cache`
- 刪除設定：`%APPDATA%\numisync-wizard`

### macOS

1. 結束應用程式
2. 從應用程式資料夾刪除 `NumiSync Wizard.app`
3. **選用清理：**
   ```bash
   rm -rf ~/Library/Application\ Support/numisync-wizard-cache
   rm -rf ~/Library/Preferences/com.numisync.wizard.plist
   ```

### Linux

**AppImage：** 直接刪除 `.AppImage` 檔案即可

**Debian/Ubuntu（.deb）：**
```bash
sudo apt-get remove numisync-wizard
```

**Fedora/RHEL（.rpm）：**
```bash
sudo rpm -e numisync-wizard
# 或使用 dnf
sudo dnf remove numisync-wizard
```

**手動清理（所有 Linux）：**
```bash
rm -rf ~/.config/numisync-wizard-cache
rm -rf ~/.config/numisync-wizard
```

---

## 升級至新版本

NumiSync Wizard 將在啟動時檢查更新（如在 Settings 中啟用）。

### 自動更新（可用時）
1. 點擊 **「有可用更新」** 通知
2. 下載將自動開始
3. 下載完成後將自動安裝
4. 應用程式將以新版本重新啟動

### 手動更新
1. 從 [Releases](https://github.com/inguy24/numismat-enrichment/releases/latest) 下載最新安裝程式
2. 執行安裝程式
3. 它將自動偵測並升級現有安裝
4. 您的設定和快取將被保留

---

## 後續步驟

- **[快速入門指南](/zh-TW/quickstart)** - 5 分鐘快速上手
- **[使用手冊](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - 完整功能文件
- **[取得支持者授權](#)** - 解鎖 Fast Pricing Mode 及 Auto-Propagate

---

## 需要協助？

- **問題回報：** [在 GitHub 上提交](https://github.com/inguy24/numismat-enrichment/issues)
- **討論交流：** [向社群提問](https://github.com/inguy24/numismat-enrichment/discussions)
- **文件說明：** [完整文件](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

<div style="text-align: center; margin: 2em 0;">
  <a href="/zh-TW/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">← 返回首頁</a>
  <a href="/zh-TW/quickstart" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 6px;">下一步：快速入門 →</a>
</div>
