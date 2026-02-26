---
layout: default
title: 安装指南
lang: zh-CN
page_id: installation
---

# 安装指南

NumiSync Wizard 支持 **Windows**、**macOS** 和 **Linux**。请在下方选择您的平台查看安装说明。

---

## 系统要求

### 所有平台
- 已安装 **OpenNumismat**（[opennumismat.github.io](https://opennumismat.github.io/)）
- **Numista API 密钥**（从 [numista.com](https://www.numista.com/) 免费获取）
- **内存：** 最低 4 GB，推荐 8 GB
- **存储：** 200 MB + 缓存空间

### Windows
- **操作系统：** Windows 10（64 位）或 Windows 11
- **处理器：** Intel Core i3 或同等配置

### macOS
- **操作系统：** macOS 10.13 High Sierra 或更高版本
- **架构：** Intel（x64）和 Apple Silicon（M1/M2/M3 arm64）

### Linux
- **操作系统：** Ubuntu 20.04+、Debian 10+、Fedora 32+ 或兼容系统
- **架构：** x64
- **显示服务器：** X11 或 Wayland

---

## Windows 安装 {#windows-installation}

### 方式一：Microsoft Store（即将推出）

NumiSync Wizard 已提交至 Microsoft Store，正在等待认证。审核通过后，您将可以直接从 Store 安装，享受自动更新，且不会出现 SmartScreen 警告。

### 方式二：直接下载

#### 第一步：下载 NumiSync Wizard

1. 访问 [Releases 页面](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. 下载最新安装程序：
   - **64 位系统：** `NumiSync-Wizard-Setup-1.0.0-x64.exe`
   - **32 位系统：** `NumiSync-Wizard-Setup-1.0.0-ia32.exe`

**不确定选哪个版本？** 大多数现代 Windows 系统都是 64 位。检查方法：
- 右键单击 **此电脑** → **属性**
- 查找"系统类型"（例如"64 位操作系统"）

#### 第二步：运行安装程序

1. **双击**下载的安装程序
2. Windows 可能会显示 SmartScreen 警告（未签名安装程序）
   - 点击 **"更多信息"** → **"仍要运行"**
3. 接受最终用户许可协议（EULA）
4. 选择安装目录（默认：`C:\Program Files\NumiSync Wizard`）
5. 点击 **安装**
6. 等待安装完成
7. 点击 **完成** 启动 NumiSync Wizard

#### 第三步：首次启动

首次启动时，NumiSync Wizard 将：
- 在 `%LOCALAPPDATA%\numisync-wizard-cache` 创建缓存目录
- 以无收藏状态启动

---

## macOS 安装 {#macos-installation}

**⚠️ 重要提示：** NumiSync Wizard **未使用** Apple 开发者证书签名。macOS 默认会阻止运行。请按以下步骤安装：

### 第一步：下载 NumiSync Wizard

1. 访问 [Releases 页面](https://github.com/inguy24/numismat-enrichment/releases/latest)
2. 下载最新 DMG：
   - **通用 DMG：** `NumiSync-Wizard-1.0.0-universal.dmg`（适用于 Intel 和 Apple Silicon）
   - **Intel 专用：** `NumiSync-Wizard-1.0.0-x64.dmg`
   - **Apple Silicon：** `NumiSync-Wizard-1.0.0-arm64.dmg`

**大多数用户应下载通用 DMG。**

### 第二步：安装应用

1. **双击** DMG 文件打开
2. **将 NumiSync Wizard 拖入**应用程序文件夹
3. **推出 DMG**（右键单击 → 推出）

### 第三步：绕过 Gatekeeper（必要步骤）

由于应用未签名，macOS 会阻止运行。推荐使用**方法一**（最简单）：

#### 方法一：右键单击打开（推荐）

1. 在 Finder 中**进入应用程序**文件夹
2. **右键单击**（或按住 Control 键单击）NumiSync Wizard
3. 从菜单中选择 **"打开"**
4. 在安全对话框中点击 **"打开"**
5. 应用将启动——**之后每次启动正常操作即可**（双击即可）

#### 方法二：系统偏好设置覆盖

1. 尝试正常打开应用（将被阻止）
2. 前往**系统偏好设置** → **安全性与隐私** → **通用**
3. 点击被阻止应用信息旁边的 **"仍要打开"**
4. 在确认对话框中点击 **"打开"**

#### 方法三：终端命令覆盖（高级）

```bash
cd /Applications
xattr -d com.apple.quarantine "NumiSync Wizard.app"
```

**详细故障排查请参阅 [macOS 安装指南](/macos-install)。**

### 第四步：首次启动

首次启动时，NumiSync Wizard 将：
- 在 `~/Library/Application Support/numisync-wizard-cache` 创建缓存目录
- 以无收藏状态启动

---

## Linux 安装 {#linux-installation}

NumiSync Wizard 为 Linux 提供三种格式。请根据您的发行版选择：

### 方式一：AppImage（通用版 - 推荐）

**适用于：** 所有发行版

1. 从 [Releases](https://github.com/inguy24/numismat-enrichment/releases/latest) 下载 `NumiSync-Wizard-1.0.0.AppImage`
2. 赋予执行权限：
   ```bash
   chmod +x NumiSync-Wizard-1.0.0.AppImage
   ```
3. 运行：
   ```bash
   ./NumiSync-Wizard-1.0.0.AppImage
   ```

**可选：** 使用 [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher) 与桌面环境集成

### 方式二：Debian/Ubuntu（.deb）

**适用于：** Debian、Ubuntu、Linux Mint、Pop!_OS

```bash
# 下载 .deb 文件
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0-amd64.deb

# 安装
sudo dpkg -i NumiSync-Wizard-1.0.0-amd64.deb

# 如有需要，安装依赖
sudo apt-get install -f
```

从应用菜单启动，或运行：
```bash
numisync-wizard
```

### 方式三：Fedora/RHEL（.rpm）

**适用于：** Fedora、RHEL、CentOS、Rocky Linux

```bash
# 下载 .rpm 文件
wget https://github.com/inguy24/numismat-enrichment/releases/latest/download/NumiSync-Wizard-1.0.0.x86_64.rpm

# 安装
sudo rpm -i NumiSync-Wizard-1.0.0.x86_64.rpm

# 或使用 dnf（推荐）
sudo dnf install NumiSync-Wizard-1.0.0.x86_64.rpm
```

从应用菜单启动，或运行：
```bash
numisync-wizard
```

### 首次启动（Linux）

首次启动时，NumiSync Wizard 将：
- 在 `~/.config/numisync-wizard-cache` 创建缓存目录
- 以无收藏状态启动

---

## 初始配置

**注意：** 以下步骤适用于所有平台（Windows、macOS、Linux）

### 1. 添加 Numista API 密钥

1. 点击 **Settings**（齿轮图标）或按 `Ctrl+,`
2. 导航至 **API Settings** 选项卡
3. 输入您的 Numista API 密钥
4. 点击 **Save**

**如何获取 API 密钥：**
1. 前往 [numista.com](https://www.numista.com/) 创建免费账户
2. 登录 → 个人资料 → API 访问
3. 申请 API 密钥（个人用途即时审批）
4. 复制密钥并粘贴到 NumiSync Wizard

### 2. 打开收藏

1. 点击 **File → Open Collection**（快捷键因平台而异）
   - **Windows/Linux：** `Ctrl+O`
   - **macOS：** `Cmd+O`
2. 导航至您的 OpenNumismat `.db` 文件
3. 选择文件并点击 **Open**
4. 您的钱币将载入主窗口

### 3. 配置数据设置（可选）

1. 前往 **Settings → Data Settings**
2. 选择要同步的数据：
   - **Basic** - 类型级目录数据（铸造量、成分、统治者、设计师）
   - **Issue** - 版别专属数据（年份、铸币标记、类型变体）
   - **Pricing** - 当前市场价格（UNC、XF、VF、F 品相）
3. 如有需要，配置字段映射（仅限高级用户）

---

## 验证安装

### 测试基本功能

1. 在收藏中选择几枚钱币
2. 点击 **Search & Enrich** 按钮
3. NumiSync 应搜索 Numista 并找到匹配项
4. 在字段对比界面查看匹配结果
5. 接受一个匹配以验证数据更新正常

如果您能看到匹配结果并成功更新钱币数据，则安装成功！

---

## 故障排查

### Windows 问题

**安装程序无法运行：**
- SmartScreen 警告：点击"更多信息"→"仍要运行"
- 防病毒软件拦截：为安装程序添加例外
- 下载损坏：重新下载并验证文件大小

**应用程序无法启动：**
- 查看事件查看器：Windows 日志 → 应用程序
- 缺少依赖项：安装 [Visual C++ 可再发行组件](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)
- 防病毒干扰：为 `NumiSync Wizard.exe` 添加例外

### macOS 问题

**"NumiSync Wizard 已损坏，无法打开"：**
- 删除 DMG 并重新下载
- 验证文件大小与发布页面一致
- 尝试方法一（右键单击 → 打开）

**"安全对话框中没有'打开'选项"：**
- 您是双击而非右键单击
- 使用上述安装步骤中的方法一或方法二

**应用立即崩溃：**
- 查看控制台应用中的崩溃日志
- 附上 macOS 版本和崩溃日志后在 GitHub 提交问题

**详细故障排查请参阅 [macOS 安装指南](/macos-install)。**

### Linux 问题

**AppImage 无法运行：**
- 确保已赋予执行权限：`chmod +x *.AppImage`
- 安装 FUSE：`sudo apt-get install fuse`（Ubuntu/Debian）
- 尝试从终端运行以查看错误信息

**.deb 安装失败：**
- 安装依赖：`sudo apt-get install -f`
- 检查系统要求（Ubuntu 20.04+）

**.rpm 安装失败：**
- 安装依赖：`sudo dnf install <软件包名>`
- 检查系统要求（Fedora 32+）

**缺少库：**
```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils

# Fedora/RHEL
sudo dnf install gtk3 libnotify nss libXScrnSaver libXtst xdg-utils
```

### 所有平台

**无法打开收藏：**
- 验证 `.db` 文件存在且未损坏
- 确保您有读写权限
- 如果 OpenNumismat 已打开该收藏，请先关闭它
- 尝试 File → Recent Collections

**API 密钥无效：**
- 仔细复制粘贴（无多余空格）
- 检查速率限制（每分钟 120 次请求）
- 确认 Numista 账户处于活跃状态
- 在 Numista API 文档页面测试密钥

**缓存目录问题：**
- **Windows：** `%LOCALAPPDATA%\numisync-wizard-cache`
- **macOS：** `~/Library/Application Support/numisync-wizard-cache`
- **Linux：** `~/.config/numisync-wizard-cache`
- 检查写入权限
- 如缓存损坏，清除缓存

---

## 卸载

### Windows

1. 前往 **设置 → 应用 → 应用和功能**
2. 搜索"NumiSync Wizard"
3. 点击 **卸载**
4. 按卸载程序提示操作

**手动清理（可选）：**
- 删除缓存：`%LOCALAPPDATA%\numisync-wizard-cache`
- 删除设置：`%APPDATA%\numisync-wizard`

### macOS

1. 退出应用程序
2. 从应用程序文件夹删除 `NumiSync Wizard.app`
3. **可选清理：**
   ```bash
   rm -rf ~/Library/Application\ Support/numisync-wizard-cache
   rm -rf ~/Library/Preferences/com.numisync.wizard.plist
   ```

### Linux

**AppImage：** 直接删除 `.AppImage` 文件即可

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

**手动清理（所有 Linux）：**
```bash
rm -rf ~/.config/numisync-wizard-cache
rm -rf ~/.config/numisync-wizard
```

---

## 升级到新版本

NumiSync Wizard 将在启动时检查更新（如在 Settings 中启用）。

### 自动更新（可用时）
1. 点击 **"有可用更新"** 通知
2. 下载将自动开始
3. 下载完成后将自动安装
4. 应用将以新版本重启

### 手动更新
1. 从 [Releases](https://github.com/inguy24/numismat-enrichment/releases/latest) 下载最新安装程序
2. 运行安装程序
3. 它将自动检测并升级现有安装
4. 您的设置和缓存将被保留

---

## 后续步骤

- **[快速入门指南](/zh-CN/quickstart)** - 5 分钟快速上手
- **[用户手册](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - 完整功能文档
- **[获取支持者许可证](#)** - 解锁 Fast Pricing Mode 和 Auto-Propagate

---

## 需要帮助？

- **问题反馈：** [在 GitHub 上提交](https://github.com/inguy24/numismat-enrichment/issues)
- **讨论交流：** [向社区提问](https://github.com/inguy24/numismat-enrichment/discussions)
- **文档：** [完整文档](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

<div style="text-align: center; margin: 2em 0;">
  <a href="/zh-CN/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">← 返回首页</a>
  <a href="/zh-CN/quickstart" style="display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 6px;">下一步：快速入门 →</a>
</div>
