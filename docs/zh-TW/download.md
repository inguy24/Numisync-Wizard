---
layout: default
title: 下載 NumiSync Wizard
lang: zh-TW
page_id: download
---

<h1 style="margin-top: 2em;">下載 NumiSync Wizard</h1>

<p style="margin: 1.5em 0 2em 0; font-size: 1.1em; color: #555;">選擇您的平台開始使用。NumiSync Wizard 支援 Windows、macOS 及 Linux。</p>

---

<div style="display: flex; flex-wrap: wrap; gap: 2em; justify-content: center; margin: 2em 0;">

  <!-- Windows -->
  <div style="flex: 1; min-width: 280px; max-width: 360px; border: 1px solid #ddd; border-radius: 8px; padding: 1.5em; text-align: center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 88 88" style="margin-bottom: 0.5em;">
      <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529l.028 34.453L.028 75.48.026 45.7zm4.326-39.025L87.314 0v41.527l-47.318.376zm47.329 39.349l-.011 41.34-47.318-6.678-.066-34.739z" fill="#00adef"/>
    </svg>
    <h3 style="margin: 0.5em 0;">Windows</h3>
    <p style="color: #666; font-size: 0.9em;">Windows 10/11（64 位元）</p>

    <div style="margin: 1em 0;">
      <strong>Microsoft Store</strong><br/>
      <a href="https://apps.microsoft.com/detail/9N1TDJTPHSMN" target="_blank" rel="noopener" onclick="gtag('event', 'download_click', { platform: 'windows_store' })">
        <img src="https://get.microsoft.com/images/zh-tw%20light.svg" alt="從 Microsoft 取得" style="height: 52px; margin-top: 0.5em;"/>
      </a>
    </div>

    <div style="margin: 1em 0;">
      <strong>直接下載（.exe）</strong><br/>
      <span style="color: #888; font-style: italic;">即將推出 &mdash; 等待程式碼簽署審核</span>
    </div>

    <div style="margin-top: 1.5em; padding: 12px; background: #f9f9f9; border-radius: 6px; font-size: 0.8em; color: #666;">
      <div style="margin-bottom: 4px;">免費程式碼簽署由以下機構提供</div>
      <div>
        <a href="https://signpath.io" target="_blank" rel="noopener" style="color: #0066cc; text-decoration: none; font-weight: 500;">SignPath.io</a>
      </div>
      <div style="margin-top: 2px;">
        憑證由 <a href="https://signpath.org" target="_blank" rel="noopener" style="color: #0066cc; text-decoration: none; font-weight: 500;">SignPath Foundation</a> 頒發
      </div>
    </div>
  </div>

  <!-- macOS -->
  <div style="flex: 1; min-width: 280px; max-width: 360px; border: 1px solid #ddd; border-radius: 8px; padding: 1.5em; text-align: center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 384 512" style="margin-bottom: 0.5em;">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" fill="#555"/>
    </svg>
    <h3 style="margin: 0.5em 0;">macOS</h3>
    <p style="color: #666; font-size: 0.9em;">macOS 10.13+（Intel &amp; Apple Silicon）</p>

    <div style="margin: 1em 0;">
      <strong>Intel（x64）</strong><br/>
      <a href="https://github.com/inguy24/Numisync-Wizard/releases/latest/download/NumiSync-Wizard-x64.dmg" onclick="gtag('event', 'download_click', { platform: 'macos_intel' })" style="display: inline-block; margin-top: 0.5em; padding: 8px 16px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-size: 0.9em;">下載 DMG</a>
    </div>

    <div style="margin: 1em 0;">
      <strong>Apple Silicon（arm64）</strong><br/>
      <a href="https://github.com/inguy24/Numisync-Wizard/releases/latest/download/NumiSync-Wizard-arm64.dmg" onclick="gtag('event', 'download_click', { platform: 'macos_arm' })" style="display: inline-block; margin-top: 0.5em; padding: 8px 16px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-size: 0.9em;">下載 DMG</a>
    </div>

    <p style="font-size: 0.85em; margin-top: 1.5em;">
      <a href="/macos-install">安裝指南</a>（未簽署應用程式）
      <a href="#" onclick="showModal(); return false;" style="color: #0066cc; text-decoration: none; font-weight: 500;">為何未簽署？</a>
    </p>
  </div>

  <!-- Linux -->
  <div style="flex: 1; min-width: 280px; max-width: 360px; border: 1px solid #ddd; border-radius: 8px; padding: 1.5em; text-align: center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" style="margin-bottom: 0.5em;">
      <!-- Simplified Tux - Linux Mascot -->
      <!-- Based on original by Larry Ewing, vector by Garrett LeSage -->

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
    <h3 style="margin: 0.5em 0;">Linux</h3>
    <p style="color: #666; font-size: 0.9em;">Ubuntu、Debian、Fedora 等（x64）</p>

    <div style="margin: 1em 0;">
      <strong>AppImage（通用版）</strong><br/>
      <a href="https://github.com/inguy24/Numisync-Wizard/releases/latest/download/numisync-wizard-x86_64.AppImage" onclick="gtag('event', 'download_click', { platform: 'linux_appimage' })" style="display: inline-block; margin-top: 0.5em; padding: 8px 16px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-size: 0.9em;">下載</a>
    </div>

    <div style="margin: 1em 0;">
      <strong>Debian/Ubuntu（.deb）</strong><br/>
      <a href="https://github.com/inguy24/Numisync-Wizard/releases/latest/download/numisync-wizard-amd64.deb" onclick="gtag('event', 'download_click', { platform: 'linux_deb' })" style="display: inline-block; margin-top: 0.5em; padding: 8px 16px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-size: 0.9em;">下載</a>
    </div>

    <div style="margin: 1em 0;">
      <strong>Fedora/RHEL（.rpm）</strong><br/>
      <a href="https://github.com/inguy24/Numisync-Wizard/releases/latest/download/numisync-wizard-x86_64.rpm" onclick="gtag('event', 'download_click', { platform: 'linux_rpm' })" style="display: inline-block; margin-top: 0.5em; padding: 8px 16px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-size: 0.9em;">下載</a>
    </div>
  </div>

