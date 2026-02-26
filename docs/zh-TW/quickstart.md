---
layout: default
title: 快速入門指南
lang: zh-TW
page_id: quickstart
---

# 快速入門指南

5 分鐘快速上手 NumiSync Wizard。本指南將帶您了解豐富化錢幣收藏的基本工作流程。

**平台說明：** 本指南適用於 Windows、macOS 及 Linux。不同平台的快捷鍵均已標註。

---

## 前提條件

開始前，請確保您已準備好：

- **已安裝 NumiSync Wizard**（[安裝指南](/zh-TW/installation)）
- **OpenNumismat 收藏**（包含若干錢幣的 .db 檔案）
- **Numista API 金鑰**（從 [numista.com](https://www.numista.com/) 免費取得）

---

## 第一步：啟動並設定

### 開啟 NumiSync Wizard

1. 啟動 NumiSync Wizard：
   - **Windows：** 開始功能表或桌面捷徑
   - **macOS：** 應用程式資料夾或 Launchpad
   - **Linux：** 應用程式選單，或執行 `numisync-wizard`（透過 .deb/.rpm 安裝時）
2. 首次啟動將自動建立快取目錄

### 新增 API 金鑰

1. 點擊 **Settings**（齒輪圖示）或按：
   - **Windows/Linux：** `Ctrl+,`
   - **macOS：** `Cmd+,`
2. 前往 **API Settings** 索引標籤
3. 貼上您的 Numista API 金鑰
4. 點擊 **Save**

**還沒有 API 金鑰？** 前往 [numista.com](https://www.numista.com/) → 個人資料 → API 存取，免費取得

---

## 第二步：開啟收藏

1. 點擊 **File → Open Collection** 或按：
   - **Windows/Linux：** `Ctrl+O`
   - **macOS：** `Cmd+O`
2. 導覽至您的 OpenNumismat `.db` 檔案
3. 點擊 **Open**
4. 您的錢幣將載入主視窗

**提示：** NumiSync 會記住最近的收藏。使用 **File → Recent Collections** 快速存取。

---

## 第三步：搜尋比對項目

### 選取要豐富化的錢幣

您可以逐枚或批次豐富化錢幣：

- **單枚錢幣：** 點擊一列錢幣以選取
- **多枚錢幣：** 按住修改鍵並點擊多列
  - **Windows/Linux：** `Ctrl+點擊`
  - **macOS：** `Cmd+點擊`
- **連續範圍：** 點擊第一枚，按住 `Shift`，點擊最後一枚
- **所有錢幣：** 全選
  - **Windows/Linux：** `Ctrl+A`
  - **macOS：** `Cmd+A`

### 開始搜尋

1. 點擊 **Search & Enrich** 按鈕（或按 `F2`）
2. NumiSync 將在 Numista 上搜尋每枚選取的錢幣
3. 進度指示器顯示目前狀態

**搜尋過程：**
- 使用面額、國家、年份、鑄幣標記進行搜尋
- 處理各種變體（例如「Cent」與「Cents」，「USA」與「United States」）
- 支援非西曆（明治紀年、伊斯蘭曆紀年等）
- 有快取結果時優先使用快取（更快！）

---

## 第四步：查看比對結果

### 了解比對狀態

搜尋完成後，每枚錢幣顯示以下三種狀態之一：

- **Match Found** - 找到 Numista 目錄條目
- **Multiple Matches** - 有多個候選項目（需手動選擇）
- **No Match** - 未找到目錄條目（嘗試手動搜尋）

### 查看欄位比較

1. 點擊有比對結果的錢幣
2. **Field Comparison Panel** 顯示：
   - **左欄：** 您的現有資料
   - **右欄：** Numista 目錄資料
   - **差異**以顏色醒目提示
3. 查看將要變更的內容

---

## 第五步：接受或調整比對

### 接受所有變更

如果比對結果令您滿意：
1. 點擊 **Accept Match** 按鈕（或按 `Enter`）
2. 所有 Numista 資料立即更新至您的錢幣
3. 錢幣標記為已豐富化

### 選擇性更新欄位

如果只想更新特定欄位：
1. 在 Field Comparison Panel 中**取消勾選**不想更新的欄位
2. 點擊 **Accept Match**
3. 只有勾選的欄位會被更新

### 選擇不同版別

許多錢幣有多個版別（年份、鑄幣標記、類型）：

1. 點擊 **Choose Issue** 按鈕
2. **Issue Picker Dialog** 顯示所有變體
3. 為您的錢幣選擇正確的版別
4. 欄位比較隨即更新為該版別資料
5. 點擊 **Accept Match**

### 手動搜尋

如果未自動找到比對項目：
1. 點擊 **Manual Search** 按鈕，或按：
   - **Windows/Linux：** `Ctrl+F`
   - **macOS：** `Cmd+F`
2. 修改搜尋參數（面額、年份、國家）
3. 點擊 **Search**
4. 瀏覽結果並選擇正確條目
5. 點擊 **Accept Match**

---

## 第六步：下載圖片（選用）

### 自動下載圖片

如果啟用了 **Data Settings → Images**：
- 接受比對時自動下載圖片
- 包括正面、反面和邊緣圖片（如有）
- 儲存在 OpenNumismat 的圖片目錄中

### 手動下載圖片

1. 選取已豐富化的錢幣
2. 點擊 **Download Images** 按鈕
3. 選擇要下載的圖片（正面、反面、邊緣）
4. 點擊 **Download**

**提示：** 使用 **Image Comparison** 在接受前預覽

---

## 常見工作流程

### 工作流程一：豐富化新收藏

1. 開啟包含大量未豐富化錢幣的收藏
2. 全選錢幣（`Ctrl+A`）
3. 點擊 **Search & Enrich**（或按 `F2`）
4. 逐一查看比對結果
5. 逐步接受比對
6. 對無比對的錢幣使用手動搜尋

**節省時間：** 每枚錢幣從 2-3 分鐘 → 10-15 秒

### 工作流程二：僅更新價格

1. 前往 **Settings → Data Settings**
2. 取消勾選 **Basic** 和 **Issue**（保留 **Pricing** 勾選）
3. 選取要更新的錢幣
4. 點擊 **Search & Enrich**
5. 接受比對（只更新價格）

**專業提示：** 取得[支持者授權](#)以使用 **Fast Pricing Mode** - 瞬間更新所有已比對錢幣的價格！

### 工作流程三：修正錯誤比對

1. 選取資料有誤的錢幣
2. 點擊 **Manual Search**
3. 找到正確的目錄條目
4. 接受比對
5. 舊資料被覆蓋

**提示：** 接受前使用 **Field Comparison** 核實

---

## 最佳使用技巧

### 搜尋技巧

**最佳實踐：**
- 從資訊完整的錢幣開始（年份、國家、面額）
- 使用標準面額縮寫（「1 Cent」而非「1c」）
- 讓 NumiSync 自動規範化面額

**避免：**
- 搜尋缺少關鍵欄位的錢幣（國家、面額）
- 除非必要，不要手動修改搜尋查詢
- 不要假設第一個比對就是正確的——務必核實！

### 資料品質

**最佳實踐：**
- 接受前查看 Field Comparison
- 有多個版別時使用 Issue Picker
- 驗證圖片與您的實體錢幣一致

**避免：**
- 不加核實地接受所有比對
- 用不完整的目錄資料覆蓋良好資料
- 忘記先備份您的收藏！

### 效能最佳化

**最佳實踐：**
- 啟用快取（Settings → General → Cache）
- 每批次處理 10-20 枚錢幣
- 大量更新時使用 Fast Pricing Mode（支持者授權）

**避免：**
- 一次搜尋 1000+ 枚錢幣（遵守速率限制，但很慢）
- 停用快取（浪費 API 呼叫次數）
- 重複搜尋同一枚錢幣（使用快取）

---

## 鍵盤快捷鍵

**Windows/Linux：**
- `Ctrl+O` - 開啟收藏
- `F2` - 搜尋並豐富化選取的錢幣
- `Ctrl+F` - 手動搜尋
- `Enter` - 接受比對
- `Escape` - 取消/關閉對話框
- `Ctrl+A` - 全選錢幣
- `Ctrl+,` - 開啟設定
- `F1` - 開啟說明

**macOS：**
- `Cmd+O` - 開啟收藏
- `F2` - 搜尋並豐富化選取的錢幣
- `Cmd+F` - 手動搜尋
- `Enter` - 接受比對
- `Escape` - 取消/關閉對話框
- `Cmd+A` - 全選錢幣
- `Cmd+,` - 開啟設定
- `F1` - 開啟說明

---

## 下一步

### 探索進階功能

取得 **[支持者授權（$10）](#)** 以解鎖：
- **Fast Pricing Mode** - 批次更新所有已比對錢幣的價格
- **Auto-Propagate** - 自動將類型資料套用至符合的錢幣
- **不再有提示彈出視窗！**

### 進階功能

- **Field Mapping** - 自訂 Numista 資料如何對應至您的欄位
- **批次操作** - 高效處理數百枚錢幣
- **多機支援** - 在裝置間共享快取
- **自訂快取位置** - 將快取儲存在網路磁碟上

### 了解更多

- **[使用手冊](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - 完整功能文件
- **[常見問題](#)** - 常見問題解答
- **[影片教學](#)** - 即將推出！

---

## 需要協助？

### 常見問題

**Q：為什麼我的錢幣沒有比對到結果？**
- A：國家或面額可能需要規範化。嘗試用不同形式手動搜尋。

**Q：為什麼某些欄位沒有更新？**
- A：檢查 **Data Settings** ——某些資料類別可能被停用了。

**Q：我可以復原已接受的比對嗎？**
- A：無法自動復原。請從備份還原或手動還原資料。

**Q：如何只更新價格而不變更其他欄位？**
- A：Settings → Data Settings → 取消勾選 Basic 和 Issue，保留 Pricing 勾選。

**Q：如果我搜尋同一枚錢幣兩次會怎樣？**
- A：NumiSync 使用快取結果（即時回傳），除非您點擊「從 API 重新整理」。

### 取得支援

- **問題回報：** [在 GitHub 上提交](https://github.com/inguy24/numismat-enrichment/issues)
- **討論交流：** [向社群提問](https://github.com/inguy24/numismat-enrichment/discussions)
- **文件說明：** [完整文件](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

---

<div style="text-align: center; margin: 2em 0;">
  <a href="/zh-TW/installation" style="display: inline-block; padding: 10px 20px; background: #6c757d; color: white; text-decoration: none; border-radius: 6px;">← 安裝指南</a>
  <a href="/zh-TW/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">返回首頁</a>
</div>
