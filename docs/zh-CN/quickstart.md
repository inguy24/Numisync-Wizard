---
layout: default
title: 快速入门指南
lang: zh-CN
page_id: quickstart
---

# 快速入门指南

5 分钟快速上手 NumiSync Wizard。本指南将带您了解丰富钱币收藏的基本工作流程。

**平台说明：** 本指南适用于 Windows、macOS 和 Linux。不同平台的快捷键均已标注。

---

## 前提条件

开始前，请确保您已准备好：

- **已安装 NumiSync Wizard**（[安装指南](/zh-CN/installation)）
- **OpenNumismat 收藏**（包含若干钱币的 .db 文件）
- **Numista API 密钥**（从 [numista.com](https://www.numista.com/) 免费获取）

---

## 第一步：启动并配置

### 打开 NumiSync Wizard

1. 启动 NumiSync Wizard：
   - **Windows：** 开始菜单或桌面快捷方式
   - **macOS：** 应用程序文件夹或 Launchpad
   - **Linux：** 应用程序菜单，或运行 `numisync-wizard`（通过 .deb/.rpm 安装时）
2. 首次启动将自动创建缓存目录

### 添加 API 密钥

1. 点击 **Settings**（齿轮图标）或按：
   - **Windows/Linux：** `Ctrl+,`
   - **macOS：** `Cmd+,`
2. 前往 **API Settings** 选项卡
3. 粘贴您的 Numista API 密钥
4. 点击 **Save**

**还没有 API 密钥？** 前往 [numista.com](https://www.numista.com/) → 个人资料 → API 访问，免费获取

---

## 第二步：打开收藏

1. 点击 **File → Open Collection** 或按：
   - **Windows/Linux：** `Ctrl+O`
   - **macOS：** `Cmd+O`
2. 导航至您的 OpenNumismat `.db` 文件
3. 点击 **Open**
4. 您的钱币将载入主窗口

**提示：** NumiSync 会记住最近的收藏。使用 **File → Recent Collections** 快速访问。

---

## 第三步：搜索匹配项

### 选择要丰富的钱币

您可以逐枚或批量丰富钱币：

- **单枚钱币：** 点击一行钱币以选中
- **多枚钱币：** 按住修改键并点击多行
  - **Windows/Linux：** `Ctrl+单击`
  - **macOS：** `Cmd+单击`
- **连续范围：** 点击第一枚，按住 `Shift`，点击最后一枚
- **所有钱币：** 全选
  - **Windows/Linux：** `Ctrl+A`
  - **macOS：** `Cmd+A`

### 开始搜索

1. 点击 **Search & Enrich** 按钮（或按 `F2`）
2. NumiSync 将在 Numista 上搜索每枚选中的钱币
3. 进度指示器显示当前状态

**搜索过程：**
- 使用面值、国家、年份、铸币标记进行搜索
- 处理各种变体（例如"Cent"与"Cents"，"USA"与"United States"）
- 支持非公历（明治纪年、伊斯兰历纪年等）
- 有缓存结果时优先使用缓存（更快！）

---

## 第四步：查看匹配结果

### 理解匹配状态

搜索完成后，每枚钱币显示以下三种状态之一：

- **Match Found** - 找到 Numista 目录条目
- **Multiple Matches** - 有多个候选（需手动选择）
- **No Match** - 未找到目录条目（尝试手动搜索）

### 查看字段对比

1. 点击有匹配结果的钱币
2. **Field Comparison Panel** 显示：
   - **左列：** 您的现有数据
   - **右列：** Numista 目录数据
   - **差异**以颜色高亮显示
3. 查看将要变更的内容

---

## 第五步：接受或优化匹配

### 接受所有变更

如果匹配结果令您满意：
1. 点击 **Accept Match** 按钮（或按 `Enter`）
2. 所有 Numista 数据立即更新到您的钱币
3. 钱币标记为已丰富

### 选择性更新字段

如果只想更新特定字段：
1. 在 Field Comparison Panel 中**取消勾选**不想更新的字段
2. 点击 **Accept Match**
3. 只有勾选的字段会被更新

### 选择不同版别

许多钱币有多个版别（年份、铸币标记、类型）：

1. 点击 **Choose Issue** 按钮
2. **Issue Picker Dialog** 显示所有变体
3. 为您的钱币选择正确的版别
4. 字段对比随即更新为该版别数据
5. 点击 **Accept Match**

### 手动搜索

如果未自动找到匹配项：
1. 点击 **Manual Search** 按钮，或按：
   - **Windows/Linux：** `Ctrl+F`
   - **macOS：** `Cmd+F`
2. 修改搜索参数（面值、年份、国家）
3. 点击 **Search**
4. 浏览结果并选择正确条目
5. 点击 **Accept Match**

---

## 第六步：下载图片（可选）

### 自动下载图片

如果启用了 **Data Settings → Images**：
- 接受匹配时自动下载图片
- 包括正面、反面和边缘图片（如有）
- 存储在 OpenNumismat 的图片目录中

### 手动下载图片

1. 选择已丰富的钱币
2. 点击 **Download Images** 按钮
3. 选择要下载的图片（正面、反面、边缘）
4. 点击 **Download**

**提示：** 使用 **Image Comparison** 在接受前预览

---

## 常见工作流程

### 工作流程一：丰富新收藏

1. 打开包含大量未丰富钱币的收藏
2. 全选钱币（`Ctrl+A`）
3. 点击 **Search & Enrich**（或按 `F2`）
4. 逐一查看匹配结果
5. 逐步接受匹配
6. 对无匹配的钱币使用手动搜索

**节省时间：** 每枚钱币从 2-3 分钟 → 10-15 秒

### 工作流程二：仅更新价格

1. 前往 **Settings → Data Settings**
2. 取消勾选 **Basic** 和 **Issue**（保留 **Pricing** 勾选）
3. 选择要更新的钱币
4. 点击 **Search & Enrich**
5. 接受匹配（只更新价格）

**专业提示：** 获取[支持者许可证](#)以使用 **Fast Pricing Mode** - 瞬间更新所有已匹配钱币的价格！

### 工作流程三：修正错误匹配

1. 选择数据有误的钱币
2. 点击 **Manual Search**
3. 找到正确的目录条目
4. 接受匹配
5. 旧数据被覆盖

**提示：** 接受前使用 **Field Comparison** 核实

---

## 最佳使用技巧

### 搜索技巧

**最佳实践：**
- 从信息完整的钱币开始（年份、国家、面值）
- 使用标准面值缩写（"1 Cent"而非"1c"）
- 让 NumiSync 自动规范化面值

**避免：**
- 搜索缺少关键字段的钱币（国家、面值）
- 除非必要，不要手动修改搜索查询
- 不要假设第一个匹配就是正确的——务必核实！

### 数据质量

**最佳实践：**
- 接受前查看 Field Comparison
- 有多个版别时使用 Issue Picker
- 验证图片与您的实体钱币一致

**避免：**
- 不加核实地接受所有匹配
- 用不完整的目录数据覆盖良好数据
- 忘记先备份您的收藏！

### 性能优化

**最佳实践：**
- 启用缓存（Settings → General → Cache）
- 每批处理 10-20 枚钱币
- 大量更新时使用 Fast Pricing Mode（支持者许可证）

**避免：**
- 一次搜索 1000+ 枚钱币（遵守速率限制，但很慢）
- 禁用缓存（浪费 API 调用次数）
- 重复搜索同一枚钱币（使用缓存）

---

## 键盘快捷键

**Windows/Linux：**
- `Ctrl+O` - 打开收藏
- `F2` - 搜索并丰富选中的钱币
- `Ctrl+F` - 手动搜索
- `Enter` - 接受匹配
- `Escape` - 取消/关闭对话框
- `Ctrl+A` - 全选钱币
- `Ctrl+,` - 打开设置
- `F1` - 打开帮助

**macOS：**
- `Cmd+O` - 打开收藏
- `F2` - 搜索并丰富选中的钱币
- `Cmd+F` - 手动搜索
- `Enter` - 接受匹配
- `Escape` - 取消/关闭对话框
- `Cmd+A` - 全选钱币
- `Cmd+,` - 打开设置
- `F1` - 打开帮助

---

## 下一步

### 探索高级功能

获取 **[支持者许可证（$10）](#)** 以解锁：
- **Fast Pricing Mode** - 批量更新所有已匹配钱币的价格
- **Auto-Propagate** - 自动将类型数据应用于匹配的钱币
- **不再有提示弹窗！**

### 高级功能

- **Field Mapping** - 自定义 Numista 数据如何映射到您的字段
- **批量操作** - 高效处理数百枚钱币
- **多机支持** - 在设备间共享缓存
- **自定义缓存位置** - 将缓存存储在网络驱动器上

### 了解更多

- **[用户手册](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - 完整功能文档
- **[常见问题](#)** - 常见问题解答
- **[视频教程](#)** - 即将推出！

---

## 需要帮助？

### 常见问题

**Q：为什么我的钱币没有匹配到结果？**
- A：国家或面值可能需要规范化。尝试用不同形式手动搜索。

**Q：为什么某些字段没有更新？**
- A：检查 **Data Settings** ——某些数据类别可能被禁用了。

**Q：我可以撤销已接受的匹配吗？**
- A：无法自动撤销。请从备份恢复或手动还原数据。

**Q：如何只更新价格而不改变其他字段？**
- A：Settings → Data Settings → 取消勾选 Basic 和 Issue，保留 Pricing 勾选。

**Q：如果我搜索同一枚钱币两次会怎样？**
- A：NumiSync 使用缓存结果（即时返回），除非您点击"从 API 刷新"。

### 获取支持

- **问题反馈：** [在 GitHub 上提交](https://github.com/inguy24/numismat-enrichment/issues)
- **讨论交流：** [向社区提问](https://github.com/inguy24/numismat-enrichment/discussions)
- **文档：** [完整文档](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

---

<div style="text-align: center; margin: 2em 0;">
  <a href="/zh-CN/installation" style="display: inline-block; padding: 10px 20px; background: #6c757d; color: white; text-decoration: none; border-radius: 6px;">← 安装指南</a>
  <a href="/zh-CN/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">返回首页</a>
</div>