</div>

---

## 安裝指南

- [Windows 安裝](/zh-TW/installation#windows-installation)
- [macOS 安裝](/zh-TW/installation#macos-installation)（未簽署應用程式說明）
- [Linux 安裝](/zh-TW/installation#linux-installation)

---

## 原始碼

NumiSync Wizard 基於 MIT 授權開源。

<div style="text-align: center; margin: 2em 0;">
  <a href="https://github.com/inguy24/Numisync-Wizard" style="display: inline-block; padding: 10px 20px; background: #24292e; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">在 GitHub 上查看</a>
</div>

---

<div style="text-align: center; margin: 2em 0;">
  <a href="/zh-TW/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">返回首頁</a>
</div>

<!-- Modal for unsigned macOS explanation -->
<div id="unsignedModal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);" onclick="if(event.target === this) hideModal();">
  <div style="background-color: #fff; margin: 10% auto; padding: 30px; border-radius: 8px; max-width: 600px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" onclick="event.stopPropagation();">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0; color: #333;">為什麼 macOS 應用程式未簽署？</h2>
      <button onclick="hideModal()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999; line-height: 1;">&times;</button>
    </div>

    <div style="color: #555; line-height: 1.6;">
      <p>我們非常希望加入 Apple 開發者計劃並提供完整簽署的 macOS 應用程式，但對於這個專案而言，這樣做在經濟上並不划算。</p>

      <p><strong>Apple 開發者計劃每年需要 $99。</strong>對於一個依靠可選 $10 捐款支持的免費開源興趣專案而言，這筆每年的費用將耗盡大部分（甚至全部）支持者的貢獻。</p>

      <p>為了避免向使用者收取更多費用或虧損營運，我們選擇：</p>
      <ul style="margin: 10px 0; padding-left: 25px;">
        <li>保持 NumiSync Wizard 完全<strong>免費使用</strong></li>
        <li>為未簽署應用程式提供<strong>清晰的安裝說明</strong></li>
        <li>將資源集中在<strong>功能開發和改進</strong>上，而非 Apple 費用</li>
      </ul>

      <p>該應用程式<strong>安全可用</strong>——它是開源的，並透過 GitHub Actions 自動建置。首次啟動時只需<a href="/macos-install" style="color: #0066cc;">按右鍵並選擇「打開」</a>即可。</p>

      <p style="margin-top: 20px; padding: 15px; background: #f0f7ff; border-left: 4px solid #0066cc; border-radius: 4px;">
        <strong>💡 提示：</strong>如果 Apple 將來為個人開發者推出免費方案（就像 Microsoft 最近所做的那樣），我們將很樂意為應用程式簽署！
      </p>
    </div>

    <div style="text-align: right; margin-top: 25px;">
      <button onclick="hideModal()" style="padding: 10px 24px; background: #0066cc; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">了解了！</button>
    </div>
  </div>
</div>

<script>
function showModal() {
  document.getElementById('unsignedModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function hideModal() {
  document.getElementById('unsignedModal').style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    hideModal();
  }
});
</script>
