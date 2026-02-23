/**
 * NumiSync Wizard - Main Application
 * Handles all UI interactions and coordinates with backend
 */

// =============================================================================
// Application State
// =============================================================================

const AppState = {
  currentScreen: 'welcome',
  collectionPath: null,
  collection: null,
  coins: [],
  allCoins: [], // Unfiltered coins for frontend filtering
  currentCoin: null,
  currentMatches: [],
  selectedMatch: null,
  fieldComparison: null,
  selectedFields: {},
  settings: null,
  fetchSettings: null,
  progressStats: null,
  pagination: {
    currentPage: 1,
    pageSize: 100,
    totalPages: 1
  },
  filterSort: {
    statusFilter: 'all', // all, unprocessed, merged, skipped, complete, partial, missing_basic, missing_issue, missing_pricing
    freshnessFilter: 'all', // all, current, recent, aging, outdated, never
    sortBy: 'title', // title, year, country, last_update, pricing_freshness, status
    sortOrder: 'ASC' // ASC, DESC
  },
  // Scroll position preservation
  collectionScrollPosition: 0,
  // Fast Pricing Mode
  fastPricingMode: false,
  fastPricingSelected: new Set(),  // coin IDs
  fastPricingUpdated: new Set(),   // coin IDs that were successfully updated this session
  fastPricingFailed: new Set(),    // coin IDs that failed this session
  fastPricingProgress: {
    running: false,
    total: 0,
    completed: 0,
    succeeded: 0,
    failed: 0,
    cancelled: false,
    uiLocked: false,
    errors: []  // [{coinId, title, error}]
  },
  // View Mode
  viewMode: 'list', // 'list' or 'grid'
  // Current cache location for comparison
  currentCacheSettings: null
};

// =============================================================================
// EULA Configuration
// =============================================================================

const EULA_VERSION = '2.0';

const EULA_CONTENT = `
<div style="text-align: center; margin-bottom: 15px;">
  <img src="images/logo_with_text.svg" alt="NumiSync Wizard for OpenNumismat" style="height: 60px; width: auto;">
</div>
<p><strong>End User License Agreement - Version ${EULA_VERSION}</strong></p>
<p><em>Last Updated: February 2026</em></p>

<h5>1. Acceptance of Terms</h5>
<p>By installing, copying, or otherwise using this software ("Software"), you agree to be bound by the terms of this End User License Agreement ("Agreement"). If you do not agree to these terms, do not install or use the Software.</p>

<h5>2. License Grant</h5>
<p>Subject to the terms of this Agreement, you are granted a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to install and use the Software on devices you own or control, solely for your personal, non-commercial use in managing your coin collection.</p>

<h5>3. License Tiers</h5>
<p>The Software is offered in two tiers:</p>
<p><strong>(a) Free Version.</strong> The Free Version provides core functionality at no cost, including single-coin data enrichment from the Numista catalog. The Free Version may display periodic prompts encouraging upgrade to the Supporter Edition.</p>
<p><strong>(b) Supporter Edition.</strong> The Supporter Edition is available through purchase of a license key and provides additional features including batch pricing updates (Fast Pricing Mode), batch type data propagation (Auto-Propagate), and removal of upgrade prompts. A Supporter license key:</p>
<ul>
  <li>May be activated on up to five (5) devices you own or control</li>
  <li>Is non-transferable and may not be shared, sold, or given to others</li>
  <li>Covers the current major version of the Software and all updates within that major version (e.g., version 1.x includes all 1.0, 1.1, 1.2 releases)</li>
  <li>Does not automatically include future major versions (e.g., version 2.0); new major versions with significant added functionality may require a separate purchase</li>
  <li>Entitles you to discounted pricing on future major version upgrades as a benefit of being an existing supporter</li>
  <li>Grants access to premium features as they exist at time of purchase; future premium features may require additional purchase</li>
  <li>Does not grant ownership of the Software, access to source code, or any intellectual property rights</li>
  <li>May be deactivated from a device to free an activation slot for use on a different device</li>
  <li>Is subject to validation through third-party license management services (currently Polar.sh)</li>
</ul>
<p>Both license tiers are subject to all other terms of this Agreement. The Developer reserves the right to modify features available in each tier.</p>

<h5>4. Restrictions</h5>
<p>You shall not:</p>
<ul>
  <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of the Software</li>
  <li>Modify, adapt, translate, or create derivative works based on the Software</li>
  <li>Rent, lease, lend, sell, redistribute, or sublicense the Software or any license keys</li>
  <li>Share, publish, or distribute license keys to any third party</li>
  <li>Circumvent, disable, or interfere with license validation or activation systems</li>
  <li>Use the Software for any commercial purpose</li>
  <li>Remove or alter any proprietary notices, labels, or marks on the Software</li>
</ul>

<h5>5. Third-Party Services</h5>
<p>This Software uses the Numista API to retrieve numismatic data and Polar.sh for license management. By using this Software:</p>
<ul>
  <li>You acknowledge that you have your own separate agreement with Numista, obtained when you registered for an API key</li>
  <li>You understand that your use of Numista's services is governed solely by your agreement with them</li>
  <li>You acknowledge that license validation requires communication with Polar.sh servers</li>
  <li>The Developer is not responsible for your interactions, dealings, or disputes with Numista or Polar.sh</li>
  <li>The Developer does not control and is not liable for any data provided by these third parties</li>
</ul>

<h5>6. Data Collection and Privacy</h5>
<p>The Software is designed with privacy in mind:</p>
<ul>
  <li><strong>Local Data Only.</strong> Your coin collection data remains stored locally on your device in your OpenNumismat database. The Software does not upload, transmit, or store your collection data on any external servers.</li>
  <li><strong>No Personal Information Collected.</strong> The Software does not collect, store, or transmit personal information such as your name, email address, location, or browsing history.</li>
  <li><strong>API Communications.</strong> The Software makes requests to the Numista API to retrieve catalog data and to Polar.sh for license validation. These requests contain only the minimum information necessary for operation (such as coin identifiers for Numista lookups and license keys for validation).</li>
  <li><strong>Device Fingerprint.</strong> For Supporter Edition license activation, a device fingerprint (derived from hardware identifiers) is generated and transmitted to Polar.sh solely to manage device activation limits. This fingerprint is not linked to your personal identity.</li>
  <li><strong>Local Settings.</strong> Application preferences (such as your Numista API key and license activation status) are stored locally on your device and are not transmitted to the Developer.</li>
</ul>

<h5>7. California Privacy Rights (CCPA/CPRA)</h5>
<p>If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):</p>
<ul>
  <li><strong>Right to Know.</strong> You have the right to know what personal information is collected. As stated above, this Software does not collect personal information.</li>
  <li><strong>Right to Delete.</strong> You have the right to request deletion of personal information. Since no personal information is collected or stored by the Developer, there is nothing to delete. Your local application settings can be removed by uninstalling the Software.</li>
  <li><strong>Right to Opt-Out of Sale.</strong> The Developer does not sell, share, or disclose personal information to third parties for monetary or other valuable consideration.</li>
  <li><strong>Right to Non-Discrimination.</strong> You will not receive discriminatory treatment for exercising your privacy rights.</li>
  <li><strong>Sensitive Personal Information.</strong> The Software does not collect sensitive personal information as defined under California law.</li>
</ul>
<p>For any privacy-related inquiries, please contact the Developer through the project's GitHub repository.</p>

<h5>8. Intellectual Property</h5>
<p>The Software is licensed, not sold. The Developer retains all right, title, and interest in and to the Software, including all intellectual property rights. This Agreement does not grant you any rights to trademarks or service marks of the Developer. Purchase of a Supporter Edition license grants only the right to use premium features; it does not constitute purchase of the Software itself or any intellectual property rights therein.</p>

<h5>9. Disclaimer of Warranties</h5>
<p><strong>THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT.</strong></p>
<ul>
  <li>Pricing information is for reference only and may be inaccurate, incomplete, or outdated</li>
  <li>Catalog data may contain errors or omissions</li>
  <li>No guarantee of data accuracy, completeness, reliability, or timeliness is made</li>
  <li>The Developer does not warrant that the Software will meet your requirements or operate uninterrupted or error-free</li>
  <li>No guarantee is made regarding the continued availability of third-party services (Numista, Polar.sh)</li>
</ul>

<h5>10. Limitation of Liability</h5>
<p><strong>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE DEVELOPER BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:</strong></p>
<ul>
  <li>Your use or inability to use the Software</li>
  <li>Any loss, corruption, or modification of your OpenNumismat database or any other data</li>
  <li>Any financial decisions made based on pricing or valuation data</li>
  <li>Any unauthorized access to or alteration of your data</li>
  <li>Any third-party conduct or content, including Numista or Polar.sh</li>
  <li>Interruption or unavailability of license validation services</li>
  <li>Any other matter relating to the Software</li>
</ul>
<p>In no event shall the Developer's total liability exceed the amount you paid for the Software (if any), or $10 USD, whichever is lesser.</p>

<h5>11. Refunds</h5>
<p>Supporter Edition license purchases are processed through Polar.sh. Refund requests are subject to Polar.sh's refund policies. The Developer may, at its sole discretion, issue refunds for license purchases within a reasonable period after purchase. Refunds are not guaranteed and are evaluated on a case-by-case basis.</p>

<h5>12. Indemnification</h5>
<p>You agree to indemnify, defend, and hold harmless the Developer from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with: (a) your use of the Software; (b) your violation of this Agreement; (c) your violation of any third-party rights, including Numista's terms of service; or (d) your violation of any applicable law or regulation.</p>

<h5>13. User Responsibilities</h5>
<p>You acknowledge and agree that:</p>
<ul>
  <li>You are responsible for maintaining backups of your data</li>
  <li>You should close OpenNumismat before using this Software to avoid database conflicts</li>
  <li>You are solely responsible for any decisions made based on data obtained through this Software</li>
  <li>You will comply with all applicable laws in your use of the Software</li>
  <li>You are responsible for maintaining the confidentiality of your license key</li>
</ul>

<h5>14. No Obligation to Support or Maintain</h5>
<p>The Developer is under no obligation to:</p>
<ul>
  <li>Provide updates, bug fixes, patches, or new versions of the Software</li>
  <li>Provide technical support, customer service, or assistance of any kind</li>
  <li>Maintain compatibility with future versions of operating systems, OpenNumismat, or third-party services</li>
  <li>Continue operating, distributing, or making the Software available</li>
</ul>
<p>The Developer may, at its sole discretion, discontinue the Software, cease providing updates, or terminate license validation services at any time without notice or liability. Any updates, support, or maintenance provided are voluntary and do not create an ongoing obligation. Purchase of a Supporter Edition license does not entitle you to any guaranteed period of support, updates, or availability.</p>

<h5>15. Governing Law and Jurisdiction</h5>
<p>This Agreement shall be governed by and construed in accordance with the laws of the State of California, United States of America, without regard to its conflict of law provisions. You agree to submit to the personal and exclusive jurisdiction of the courts located in California for the resolution of any disputes.</p>

<h5>16. Dispute Resolution and Arbitration</h5>
<p><strong>PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS.</strong></p>
<p>Any dispute, controversy, or claim arising out of or relating to this Agreement, or the breach thereof, shall be determined by binding arbitration administered by a mutually agreed-upon arbitration service, in accordance with its rules then in effect. The arbitration shall be conducted in California, United States of America. The arbitrator's decision shall be final and binding, and judgment on the award may be entered in any court having jurisdiction.</p>

<h5>17. Class Action Waiver</h5>
<p><strong>YOU AND THE DEVELOPER AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.</strong> Unless both you and the Developer agree otherwise, the arbitrator may not consolidate more than one person's claims and may not otherwise preside over any form of a representative or class proceeding.</p>

<h5>18. Force Majeure</h5>
<p>The Developer shall not be liable for any failure or delay in performance under this Agreement due to circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, climate change, pandemics, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, earthquakes, accidents, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials.</p>

<h5>19. Severability</h5>
<p>If any provision of this Agreement is held to be illegal, invalid, or unenforceable by a court of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it legal, valid, and enforceable, or if modification is not possible, shall be severed from this Agreement. The remaining provisions shall continue in full force and effect.</p>

<h5>20. Waiver</h5>
<p>No failure or delay by the Developer in exercising any right, power, or remedy under this Agreement shall operate as a waiver thereof, nor shall any single or partial exercise of any right, power, or remedy preclude any other or further exercise thereof or the exercise of any other right, power, or remedy.</p>

<h5>21. Entire Agreement</h5>
<p>This Agreement constitutes the entire agreement between you and the Developer regarding the Software and supersedes all prior and contemporaneous agreements, proposals, or representations, written or oral, concerning its subject matter.</p>

<h5>22. Termination</h5>
<p>This Agreement is effective until terminated. Your rights under this Agreement will terminate automatically without notice if you fail to comply with any of its terms. Upon termination, you must cease all use of the Software and destroy all copies in your possession or control. Supporter Edition license keys may be revoked for violation of this Agreement without refund. Sections 8-21 shall survive any termination of this Agreement.</p>

<h5>23. Changes to This Agreement</h5>
<p>The Developer reserves the right to modify this Agreement at any time. Continued use of the Software after changes constitutes acceptance of the modified Agreement. Material changes will be indicated by updating the version number and "Last Updated" date.</p>

<h5>24. Contact</h5>
<p>For questions about this Agreement, please visit the project's GitHub repository.</p>

<p style="margin-top: 20px; padding-top: 10px; border-top: 1px solid var(--border-color);">
<em>By clicking "I Accept", you acknowledge that you have read, understood, and agree to be bound by this End User License Agreement, including the arbitration provision and class action waiver.</em>
</p>
`;

// =============================================================================
// Screen Navigation
// =============================================================================

function showScreen(screenName) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });

  // Show requested screen
  const screen = document.getElementById(`${screenName}Screen`);
  if (screen) {
    screen.classList.add('active');
    AppState.currentScreen = screenName;
  }

  // Scroll to top when showing match screen (new coin selected)
  if (screenName === 'match') {
    const mainContent = document.querySelector('.app-main');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }

  // Show/hide footer pagination based on screen
  const footerPagination = document.getElementById('footerPagination');
  if (footerPagination) {
    footerPagination.style.display = screenName === 'collection' ? 'flex' : 'none';
  }

  // Note: Scroll restoration is handled by restoreCollectionScrollPosition()
  // which should be called after the coin list is rendered
}

/**
 * Restore scroll position when returning to the collection screen.
 * Scrolls the previously clicked coin into view to maintain context.
 */
function restoreCollectionScrollPosition() {
  if (AppState.currentScreen !== 'collection') return;

  // If we have a current coin, scroll it into view
  if (AppState.currentCoin && AppState.currentCoin.id) {
    requestAnimationFrame(() => {
      const coinElement = document.querySelector(`.coin-item[data-coin-id="${AppState.currentCoin.id}"]`);
      if (coinElement) {
        coinElement.scrollIntoView({ block: 'center', behavior: 'instant' });
        return;
      }
      // Fallback to saved scroll position if coin not found on current page
      if (AppState.collectionScrollPosition > 0) {
        const mainContent = document.querySelector('.app-main');
        if (mainContent) {
          mainContent.scrollTop = AppState.collectionScrollPosition;
        }
      }
    });
  } else if (AppState.collectionScrollPosition > 0) {
    // Fallback to saved scroll position
    requestAnimationFrame(() => {
      const mainContent = document.querySelector('.app-main');
      if (mainContent) {
        mainContent.scrollTop = AppState.collectionScrollPosition;
      }
    });
  }
}

// =============================================================================
// Status & Progress Display
// =============================================================================

function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = `status-message status-${type}`;
}

function showProgress(visible, percent = 0) {
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  
  if (visible) {
    progressBar.style.display = 'block';
    progressFill.style.width = `${percent}%`;
  } else {
    progressBar.style.display = 'none';
  }
}

function showModal(title, body, showCancel = false) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    
    const cancelBtn = document.getElementById('modalCancel');
    cancelBtn.style.display = showCancel ? 'block' : 'none';
    
    modal.style.display = 'flex';

    const okHandler = () => {
      modal.style.display = 'none';
      resolve(true);
      cleanup();
    };

    const cancelHandler = () => {
      modal.style.display = 'none';
      resolve(false);
      cleanup();
    };

    const cleanup = () => {
      document.getElementById('modalOk').removeEventListener('click', okHandler);
      document.getElementById('modalCancel').removeEventListener('click', cancelHandler);
      document.getElementById('modalClose').removeEventListener('click', cancelHandler);
    };

    document.getElementById('modalOk').addEventListener('click', okHandler);
    document.getElementById('modalCancel').addEventListener('click', cancelHandler);
    document.getElementById('modalClose').addEventListener('click', cancelHandler);
  });
}

/**
 * Show the About dialog with app info, links, and license status
 */
async function showAboutDialog() {
  let version = '1.0.0';
  let supporterStatus = { supporter: { isSupporter: false }, polarConfig: { checkoutUrl: '' } };

  try {
    version = await window.electronAPI.getAppVersion();
  } catch (e) {
    console.error('Error getting app version:', e);
  }

  try {
    const result = await window.electronAPI.getSupporterStatus();
    if (result.success) {
      supporterStatus = result;
    }
  } catch (e) {
    console.error('Error getting supporter status:', e);
  }

  const isSupporter = supporterStatus.supporter?.isSupporter || false;
  const checkoutUrl = supporterStatus.polarConfig?.checkoutUrl || '';

  const licenseBadge = isSupporter
    ? '<span style="display: inline-block; padding: 4px 12px; background: linear-gradient(135deg, #FFD700, #FFA500); color: #333; border-radius: 4px; font-size: 0.85em; font-weight: bold;">Supporter</span>'
    : '<span style="display: inline-block; padding: 4px 12px; background: var(--text-secondary, #666); color: white; border-radius: 4px; font-size: 0.85em;">Free Version</span>';

  const licenseSection = isSupporter
    ? `<p style="margin: 10px 0 0 0; font-size: 0.85em; color: var(--text-secondary);">
         Thank you for supporting NumiSync!
       </p>
       <p style="margin: 5px 0 0 0;">
         <a href="#" id="aboutRemoveLicenseLink" style="font-size: 0.8em; color: var(--text-secondary);">Remove License</a>
       </p>`
    : `<div style="margin-top: 15px;">
         <button id="aboutPurchaseLicenseBtn"
                 style="padding: 10px 24px; background: linear-gradient(135deg, #FFD700, #FFA500); color: #333; border: none; border-radius: 6px; cursor: pointer; font-size: 1em; font-weight: bold;">
           Purchase License
         </button>
       </div>
       <p style="margin: 15px 0 8px 0; font-size: 0.85em; color: var(--text-secondary);">
         Already purchased? Enter your license key:
       </p>
       <div id="licenseEntrySection">
         <input type="text" id="aboutLicenseKeyInput" placeholder="License key from email"
                style="width: 200px; padding: 6px 10px; border: 1px solid var(--border-color, #ddd); border-radius: 4px; font-size: 0.85em;">
         <button id="aboutActivateLicenseBtn"
                 style="margin-left: 5px; padding: 6px 12px; background: var(--accent, #007bff); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
           Activate
         </button>
         <p id="aboutLicenseMessage" style="margin: 8px 0 0 0; font-size: 0.8em;"></p>
       </div>`;

  const aboutHtml = `
    <div style="text-align: center;">
      <img src="images/logo_with_text.svg" alt="NumiSync Wizard for OpenNumismat" style="height: 100px; width: auto; margin-bottom: 10px;">
      <p style="margin: 5px 0;">Version ${version}</p>

      <div style="margin: 20px 0; padding: 15px; background: var(--bg-secondary, #f5f5f5); border-radius: 8px;">
        <p style="margin: 0;">Developed by <strong>Shane Burkhardt</strong></p>
        <p style="margin: 5px 0; font-size: 0.9em; color: var(--text-secondary);">Copyright 2026 Shane Burkhardt</p>
        <p style="margin: 5px 0; font-size: 0.9em; color: var(--text-secondary);">Licensed under MIT</p>
      </div>

      <div style="margin: 15px 0;">
        <a href="#" id="aboutGithubLink" style="display: block; margin: 8px 0; color: var(--accent);">GitHub - Updates & Issues</a>
        <a href="#" id="aboutManualLink" style="display: block; margin: 8px 0; color: var(--accent);">User Manual</a>
        <a href="#" id="aboutEulaLink" style="display: block; margin: 8px 0; color: var(--accent);">End User License Agreement</a>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: var(--bg-secondary, #f5f5f5); border-radius: 8px;">
        <p style="margin: 0 0 10px 0; font-weight: bold;">License Status</p>
        ${licenseBadge}
        ${licenseSection}
      </div>
    </div>
  `;

  // Show modal without awaiting - we need to wire up event handlers immediately
  // (awaiting would wait until modal closes, at which point handlers would be useless)
  showModal('About', aboutHtml);

  // Wire up the links after modal is shown (they're now in DOM)
  setTimeout(() => {
    const githubLink = document.getElementById('aboutGithubLink');
    const manualLink = document.getElementById('aboutManualLink');
    const eulaLink = document.getElementById('aboutEulaLink');
    const purchaseLicenseBtn = document.getElementById('aboutPurchaseLicenseBtn');
    const activateBtn = document.getElementById('aboutActivateLicenseBtn');
    const licenseInput = document.getElementById('aboutLicenseKeyInput');
    const licenseMessage = document.getElementById('aboutLicenseMessage');
    const removeLicenseLink = document.getElementById('aboutRemoveLicenseLink');

    if (githubLink) {
      githubLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.electronAPI.openExternal('https://github.com/inguy24/numismat-enrichment');
      });
    }

    if (manualLink) {
      manualLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.electronAPI.openManual();
      });
    }

    if (eulaLink) {
      eulaLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('modal').style.display = 'none';
        showEulaModal(false);
      });
    }

    if (purchaseLicenseBtn) {
      purchaseLicenseBtn.addEventListener('click', () => {
        const url = checkoutUrl || 'https://buy.polar.sh/polar_cl_4hKjIXXM8bsjk9MivMFIvtXbg7zWswAzEAVJK2TVZZ0';
        window.electronAPI.openExternal(url);
      });
    }

    if (activateBtn && licenseInput) {
      const handleActivate = async () => {
        const key = licenseInput.value.trim();
        if (!key) {
          if (licenseMessage) licenseMessage.textContent = 'Please enter a license key';
          return;
        }

        activateBtn.disabled = true;
        activateBtn.textContent = 'Validating...';
        if (licenseMessage) licenseMessage.textContent = '';

        try {
          const result = await window.electronAPI.validateLicenseKey(key);

          if (result.valid) {
            if (licenseMessage) {
              licenseMessage.style.color = 'var(--success, #28a745)';
              licenseMessage.textContent = result.message;
            }
            // Refresh the dialog and version badge after a short delay
            setTimeout(() => {
              document.getElementById('modal').style.display = 'none';
              updateVersionBadge();
              showAboutDialog();
            }, 1500);
          } else {
            if (licenseMessage) {
              licenseMessage.style.color = 'var(--error, #dc3545)';
              licenseMessage.textContent = result.message;
            }
            activateBtn.disabled = false;
            activateBtn.textContent = 'Activate';
          }
        } catch (error) {
          console.error('Error validating license:', error);
          if (licenseMessage) {
            licenseMessage.style.color = 'var(--error, #dc3545)';
            licenseMessage.textContent = 'Error validating license';
          }
          activateBtn.disabled = false;
          activateBtn.textContent = 'Activate';
        }
      };

      activateBtn.addEventListener('click', handleActivate);
      licenseInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleActivate();
      });
    }

    if (removeLicenseLink) {
      removeLicenseLink.addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to remove your license?')) {
          await window.electronAPI.clearLicense();
          document.getElementById('modal').style.display = 'none';
          updateVersionBadge();
          showAboutDialog();
        }
      });
    }
  }, 0);
}

// =============================================================================
// License Prompt Modal
// =============================================================================

/**
 * Show the Report an Issue dialog with support links and log download
 */
function showReportIssueDialog() {
  const html = `
    <div style="text-align: left;">
      <p>If you're experiencing a problem or have a suggestion, here's how to get help:</p>

      <h4 style="margin: 15px 0 8px;">1. Check the User Manual</h4>
      <p>The manual covers common issues and FAQs.</p>
      <a href="#" id="reportManualLink" style="color: var(--accent);">Open User Manual</a>

      <h4 style="margin: 15px 0 8px;">2. Report on GitHub</h4>
      <p>Search existing issues or create a new one.</p>
      <a href="#" id="reportGithubLink" style="color: var(--accent);">Open GitHub Issues</a>

      <h4 style="margin: 15px 0 8px;">3. Include Your Log File</h4>
      <p>For troubleshooting, set the log level to <strong>Debug</strong> in Settings,
         reproduce the issue, then download and attach the log file.</p>
      <button id="reportDownloadLogBtn" class="btn btn-secondary" style="margin-top: 8px;">
        Download Log File
      </button>
    </div>
  `;

  showModal('Report an Issue', html);

  setTimeout(() => {
    document.getElementById('reportManualLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.electronAPI.openManual();
    });
    document.getElementById('reportGithubLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.electronAPI.openExternal('https://github.com/inguy24/Numisync-Wizard/issues');
    });
    document.getElementById('reportDownloadLogBtn')?.addEventListener('click', async () => {
      const result = await window.electronAPI.exportLogFile();
      if (result.success) {
        showModal('Success', 'Log file saved successfully.');
      }
    });
  }, 0);
}

/**
 * Show a license prompt modal at enrichment thresholds
 * @param {number} totalCoinsEnriched - Total coins enriched so far
 */
async function showLicensePromptModal(totalCoinsEnriched) {
  // Calculate time saved (estimate 2 minutes per coin)
  const minutesSaved = totalCoinsEnriched * 2;
  const hoursSaved = Math.floor(minutesSaved / 60);
  const remainingMinutes = minutesSaved % 60;
  const timeSavedText = hoursSaved > 0
    ? `${hoursSaved} hour${hoursSaved !== 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
    : `${minutesSaved} minute${minutesSaved !== 1 ? 's' : ''}`;

  let checkoutUrl = '';
  try {
    const result = await window.electronAPI.getSupporterStatus();
    if (result.success) {
      checkoutUrl = result.polarConfig?.checkoutUrl || '';
    }
  } catch (e) {
    console.error('Error getting checkout URL:', e);
  }

  const promptHtml = `
    <div style="text-align: center; max-width: 480px; margin: 0 auto;">
      <img src="images/logo_with_text.svg" alt="NumiSync Wizard" style="height: 50px; width: auto; margin-bottom: 12px;">

      <h3 style="margin: 0 0 12px 0; color: var(--text-primary);">Hi Fellow Collector!</h3>

      <p style="margin: 0 0 12px 0; font-size: 0.95em; line-height: 1.5; text-align: left;">
        I built NumiSync Wizard to save myself countless hours cataloging my coin collection in OpenNumismat.
        You've now enriched <strong>${totalCoinsEnriched} coins</strong>, saving an estimated
        <strong style="color: var(--accent);">${timeSavedText}</strong> of tedious data entry!
      </p>

      <p style="margin: 0 0 12px 0; font-size: 0.95em; line-height: 1.5; text-align: left;">
        I know you hear pleas like this all the time, but I hope you'll consider supporting this
        extremely niche software. For the price of a couple cups of coffee (outrageous these days, I know!),
        you can become a supporter.
      </p>

      <div style="margin: 15px 0; padding: 12px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 8px; text-align: left;">
        <p style="margin: 0 0 8px 0; font-size: 0.9em; font-weight: 600;">A supporter license gets you:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 0.85em; line-height: 1.6;">
          <li><strong>Fast Pricing Mode</strong> - Batch update pricing across your collection</li>
          <li><strong>Auto-Propagate</strong> - Apply type data to matching coins automatically</li>
          <li>No more of these annoying messages!</li>
          <li>Discounts on future premium features</li>
          <li>The warm fuzzy feeling of supporting independent software</li>
        </ul>
      </div>

      <p style="margin: 0 0 15px 0; font-size: 0.85em; color: var(--text-secondary); text-align: left;">
        Your support helps cover development costs and keeps NumiSync improving for our community of collectors.
      </p>

      <p style="margin: 0 0 15px 0; font-size: 0.9em; text-align: right; font-style: italic;">
        Sincerely,<br>Shane (your fellow collector)
      </p>

      <div style="margin: 15px 0;">
        <button id="licensePromptGetBtn"
                style="padding: 10px 20px; background: linear-gradient(135deg, #FFD700, #FFA500); color: #333; border: none; border-radius: 6px; cursor: pointer; font-size: 1em; font-weight: bold; margin-right: 10px;">
          Become a Supporter
        </button>
        <button id="licensePromptEnterKeyBtn"
                style="padding: 10px 20px; background: var(--accent, #007bff); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1em;">
          Enter License Key
        </button>
      </div>

      <div style="margin-top: 12px;">
        <a href="#" id="licensePromptLaterLink" style="color: var(--text-secondary); font-size: 0.85em;">Maybe Later</a>
      </div>
    </div>
  `;

  // Show modal without awaiting - need to wire up event handlers immediately
  showModal('Support NumiSync', promptHtml, false);

  // Wire up buttons
  setTimeout(() => {
    const getBtn = document.getElementById('licensePromptGetBtn');
    const enterKeyBtn = document.getElementById('licensePromptEnterKeyBtn');
    const laterLink = document.getElementById('licensePromptLaterLink');

    if (getBtn) {
      getBtn.addEventListener('click', () => {
        const url = checkoutUrl || 'https://buy.polar.sh/polar_cl_4hKjIXXM8bsjk9MivMFIvtXbg7zWswAzEAVJK2TVZZ0';
        window.electronAPI.openExternal(url);
        document.getElementById('modal').style.display = 'none';
      });
    }

    if (enterKeyBtn) {
      enterKeyBtn.addEventListener('click', () => {
        document.getElementById('modal').style.display = 'none';
        showAboutDialog(); // About dialog has the license key entry
      });
    }

    if (laterLink) {
      laterLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('modal').style.display = 'none';
      });
    }
  }, 0);
}

// =============================================================================
// Premium Feature Gating
// =============================================================================

/**
 * Premium features configuration
 */
const PREMIUM_FEATURES = {
  'fast-pricing': {
    name: 'Fast Pricing Mode',
    description: 'Batch update pricing for matched coins with 1 API call each'
  },
  'batch-type-propagation': {
    name: 'Auto-Propagate',
    description: 'Automatically propagate type data to matching coins'
  }
};

/**
 * Check if a premium feature is available
 * @param {string} featureId - The feature identifier
 * @returns {Promise<boolean>} True if feature is available (user is supporter)
 */
async function isPremiumFeatureAvailable(featureId) {
  try {
    const result = await window.electronAPI.getSupporterStatus();
    return result.success && result.supporter?.isSupporter === true;
  } catch (e) {
    console.error('Error checking premium feature:', e);
    return false;
  }
}

/**
 * Gate a premium feature - shows prompt if not available
 * @param {string} featureId - The feature identifier
 * @returns {Promise<boolean>} True if feature can be used
 */
async function requirePremiumFeature(featureId) {
  const available = await isPremiumFeatureAvailable(featureId);

  if (!available) {
    const feature = PREMIUM_FEATURES[featureId] || { name: 'Premium Feature', description: '' };

    let checkoutUrl = '';
    try {
      const result = await window.electronAPI.getSupporterStatus();
      if (result.success) {
        checkoutUrl = result.polarConfig?.checkoutUrl || '';
      }
    } catch (e) {
      console.error('Error getting checkout URL:', e);
    }

    const promptHtml = `
      <div style="text-align: center;">
        <div style="margin-bottom: 15px;">
          <span style="display: inline-block; padding: 4px 12px; background: linear-gradient(135deg, #FFD700, #FFA500); color: #333; border-radius: 4px; font-size: 0.85em; font-weight: bold;">PREMIUM</span>
        </div>

        <h3 style="margin: 0 0 10px 0;">${feature.name}</h3>

        <p style="margin: 0 0 20px 0; color: var(--text-secondary);">
          ${feature.description}
        </p>

        <p style="margin: 0 0 20px 0; font-size: 0.9em;">
          This feature requires a supporter license to use.
        </p>

        <div style="margin: 20px 0;">
          <button id="premiumGetLicenseBtn"
                  style="padding: 10px 20px; background: linear-gradient(135deg, #FFD700, #FFA500); color: #333; border: none; border-radius: 6px; cursor: pointer; font-size: 1em; font-weight: bold; margin-right: 10px;">
            Get a License
          </button>
          <button id="premiumEnterKeyBtn"
                  style="padding: 10px 20px; background: var(--accent, #007bff); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1em;">
            Enter License Key
          </button>
        </div>
      </div>
    `;

    // Show modal without awaiting - need to wire up event handlers immediately
    showModal('Premium Feature', promptHtml);

    // Wire up buttons
    return new Promise((resolve) => {
      setTimeout(() => {
        const getBtn = document.getElementById('premiumGetLicenseBtn');
        const enterKeyBtn = document.getElementById('premiumEnterKeyBtn');
        const cancelBtn = document.getElementById('modalCancel');
        const closeBtn = document.getElementById('modalClose');

        const closeHandler = () => {
          resolve(false);
        };

        if (getBtn) {
          getBtn.addEventListener('click', () => {
            const url = checkoutUrl || 'https://buy.polar.sh/polar_cl_4hKjIXXM8bsjk9MivMFIvtXbg7zWswAzEAVJK2TVZZ0';
            window.electronAPI.openExternal(url);
            document.getElementById('modal').style.display = 'none';
            resolve(false);
          });
        }

        if (enterKeyBtn) {
          enterKeyBtn.addEventListener('click', () => {
            document.getElementById('modal').style.display = 'none';
            showAboutDialog();
            resolve(false);
          });
        }

        if (cancelBtn) cancelBtn.addEventListener('click', closeHandler);
        if (closeBtn) closeBtn.addEventListener('click', closeHandler);
      }, 0);
    });
  }

  return true;
}

/**
 * Check if a feature is accessible based on license version
 * @param {string} featureName - Feature name (e.g., 'fastPricing', 'numismaticSync')
 * @returns {Promise<boolean>} True if feature is unlocked
 */
async function checkFeatureAccess(featureName) {
  try {
    const result = await window.electronAPI.checkFeatureAccess(featureName);

    if (!result.unlocked) {
      if (result.reason === 'no_license') {
        showUpgradeModal('This feature requires a license.', null, null);
      } else if (result.reason === 'version_mismatch') {
        showUpgradeModal(
          `This feature requires a v${result.requiredVersion} license. ` +
          `Your current license is for v${result.licenseVersion}. ` +
          `Purchase an upgrade to unlock this feature.`,
          result.licenseVersion,
          result.requiredVersion
        );
      }
      return false;
    }

    return true;
  } catch (e) {
    console.error('Error checking feature access:', e);
    return false;
  }
}

/**
 * Show upgrade modal for version-gated features
 * @param {string} message - Message to display
 * @param {string|null} currentVersion - Current license version (e.g., "1.0.0")
 * @param {string|null} requiredVersion - Required license version (e.g., "2.0.0")
 */
async function showUpgradeModal(message, currentVersion, requiredVersion) {
  let checkoutUrl = '';
  try {
    const result = await window.electronAPI.getSupporterStatus();
    if (result.success) {
      checkoutUrl = result.polarConfig?.checkoutUrl || '';
    }
  } catch (e) {
    console.error('Error getting checkout URL:', e);
  }

  const versionBadge = currentVersion
    ? `<div style="margin-bottom: 15px;">
         <span style="display: inline-block; padding: 4px 12px; background: var(--accent, #007bff); color: white; border-radius: 4px; font-size: 0.85em; font-weight: bold;">
           Your License: v${currentVersion}
         </span>
         ${requiredVersion ? `<span style="margin: 0 8px;">→</span>
         <span style="display: inline-block; padding: 4px 12px; background: linear-gradient(135deg, #FFD700, #FFA500); color: #333; border-radius: 4px; font-size: 0.85em; font-weight: bold;">
           Required: v${requiredVersion}
         </span>` : ''}
       </div>`
    : '';

  const promptHtml = `
    <div style="text-align: center;">
      ${versionBadge}

      <h3 style="margin: 0 0 10px 0;">Upgrade Required</h3>

      <p style="margin: 0 0 20px 0; color: var(--text-secondary);">
        ${message}
      </p>

      <div style="margin: 20px 0;">
        ${currentVersion
          ? `<button id="upgradeGetNewLicenseBtn"
                    style="padding: 10px 20px; background: linear-gradient(135deg, #FFD700, #FFA500); color: #333; border: none; border-radius: 6px; cursor: pointer; font-size: 1em; font-weight: bold; margin-right: 10px;">
              Upgrade License
            </button>`
          : `<button id="upgradeGetNewLicenseBtn"
                    style="padding: 10px 20px; background: linear-gradient(135deg, #FFD700, #FFA500); color: #333; border: none; border-radius: 6px; cursor: pointer; font-size: 1em; font-weight: bold; margin-right: 10px;">
              Get a License
            </button>`
        }
        <button id="upgradeCloseBtn"
                style="padding: 10px 20px; background: var(--bg-secondary, #6c757d); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1em;">
          Close
        </button>
      </div>
    </div>
  `;

  showModal('Upgrade Required', promptHtml);

  // Wire up buttons
  setTimeout(() => {
    const getBtn = document.getElementById('upgradeGetNewLicenseBtn');
    const closeBtn = document.getElementById('upgradeCloseBtn');
    const modalClose = document.getElementById('modalClose');

    if (getBtn) {
      getBtn.addEventListener('click', () => {
        const url = checkoutUrl || 'https://buy.polar.sh/polar_cl_4hKjIXXM8bsjk9MivMFIvtXbg7zWswAzEAVJK2TVZZ0';
        window.electronAPI.openExternal(url);
        document.getElementById('modal').style.display = 'none';
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.getElementById('modal').style.display = 'none';
      });
    }

    if (modalClose) {
      modalClose.addEventListener('click', () => {
        document.getElementById('modal').style.display = 'none';
      });
    }
  }, 0);
}

// =============================================================================
// Batch Type Data Propagation (Task 3.12)
// =============================================================================

/**
 * Normalize a catalog number by stripping known prefixes.
 * Preserves full alphanumeric number (e.g., "322.1b" stays "322.1b")
 * @param {string} rawValue - The raw catalog value from the database
 * @returns {string} Normalized catalog number
 */
function normalizeCatalogNumber(rawValue) {
  if (!rawValue || typeof rawValue !== 'string') return '';

  // Known prefixes to strip (case insensitive)
  const prefixes = [
    /^krause#?\s*/i,
    /^km[#\-\s]?\s*/i,
    /^schön#?\s*/i,
    /^numista#?\s*/i,
    /^n#\s*/i
  ];

  let normalized = rawValue.trim();
  for (const prefix of prefixes) {
    normalized = normalized.replace(prefix, '');
  }

  return normalized.trim();
}

/**
 * Get the catalog type assigned to each catalognum slot.
 * Uses field mappings from AppState or defaults.
 * @returns {Object} Mapping of slot to catalog type (e.g., { catalognum1: 'Krause', ... })
 */
function getCatalogSlotMapping() {
  const fieldMappings = AppState.fieldMappings || {};

  return {
    catalognum1: fieldMappings.catalognum1?.catalogCode || 'KM',
    catalognum2: fieldMappings.catalognum2?.catalogCode || 'Schön',
    catalognum3: fieldMappings.catalognum3?.catalogCode || 'Y',
    catalognum4: fieldMappings.catalognum4?.catalogCode || 'Numista'
  };
}

/**
 * Check if two country/issuer names refer to the same country.
 * Uses case-insensitive bi-directional includes to handle variations
 * (e.g., "United States" vs "United States of America").
 * @param {string} country1 - First country name
 * @param {string} country2 - Second country name
 * @returns {boolean} True if countries match
 */
function countriesMatch(country1, country2) {
  if (!country1 || !country2) return false;
  const a = country1.toLowerCase().trim();
  const b = country2.toLowerCase().trim();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

/**
 * Find coins in collection that match the enriched coin's type.
 * Uses strict matching: numistaId is gold standard, catalog numbers require ALL populated slots to match.
 * Non-Numista catalog matches (KM, Schon, Y) also require country match since these catalogs reuse numbers across countries.
 * @param {Object} enrichedCoin - The coin that was just enriched
 * @param {Object} numistaData - The Numista type data that was fetched
 * @returns {Array<{coin: Object, matchReason: string}>} Matching coins with reason
 */
function findMatchingCoins(enrichedCoin, numistaData) {
  const matches = [];
  const enrichedNumistaId = numistaData?.id;

  // Build catalog reference map from Numista data for quick lookup
  // numistaData.references is array of { catalogue: { id, code }, number }
  const numistaRefs = {};
  if (numistaData?.references && Array.isArray(numistaData.references)) {
    for (const ref of numistaData.references) {
      if (ref.catalogue?.code && ref.number) {
        // Normalize catalog code for case-insensitive matching
        const catalogKey = ref.catalogue.code.toLowerCase().replace(/[^a-z]/g, '');
        numistaRefs[catalogKey] = ref.number.toString();
      }
    }
  }

  const slotMapping = getCatalogSlotMapping();

  for (const coin of AppState.allCoins) {
    // Skip the enriched coin itself
    if (coin.id === enrichedCoin.id) continue;

    // Priority 1: Check numistaId in metadata (gold standard - 100% match)
    const coinMetadata = coin.metadata?.basicData;
    if (coinMetadata?.numistaId && coinMetadata.numistaId === enrichedNumistaId) {
      matches.push({
        coin,
        matchReason: `Numista ID #${enrichedNumistaId}`
      });
      continue;
    }

    // Priority 2: Catalog number matching (strict - ALL populated slots must match)
    // Only check if coin doesn't already have numistaId match
    const catalogSlots = ['catalognum1', 'catalognum2', 'catalognum3', 'catalognum4'];
    let hasAnyPopulated = false;
    let allPopulatedMatch = true;
    let matchedCatalog = null;
    let hasNonNumistaMatch = false;

    for (const slot of catalogSlots) {
      const coinValue = coin[slot];
      if (!coinValue || coinValue.trim() === '') continue;

      hasAnyPopulated = true;

      // Determine which catalog this slot maps to
      const catalogType = slotMapping[slot];
      if (!catalogType) {
        // No catalog type configured for this slot - skip it for matching
        continue;
      }

      // Normalize catalog type for lookup
      const catalogKey = catalogType.toLowerCase().replace(/[^a-z]/g, '');
      const numistaNumber = numistaRefs[catalogKey];

      if (!numistaNumber) {
        // Numista doesn't have this catalog type - can't match on this slot
        // This is NOT a conflict, just no data to compare
        continue;
      }

      // Normalize and compare
      const normalizedCoinValue = normalizeCatalogNumber(coinValue);
      if (normalizedCoinValue !== numistaNumber) {
        // Conflict - this slot doesn't match
        allPopulatedMatch = false;
        break;
      } else {
        matchedCatalog = `${catalogType}# ${numistaNumber}`;
        // Track if any matched slot uses a non-Numista catalog
        // Non-Numista catalogs (KM, Schon, Y, etc.) reuse numbers across countries
        if (catalogKey !== 'numista') {
          hasNonNumistaMatch = true;
        }
      }
    }

    // Only add if we had populated slots AND all of them matched
    if (hasAnyPopulated && allPopulatedMatch && matchedCatalog) {
      // If candidate was previously enriched with a DIFFERENT Numista type, skip it.
      if (coinMetadata?.numistaId && enrichedNumistaId && coinMetadata.numistaId !== enrichedNumistaId) {
        continue;
      }
      // Country validation for non-Numista catalog matches.
      // Non-Numista catalogs (KM, Schon, Y) reuse numbers across countries,
      // so we must verify the candidate coin is from the same issuing country.
      if (hasNonNumistaMatch) {
        const enrichedCountry = numistaData?.issuer?.name;
        if (!enrichedCountry || !countriesMatch(enrichedCountry, coin.country)) {
          continue;
        }
      }
      matches.push({
        coin,
        matchReason: matchedCatalog
      });
    }
  }

  console.log(`[Batch Type] Found ${matches.length} matching coins for type ${enrichedNumistaId}`);
  return matches;
}

/**
 * Categorize matching coins into true duplicates vs same-type different issues.
 * True duplicates: same type + year + mintmark (can receive all data including issue/pricing)
 * Same type: different year or mintmark (can only receive type-level data)
 * @param {Object} enrichedCoin - The coin that was just enriched
 * @param {Array} matchingCoins - Array of {coin, matchReason} from findMatchingCoins
 * @param {Object} issueData - The issue data from the enriched coin (contains year, mint_letter)
 * @returns {Object} { duplicates: [], sameType: [] }
 */
function categorizeMatchingCoins(enrichedCoin, matchingCoins, issueData) {
  const duplicates = [];
  const sameType = [];
  const previouslyEnriched = [];

  // Get enriched coin's issue identifiers
  const enrichedYear = enrichedCoin.year ? parseInt(enrichedCoin.year) : null;
  const enrichedMintmark = (enrichedCoin.mintmark || '').trim().toLowerCase();
  const enrichedType = (enrichedCoin.type || '').trim().toLowerCase();

  for (const { coin, matchReason } of matchingCoins) {
    const coinYear = coin.year ? parseInt(coin.year) : null;
    const coinMintmark = (coin.mintmark || '').trim().toLowerCase();
    const coinType = (coin.type || '').trim().toLowerCase();

    // Check if this coin was previously enriched
    const wasEnriched = coin.metadata?.basicData?.status === 'MERGED';

    // Check if this is a true duplicate (same year + mintmark + type)
    const yearMatches = enrichedYear === coinYear;
    const mintmarkMatches = enrichedMintmark === coinMintmark;
    const typeMatches = enrichedType === coinType;

    const isDuplicate = yearMatches && mintmarkMatches && typeMatches;

    if (wasEnriched) {
      // Separate previously enriched coins
      previouslyEnriched.push({ coin, matchReason, isDuplicate });
    } else if (isDuplicate) {
      duplicates.push({ coin, matchReason, isDuplicate: true });
    } else {
      sameType.push({ coin, matchReason, isDuplicate: false });
    }
  }

  console.log(`[Batch Type] Categorized: ${duplicates.length} duplicates, ${sameType.length} same-type, ${previouslyEnriched.length} previously enriched`);
  return { duplicates, sameType, previouslyEnriched };
}

/**
 * Show the batch type propagation prompt after a successful merge.
 * Detection is FREE (shows matching coins), applying data requires license.
 * @param {Object} enrichedCoin - The coin that was just enriched
 * @param {Object} numistaData - The Numista type data
 * @param {Object} issueData - The issue data (optional)
 * @param {Object} pricingData - The pricing data (optional)
 */
async function showBatchTypePropagationPrompt(enrichedCoin, numistaData, issueData, pricingData, selectedFields) {
  // Check license status for button styling (local lookup, no API call)
  const isSupporter = await isPremiumFeatureAvailable('batch-type-propagation');

  const matchingCoins = findMatchingCoins(enrichedCoin, numistaData);

  if (matchingCoins.length === 0) {
    console.log('[Batch Type] No matching coins found, skipping prompt');
    return;
  }

  const { duplicates, sameType, previouslyEnriched } = categorizeMatchingCoins(enrichedCoin, matchingCoins, issueData);
  const unenrichedCount = duplicates.length + sameType.length;

  // Get type title for display
  const typeTitle = numistaData?.title || 'this type';
  const typeId = numistaData?.id;

  // Get first catalog reference for display
  let catalogDisplay = '';
  if (numistaData?.references && numistaData.references.length > 0) {
    const firstRef = numistaData.references[0];
    if (firstRef.catalogue?.code && firstRef.number) {
      catalogDisplay = `${firstRef.catalogue.code}# ${firstRef.number}`;
    }
  }

  // Build coin lists HTML
  let duplicatesHtml = '';
  if (duplicates.length > 0) {
    duplicatesHtml = `
      <div class="batch-type-section">
        <h4 class="batch-type-section-title">True Duplicates (${duplicates.length} coins) - Can receive ALL data:</h4>
        <ul class="batch-type-coin-list">
          ${duplicates.slice(0, 10).map(({ coin }) =>
            `<li>${coin.title || 'Untitled'} ${coin.year || ''} ${coin.mintmark || ''}</li>`
          ).join('')}
          ${duplicates.length > 10 ? `<li class="batch-type-more">... and ${duplicates.length - 10} more</li>` : ''}
        </ul>
      </div>
    `;
  }

  let sameTypeHtml = '';
  if (sameType.length > 0) {
    sameTypeHtml = `
      <div class="batch-type-section">
        <h4 class="batch-type-section-title">Same Type, Different Issues (${sameType.length} coins) - Type data only:</h4>
        <ul class="batch-type-coin-list batch-type-scrollable">
          ${sameType.slice(0, 20).map(({ coin }) =>
            `<li>${coin.title || 'Untitled'} ${coin.year || ''} ${coin.mintmark || ''}</li>`
          ).join('')}
          ${sameType.length > 20 ? `<li class="batch-type-more">... and ${sameType.length - 20} more</li>` : ''}
        </ul>
      </div>
    `;
  }

  // Previously enriched coins section (shown separately with opt-in checkbox)
  let previouslyEnrichedHtml = '';
  if (previouslyEnriched.length > 0) {
    previouslyEnrichedHtml = `
      <div class="batch-type-section batch-type-enriched-section">
        <h4 class="batch-type-section-title">
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" id="includeEnrichedCheckbox" style="margin: 0;">
            <span>Previously Enriched (${previouslyEnriched.length} coins)</span>
          </label>
        </h4>
        <p class="batch-type-warning" style="color: var(--warning-color); font-size: 0.85em; margin: 0.25rem 0 0.5rem 1.5rem;">
          These coins were already enriched from Numista. Check the box above to overwrite their data.
        </p>
        <ul class="batch-type-coin-list batch-type-scrollable" style="opacity: 0.6;">
          ${previouslyEnriched.slice(0, 10).map(({ coin }) =>
            `<li>${coin.title || 'Untitled'} ${coin.year || ''} ${coin.mintmark || ''}</li>`
          ).join('')}
          ${previouslyEnriched.length > 10 ? `<li class="batch-type-more">... and ${previouslyEnriched.length - 10} more</li>` : ''}
        </ul>
      </div>
    `;
  }

  // Calculate initial count (without previously enriched)
  const initialCount = unenrichedCount;
  const totalWithEnriched = unenrichedCount + previouslyEnriched.length;

  const modalHtml = `
    <div class="batch-type-prompt">
      <p class="batch-type-intro">
        Found <strong><span id="batchTypeCount">${initialCount}</span> coin${initialCount === 1 ? '' : 's'}</strong> of the same type:
      </p>
      <p class="batch-type-type-info">
        <strong>${typeTitle}</strong><br>
        ${catalogDisplay ? `<span class="text-muted">${catalogDisplay}</span>` : ''}
      </p>

      ${duplicatesHtml}
      ${sameTypeHtml}
      ${previouslyEnrichedHtml}

      <div class="batch-type-actions">
        <button id="batchTypeApplyThis" class="btn btn-secondary">
          Apply to This Coin Only
        </button>
        <button id="batchTypeApplyAll" class="btn ${isSupporter ? 'btn-secondary' : 'btn-primary btn-premium'}"${unenrichedCount === 0 ? ' disabled' : ''}>
          Apply to All <span id="batchTypeButtonCount">${initialCount}</span>${isSupporter ? '' : ' <span class="premium-badge">' + UI_STRINGS.ICON_GEM + '</span>'}
        </button>
      </div>
    </div>
  `;

  // Show the modal
  const modal = document.getElementById('modal');
  document.getElementById('modalTitle').textContent = 'Matching Coins Found';
  document.getElementById('modalBody').innerHTML = modalHtml;
  document.getElementById('modalOk').style.display = 'none';
  document.getElementById('modalCancel').style.display = 'none';
  modal.style.display = 'flex';

  return new Promise((resolve) => {
    const applyThisBtn = document.getElementById('batchTypeApplyThis');
    const applyAllBtn = document.getElementById('batchTypeApplyAll');
    const closeBtn = document.getElementById('modalClose');
    const includeEnrichedCheckbox = document.getElementById('includeEnrichedCheckbox');
    const countSpan = document.getElementById('batchTypeCount');
    const buttonCountSpan = document.getElementById('batchTypeButtonCount');

    // Track whether to include previously enriched coins
    let includeEnriched = false;

    // Update counts when checkbox changes
    if (includeEnrichedCheckbox) {
      includeEnrichedCheckbox.addEventListener('change', (e) => {
        includeEnriched = e.target.checked;
        const newCount = includeEnriched ? totalWithEnriched : unenrichedCount;
        if (countSpan) countSpan.textContent = newCount;
        if (buttonCountSpan) buttonCountSpan.textContent = newCount;
        // Enable/disable button based on count
        if (applyAllBtn) applyAllBtn.disabled = newCount === 0;
        // Update enriched list opacity
        const enrichedList = document.querySelector('.batch-type-enriched-section .batch-type-coin-list');
        if (enrichedList) enrichedList.style.opacity = includeEnriched ? '1' : '0.6';
      });
    }

    const cleanup = () => {
      modal.style.display = 'none';
      document.getElementById('modalOk').style.display = 'block';
      document.getElementById('modalCancel').style.display = 'block';
    };

    const handleApplyThis = () => {
      cleanup();
      resolve({ action: 'this_only' });
    };

    const handleApplyAll = async () => {
      cleanup();

      // Only check premium if not already a supporter (we checked earlier for button styling)
      if (!isSupporter) {
        const canUse = await requirePremiumFeature('batch-type-propagation');
        if (!canUse) {
          resolve({ action: 'cancelled' });
          return;
        }
      }

      // Proceed with batch propagation - include previously enriched if checkbox was checked
      resolve({
        action: 'apply_all',
        enrichedCoin,
        duplicates,
        sameType,
        previouslyEnriched: includeEnriched ? previouslyEnriched : [],
        numistaData,
        issueData,
        pricingData,
        selectedFields
      });
    };

    const handleClose = () => {
      cleanup();
      resolve({ action: 'cancelled' });
    };

    if (applyThisBtn) applyThisBtn.addEventListener('click', handleApplyThis, { once: true });
    if (applyAllBtn) applyAllBtn.addEventListener('click', handleApplyAll, { once: true });
    if (closeBtn) closeBtn.addEventListener('click', handleClose, { once: true });
  });
}

/**
 * Apply batch type propagation to matching coins.
 * @param {Object} result - Result from showBatchTypePropagationPrompt
 * @returns {Promise<Object>} Result with success/failure counts
 */
async function applyBatchTypePropagation(result) {
  if (result.action !== 'apply_all') {
    return { success: true, applied: 0, skipped: 0 };
  }

  const { enrichedCoin, duplicates, sameType, previouslyEnriched = [], numistaData, issueData, pricingData, selectedFields } = result;
  const allCoins = [...duplicates, ...sameType, ...previouslyEnriched];

  // Show progress modal
  const modal = document.getElementById('modal');
  document.getElementById('modalTitle').textContent = 'Applying Type Data';
  document.getElementById('modalBody').innerHTML = `
    <div class="batch-propagate-progress">
      <p>Applying type data to <strong>${allCoins.length}</strong> matching coins...</p>
      <div class="fp-inline-progress" style="display: flex; margin: 1rem 0;">
        <div class="fp-progress-bar" style="flex: 1;">
          <div id="batchPropagateProgressFill" class="fp-progress-fill" style="width: 0%;"></div>
        </div>
        <span id="batchPropagateProgressText" class="fp-progress-text" style="min-width: 90px; text-align: right;">0/${allCoins.length} (0%)</span>
      </div>
      <p id="batchPropagateStatus" class="text-muted" style="font-size: 0.9em;">Starting...</p>
    </div>
  `;
  document.getElementById('modalOk').style.display = 'none';
  document.getElementById('modalCancel').style.display = 'none';
  modal.style.display = 'flex';

  const progressFill = document.getElementById('batchPropagateProgressFill');
  const progressText = document.getElementById('batchPropagateProgressText');
  const statusText = document.getElementById('batchPropagateStatus');

  // Task 3.12.9: Enhanced tracking for skip reasons
  let fullDataApplied = 0;  // True duplicates - all data applied
  let typeOnlyApplied = 0;   // Same type - type data only
  let errorCount = 0;
  const errors = [];
  const skippedIssueData = [];  // Coins where issue data was skipped with reasons

  for (let i = 0; i < allCoins.length; i++) {
    const { coin, isDuplicate, matchReason } = allCoins[i];

    // Update progress bar
    const completed = i + 1;
    const percent = Math.round((completed / allCoins.length) * 100);
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${completed}/${allCoins.length} (${percent}%)`;
    statusText.textContent = `Processing: ${coin.title || 'Untitled'} ${coin.year || ''}`;

    try {
      // Determine skip reason for issue data if not a duplicate
      let issueSkipReason = null;
      if (!isDuplicate) {
        // Track why issue data was skipped for same-type coins
        // Use the enriched source coin (not duplicates[0]) for comparison
        const coinYear = coin.year ? parseInt(coin.year) : null;
        const coinMintmark = (coin.mintmark || '').trim().toLowerCase();
        const refYear = enrichedCoin ? parseInt(enrichedCoin.year) || null : null;
        const refMintmark = enrichedCoin ? (enrichedCoin.mintmark || '').trim().toLowerCase() : '';

        if (coinYear !== refYear) {
          issueSkipReason = 'Different year';
        } else if (coinMintmark !== refMintmark) {
          issueSkipReason = 'Different mintmark';
        } else {
          issueSkipReason = 'Different issue variant';
        }
      }

      const propagateResult = await window.electronAPI.propagateTypeData({
        coinId: coin.id,
        numistaData,
        issueData: isDuplicate ? issueData : null,
        pricingData: isDuplicate ? pricingData : null,
        isDuplicate,
        sourceNumistaId: numistaData.id,
        issueSkipReason: issueSkipReason,
        selectedFields
      });

      if (propagateResult.success) {
        if (isDuplicate) {
          fullDataApplied++;
        } else {
          typeOnlyApplied++;
          if (issueSkipReason) {
            skippedIssueData.push({ coin, reason: issueSkipReason });
          }
        }
      } else {
        errorCount++;
        errors.push({ coin, error: propagateResult.error });
      }
    } catch (error) {
      errorCount++;
      errors.push({ coin, error: error.message });
    }
  }

  // Update progress to 100%
  progressFill.style.width = '100%';
  progressText.textContent = `${allCoins.length}/${allCoins.length} (100%)`;
  statusText.textContent = 'Complete!';

  // Task 3.12.9: Enhanced results display
  const totalApplied = fullDataApplied + typeOnlyApplied;
  let resultHtml = `<p><strong>Batch Update Complete</strong></p>`;

  if (fullDataApplied > 0) {
    resultHtml += `<p class="text-success">Full data applied: <strong>${fullDataApplied}</strong> coins (true duplicates)</p>`;
  }

  if (typeOnlyApplied > 0) {
    resultHtml += `<p>Type data only: <strong>${typeOnlyApplied}</strong> coins (different issue)</p>`;
  }

  if (totalApplied === 0 && errorCount === 0) {
    resultHtml += `<p>No coins were updated.</p>`;
  }

  // Show skipped issue data details (first 5)
  if (skippedIssueData.length > 0) {
    resultHtml += `
      <div class="skip-info">
        <h4>Issue/Pricing Skipped (${skippedIssueData.length} coins):</h4>
        <ul class="skip-list">
          ${skippedIssueData.slice(0, 5).map(s =>
            `<li>${s.coin.title || 'Untitled'} ${s.coin.year || ''} ${s.coin.mintmark || ''}: ${s.reason}</li>`
          ).join('')}
          ${skippedIssueData.length > 5 ? `<li class="skip-more">... and ${skippedIssueData.length - 5} more</li>` : ''}
        </ul>
        <p class="skip-note">Type data was still applied. Use individual enrichment for issue/pricing.</p>
      </div>
    `;
  }

  // Show errors
  if (errors.length > 0) {
    resultHtml += `
      <div class="error-list">
        <h4>Errors (${errors.length}):</h4>
        <ul>${errors.slice(0, 5).map(e => `<li>${e.coin.title || 'Untitled'}: ${e.error}</li>`).join('')}</ul>
        ${errors.length > 5 ? `<li>... and ${errors.length - 5} more errors</li>` : ''}
      </div>
    `;
  }

  // Update modal with results (modal is already open)
  document.getElementById('modalTitle').textContent = 'Batch Update Results';
  document.getElementById('modalBody').innerHTML = resultHtml;
  document.getElementById('modalOk').style.display = 'block';

  // Wait for user to dismiss
  await new Promise(resolve => {
    const okBtn = document.getElementById('modalOk');
    const closeBtn = document.getElementById('modalClose');
    const handler = () => {
      modal.style.display = 'none';
      resolve();
    };
    okBtn.addEventListener('click', handler, { once: true });
    closeBtn.addEventListener('click', handler, { once: true });
  });

  return {
    success: true,
    applied: totalApplied,
    fullDataApplied,
    typeOnlyApplied,
    skipped: errorCount,
    skippedIssueData,
    errors
  };
}

// =============================================================================
// EULA Management
// =============================================================================

/**
 * Check if EULA has been accepted for current version
 * @returns {Promise<boolean>} True if EULA has been accepted
 */
async function isEulaAccepted() {
  try {
    const result = await window.electronAPI.getAppSettings();
    if (result.success && result.settings) {
      return result.settings.eulaAccepted === true &&
             result.settings.eulaVersion === EULA_VERSION;
    }
    return false;
  } catch (error) {
    console.error('Error checking EULA status:', error);
    return false;
  }
}

/**
 * Save EULA acceptance to app settings
 * @returns {Promise<boolean>} True if saved successfully
 */
async function saveEulaAcceptance() {
  try {
    const result = await window.electronAPI.getAppSettings();
    const settings = result.success ? result.settings : {};

    settings.eulaAccepted = true;
    settings.eulaAcceptedAt = new Date().toISOString();
    settings.eulaVersion = EULA_VERSION;

    const saveResult = await window.electronAPI.saveAppSettings(settings);
    return saveResult.success;
  } catch (error) {
    console.error('Error saving EULA acceptance:', error);
    return false;
  }
}

/**
 * Show the EULA modal
 * @param {boolean} isFirstLaunch - If true, user must accept or app will exit
 * @returns {Promise<boolean>} True if user accepted, false if declined
 */
function showEulaModal(isFirstLaunch = true) {
  return new Promise((resolve) => {
    const modal = document.getElementById('eulaModal');
    const content = document.getElementById('eulaContent');
    const checkbox = document.getElementById('eulaAcceptCheckbox');
    const acceptBtn = document.getElementById('eulaAcceptBtn');
    const declineBtn = document.getElementById('eulaDeclineBtn');
    const numistaLink = document.getElementById('eulaNumistaLink');

    // Populate content
    content.innerHTML = EULA_CONTENT;

    // Reset state
    checkbox.checked = false;
    acceptBtn.disabled = true;

    // Update button text based on context
    if (isFirstLaunch) {
      declineBtn.textContent = 'Decline and Exit';
    } else {
      declineBtn.textContent = 'Close';
    }

    // Checkbox enables accept button
    const checkboxHandler = () => {
      acceptBtn.disabled = !checkbox.checked;
    };
    checkbox.addEventListener('change', checkboxHandler);

    // Accept handler
    const acceptHandler = async () => {
      const saved = await saveEulaAcceptance();
      modal.style.display = 'none';
      cleanup();
      resolve(saved);
    };

    // Decline handler
    const declineHandler = () => {
      modal.style.display = 'none';
      cleanup();
      if (isFirstLaunch) {
        window.close();
      }
      resolve(false);
    };

    // Numista link handler
    const numistaLinkHandler = (e) => {
      e.preventDefault();
      window.electronAPI.openExternal('https://en.numista.com');
    };

    const cleanup = () => {
      checkbox.removeEventListener('change', checkboxHandler);
      acceptBtn.removeEventListener('click', acceptHandler);
      declineBtn.removeEventListener('click', declineHandler);
      numistaLink.removeEventListener('click', numistaLinkHandler);
    };

    acceptBtn.addEventListener('click', acceptHandler);
    declineBtn.addEventListener('click', declineHandler);
    numistaLink.addEventListener('click', numistaLinkHandler);

    // Show modal
    modal.style.display = 'flex';
  });
}

/**
 * Check and show EULA on app startup if not accepted
 * @returns {Promise<boolean>} True if EULA is accepted (or was just accepted)
 */
async function checkEulaOnStartup() {
  // First check for installer-created marker (NSIS installer accepted EULA)
  try {
    const installerMarkerExists = await window.electronAPI.checkInstallerEulaMarker();
    if (installerMarkerExists) {
      // EULA was accepted during installation - save to app settings for consistency
      await saveEulaAcceptance();
      return true;
    }
  } catch (error) {
    console.error('Error checking installer EULA marker:', error);
  }

  // Fall back to existing in-app EULA check (portable installs, dev mode)
  const accepted = await isEulaAccepted();
  if (!accepted) {
    const userAccepted = await showEulaModal(true);
    return userAccepted;
  }
  return true;
}

// =============================================================================
// Collection Loading
// =============================================================================

document.getElementById('loadCollectionBtn').addEventListener('click', async () => {
  try {
    showStatus('Selecting collection file...');
    
    const filePath = await window.electronAPI.selectCollectionFile();
    
    if (!filePath) {
      showStatus('No file selected');
      return;
    }

    showProgress(true, 30);
    showStatus('Loading collection...');

    const result = await window.electronAPI.loadCollection(filePath);

    if (!result.success) {
      if (result.error === 'cancelled') {
        // User cancelled from the database-in-use dialog — return silently
        showProgress(false);
        showStatus('Collection load cancelled');
        return;
      }
      throw new Error(result.error);
    }

    AppState.collectionPath = result.filePath;
    AppState.collection = result.summary;
    AppState.progressStats = result.progress.statistics;

    showProgress(true, 100);
    showStatus(`Loaded collection: ${result.filePath}`);

    // Update UI with collection info
    await loadCollectionScreen();

    setTimeout(() => {
      showProgress(false);
      showScreen('collection');
    }, 500);

  } catch (error) {
    showProgress(false);
    showStatus(`Error loading collection: ${error.message}`, 'error');
    showModal('Error', `Failed to load collection:<br>${error.message}`);
  }
});

async function loadCollectionScreen() {
  // Update title in header
  const filename = AppState.collectionPath.split(/[\\/]/).pop();
  document.getElementById('headerCollectionTitle').textContent = filename;

  // Show header collection elements
  document.getElementById('headerCollection').style.display = 'flex';
  document.getElementById('headerCollectionActions').style.display = 'flex';
  document.getElementById('dataSettingsBtn').style.display = 'flex';

  // Load collection-specific fetch settings for counter strip
  try {
    const collectionSettings = await window.api.getSettings();
    AppState.fetchSettings = collectionSettings.fetchSettings || { basicData: true, issueData: false, pricingData: false };

    // Initialize view mode from saved preference
    const savedViewMode = collectionSettings.uiPreferences?.defaultView || 'list';
    setViewMode(savedViewMode, false); // Don't persist, just initialize

    // Initialize sticky info bar from saved preference
    const stickyInfoBar = collectionSettings.uiPreferences?.stickyInfoBar || false;
    setStickyInfoBar(stickyInfoBar, false); // Don't persist, just initialize

    // Restore last view state (page, filters, sort) if available
    restoreViewState(collectionSettings.uiPreferences?.lastViewState);
  } catch (e) {
    console.error('Error loading fetch settings:', e);
    AppState.fetchSettings = { basicData: true, issueData: false, pricingData: false };
  }

  // Update status bar with loaded fetch settings
  if (dataSettingsUI) {
    dataSettingsUI.updateStatusBarDisplay(AppState.fetchSettings);
  }

  // Update statistics
  updateProgressStats();

  // Load coins (uses restored filters/sort/page from view state)
  await loadCoins();

  // Restore scroll position if we have a saved view state
  if (AppState.collectionScrollPosition > 0) {
    requestAnimationFrame(() => {
      const mainContent = document.querySelector('.app-main');
      if (mainContent) {
        mainContent.scrollTop = AppState.collectionScrollPosition;
      }
    });
  }
}

function updateProgressStats() {
  const stats = AppState.progressStats || {
    total: 0,
    complete: 0,
    partial: 0,
    pending: 0,
    skipped: 0,
    error: 0,
    basicData: { merged: 0, pending: 0, notQueried: 0, skipped: 0, error: 0, noData: 0 },
    issueData: { merged: 0, pending: 0, notQueried: 0, skipped: 0, error: 0, noMatch: 0, noData: 0 },
    pricingData: { merged: 0, pending: 0, notQueried: 0, skipped: 0, error: 0, noData: 0 }
  };

  const total = stats.total || 0;

  document.getElementById('statTotal').textContent = total;

  const dataTypes = [
    { key: 'basicData', cardId: 'cardBasicData', mergedId: 'statBasicMerged', totalId: 'statBasicTotal', barId: 'barBasicData', label: 'Basic Data' },
    { key: 'issueData', cardId: 'cardIssueData', mergedId: 'statIssueMerged', totalId: 'statIssueTotal', barId: 'barIssueData', label: 'Issue Data' },
    { key: 'pricingData', cardId: 'cardPricingData', mergedId: 'statPricingMerged', totalId: 'statPricingTotal', barId: 'barPricingData', label: 'Pricing Data' }
  ];

  dataTypes.forEach(dt => {
    const typeStats = stats[dt.key] || {};
    const merged = typeStats.merged || 0;
    const errors = (typeStats.error || 0) + (typeStats.noData || 0) + (typeStats.noMatch || 0);
    const skipped = typeStats.skipped || 0;
    const pct = total > 0 ? Math.round((merged / total) * 100) : 0;

    document.getElementById(dt.mergedId).textContent = merged;
    document.getElementById(dt.totalId).textContent = total;
    document.getElementById(dt.barId).style.width = pct + '%';

    // Build tooltip with error/skip details
    const cardEl = document.getElementById(dt.cardId);
    if (cardEl) {
      let tooltip = `${dt.label}: ${merged}/${total} merged (${pct}%)`;
      if (errors > 0 || skipped > 0) {
        tooltip += '\n';
        if (errors > 0) tooltip += `${errors} error${errors !== 1 ? 's' : ''}`;
        if (errors > 0 && skipped > 0) tooltip += ', ';
        if (skipped > 0) tooltip += `${skipped} skipped`;
      }
      cardEl.title = tooltip;
    }
  });
}

/**
 * Apply frontend filters and sorting to coins array
 * @param {Array} coins - Array of coins with statusInfo
 * @returns {Array} - Filtered and sorted coins
 */
function applyFilters(coins) {
  let filtered = [...coins];

  // Apply status filter
  const statusFilter = AppState.filterSort.statusFilter;
  if (statusFilter !== 'all') {
    filtered = filtered.filter(coin => {
      const statusInfo = coin.statusInfo;
      if (!statusInfo) {
        return statusFilter === 'unprocessed';
      }

      switch (statusFilter) {
        case 'unprocessed':
          // No data has been merged yet
          return (!statusInfo.basicData || statusInfo.basicData.status !== 'MERGED') &&
                 (!statusInfo.issueData || statusInfo.issueData.status !== 'MERGED') &&
                 (!statusInfo.pricingData || statusInfo.pricingData.status !== 'MERGED');

        case 'merged':
          // At least basic data has been merged
          return statusInfo.basicData?.status === 'MERGED';

        case 'skipped':
          // Overall coin status is skipped
          return coin.status === 'SKIPPED';

        case 'complete':
          // All requested data types are merged
          return statusInfo.basicData?.status === 'MERGED' &&
                 (statusInfo.issueData?.status === 'MERGED' || statusInfo.issueData?.status === 'NOT_QUERIED') &&
                 (statusInfo.pricingData?.status === 'MERGED' || statusInfo.pricingData?.status === 'NOT_QUERIED');

        case 'partial':
          // Some but not all data is merged
          const basicMerged = statusInfo.basicData?.status === 'MERGED';
          const issueMerged = statusInfo.issueData?.status === 'MERGED';
          const pricingMerged = statusInfo.pricingData?.status === 'MERGED';
          const issueQueried = statusInfo.issueData?.status !== 'NOT_QUERIED';
          const pricingQueried = statusInfo.pricingData?.status !== 'NOT_QUERIED';

          return basicMerged && (
            (issueQueried && !issueMerged) ||
            (pricingQueried && !pricingMerged)
          );

        case 'missing_basic':
          return !statusInfo.basicData || statusInfo.basicData.status !== 'MERGED';

        case 'missing_issue':
          return statusInfo.issueData &&
                 statusInfo.issueData.status !== 'NOT_QUERIED' &&
                 statusInfo.issueData.status !== 'MERGED';

        case 'missing_pricing':
          return statusInfo.pricingData &&
                 statusInfo.pricingData.status !== 'NOT_QUERIED' &&
                 statusInfo.pricingData.status !== 'MERGED';

        default:
          return true;
      }
    });
  }

  // Apply freshness filter (for pricing data)
  const freshnessFilter = AppState.filterSort.freshnessFilter;
  if (freshnessFilter !== 'all') {
    filtered = filtered.filter(coin => {
      const pricingStatus = coin.statusInfo?.pricingData;
      if (!pricingStatus || pricingStatus.status !== 'MERGED') {
        return freshnessFilter === 'never';
      }

      const freshness = calculatePricingFreshness(pricingStatus.timestamp);
      return freshness.status.toLowerCase() === freshnessFilter.toLowerCase();
    });
  }

  // Apply frontend sorting for Phase 2 sort options
  const sortBy = AppState.filterSort.sortBy;
  if (sortBy === 'last_update' || sortBy === 'pricing_freshness' || sortBy === 'status') {
    filtered.sort((a, b) => {
      let aValue, bValue;

      if (sortBy === 'last_update') {
        // Sort by most recent update timestamp across all data types
        aValue = getMostRecentTimestamp(a.statusInfo);
        bValue = getMostRecentTimestamp(b.statusInfo);

        // Most recent first (descending)
        return bValue - aValue;
      }

      if (sortBy === 'pricing_freshness') {
        // Sort by pricing freshness (current > recent > aging > outdated > never)
        aValue = getPricingFreshnessScore(a.statusInfo?.pricingData?.timestamp);
        bValue = getPricingFreshnessScore(b.statusInfo?.pricingData?.timestamp);

        // Best freshness first (descending)
        return bValue - aValue;
      }

      if (sortBy === 'status') {
        // Sort by completion status (complete > partial > unprocessed)
        aValue = getCompletionScore(a.statusInfo);
        bValue = getCompletionScore(b.statusInfo);

        // Most complete first (descending)
        return bValue - aValue;
      }

      return 0;
    });
  }
  // Note: Database-level sorting (title, year, country) is already applied

  return filtered;
}

/**
 * Get the most recent timestamp from a coin's status info
 */
function getMostRecentTimestamp(statusInfo) {
  if (!statusInfo) return 0;

  const timestamps = [];
  if (statusInfo.basicData?.timestamp) timestamps.push(new Date(statusInfo.basicData.timestamp));
  if (statusInfo.issueData?.timestamp) timestamps.push(new Date(statusInfo.issueData.timestamp));
  if (statusInfo.pricingData?.timestamp) timestamps.push(new Date(statusInfo.pricingData.timestamp));

  if (timestamps.length === 0) return 0;
  return Math.max(...timestamps);
}

/**
 * Get pricing freshness score for sorting (higher = fresher)
 */
function getPricingFreshnessScore(timestamp) {
  if (!timestamp) return 0; // Never = lowest

  const freshness = calculatePricingFreshness(timestamp);
  const scoreMap = {
    'CURRENT': 4,
    'RECENT': 3,
    'AGING': 2,
    'OUTDATED': 1,
    'NEVER': 0
  };

  return scoreMap[freshness.status] || 0;
}

/**
 * Get completion score for sorting (higher = more complete)
 */
function getCompletionScore(statusInfo) {
  if (!statusInfo) return 0;

  let score = 0;
  if (statusInfo.basicData?.status === 'MERGED') score += 3;
  if (statusInfo.issueData?.status === 'MERGED') score += 2;
  if (statusInfo.pricingData?.status === 'MERGED') score += 1;

  return score;
}

async function loadCoins() {
  try {
    showStatus('Loading coins...');

    const total = AppState.progressStats?.total || 0;

    // Load ALL coins (or at least a large batch) to enable frontend filtering
    // For very large collections, we may need to adjust this approach

    // Only use backend sorting for database fields (title, year, country)
    const dbSortFields = ['title', 'year', 'country'];
    const sortBy = dbSortFields.includes(AppState.filterSort.sortBy)
      ? AppState.filterSort.sortBy
      : 'title'; // Default to title for Phase 2 sorts

    const result = await window.electronAPI.getCoins({
      limit: 10000, // Load up to 10k coins for filtering
      offset: 0,
      sortBy: sortBy,
      sortOrder: AppState.filterSort.sortOrder
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // Store all coins
    AppState.allCoins = result.coins;

    // Apply frontend filters
    const filteredCoins = applyFilters(AppState.allCoins);

    // Calculate pagination based on filtered results
    const filteredTotal = filteredCoins.length;
    AppState.pagination.totalPages = Math.ceil(filteredTotal / AppState.pagination.pageSize) || 1;

    // Ensure current page is valid
    if (AppState.pagination.currentPage > AppState.pagination.totalPages) {
      AppState.pagination.currentPage = AppState.pagination.totalPages || 1;
    }

    // Apply pagination to filtered results
    const offset = (AppState.pagination.currentPage - 1) * AppState.pagination.pageSize;
    AppState.coins = filteredCoins.slice(offset, offset + AppState.pagination.pageSize);

    renderCoinList();
    updatePaginationControls();
    updateFilterSummary();

    const startIndex = offset + 1;
    const endIndex = Math.min(offset + AppState.coins.length, filteredTotal);
    showStatus(`Showing ${startIndex}-${endIndex} of ${filteredTotal} coins` +
               (filteredTotal < total ? ` (filtered from ${total})` : ''));
  } catch (error) {
    showStatus(`Error loading coins: ${error.message}`, 'error');
  }
}

function updatePaginationControls() {
  const { currentPage, totalPages } = AppState.pagination;

  // Update page info text
  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;

  // Update button states
  document.getElementById('firstPageBtn').disabled = currentPage === 1;
  document.getElementById('prevPageBtn').disabled = currentPage === 1;
  document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
  document.getElementById('lastPageBtn').disabled = currentPage === totalPages;
}

/**
 * Calculate filter counts for all filter categories
 * @param {Array} allCoins - All coins (unfiltered)
 * @returns {Object} - Filter counts by category
 */
function calculateFilterCounts(allCoins) {
  const counts = {
    status: {
      all: allCoins.length,
      unprocessed: 0,
      merged: 0,
      skipped: 0,
      complete: 0,
      partial: 0,
      missing_basic: 0,
      missing_issue: 0,
      missing_pricing: 0
    },
    freshness: {
      all: allCoins.length,
      current: 0,
      recent: 0,
      aging: 0,
      outdated: 0,
      never: 0
    }
  };

  allCoins.forEach(coin => {
    const statusInfo = coin.statusInfo;

    // Count status categories
    if (!statusInfo || (!statusInfo.basicData || statusInfo.basicData.status !== 'MERGED')) {
      counts.status.unprocessed++;
    }

    if (statusInfo?.basicData?.status === 'MERGED') {
      counts.status.merged++;
    }

    if (coin.status === 'SKIPPED') {
      counts.status.skipped++;
    }

    // Complete: all requested data types are merged
    if (statusInfo?.basicData?.status === 'MERGED' &&
        (statusInfo.issueData?.status === 'MERGED' || statusInfo.issueData?.status === 'NOT_QUERIED') &&
        (statusInfo.pricingData?.status === 'MERGED' || statusInfo.pricingData?.status === 'NOT_QUERIED')) {
      counts.status.complete++;
    }

    // Partial: basic merged but some queried data missing
    if (statusInfo?.basicData?.status === 'MERGED') {
      const issueMerged = statusInfo.issueData?.status === 'MERGED';
      const pricingMerged = statusInfo.pricingData?.status === 'MERGED';
      const issueQueried = statusInfo.issueData?.status !== 'NOT_QUERIED';
      const pricingQueried = statusInfo.pricingData?.status !== 'NOT_QUERIED';

      if ((issueQueried && !issueMerged) || (pricingQueried && !pricingMerged)) {
        counts.status.partial++;
      }
    }

    // Missing data categories
    if (!statusInfo || !statusInfo.basicData || statusInfo.basicData.status !== 'MERGED') {
      counts.status.missing_basic++;
    }

    if (statusInfo?.issueData &&
        statusInfo.issueData.status !== 'NOT_QUERIED' &&
        statusInfo.issueData.status !== 'MERGED') {
      counts.status.missing_issue++;
    }

    if (statusInfo?.pricingData &&
        statusInfo.pricingData.status !== 'NOT_QUERIED' &&
        statusInfo.pricingData.status !== 'MERGED') {
      counts.status.missing_pricing++;
    }

    // Count freshness categories
    const pricingStatus = statusInfo?.pricingData;
    if (!pricingStatus || pricingStatus.status !== 'MERGED') {
      counts.freshness.never++;
    } else {
      const freshness = calculatePricingFreshness(pricingStatus.timestamp);
      const freshnessKey = freshness.status.toLowerCase();
      if (counts.freshness[freshnessKey] !== undefined) {
        counts.freshness[freshnessKey]++;
      }
    }
  });

  return counts;
}

/**
 * Update the stats summary row display with counts
 */
function updateFilterSummary() {
  const summaryRow = document.getElementById('statsSummaryRow');
  if (!AppState.allCoins || AppState.allCoins.length === 0) {
    if (summaryRow) summaryRow.style.display = 'none';
    return;
  }

  const counts = calculateFilterCounts(AppState.allCoins);

  // Update status counts
  const countComplete = document.getElementById('countComplete');
  const countPartial = document.getElementById('countPartial');
  const countUnprocessed = document.getElementById('countUnprocessed');
  const countSkipped = document.getElementById('countSkipped');

  if (countComplete) countComplete.textContent = `Complete: ${counts.status.complete}`;
  if (countPartial) countPartial.textContent = `Partial: ${counts.status.partial}`;
  if (countUnprocessed) countUnprocessed.textContent = `Unprocessed: ${counts.status.unprocessed}`;
  if (countSkipped) countSkipped.textContent = `Skipped: ${counts.status.skipped}`;

  // Update freshness counts
  const countCurrent = document.getElementById('countCurrent');
  const countRecent = document.getElementById('countRecent');
  const countAging = document.getElementById('countAging');
  const countOutdated = document.getElementById('countOutdated');
  const countNever = document.getElementById('countNever');

  if (countCurrent) countCurrent.textContent = `Current: ${counts.freshness.current}`;
  if (countRecent) countRecent.textContent = `Recent: ${counts.freshness.recent}`;
  if (countAging) countAging.textContent = `Aging: ${counts.freshness.aging}`;
  if (countOutdated) countOutdated.textContent = `Outdated: ${counts.freshness.outdated}`;
  if (countNever) countNever.textContent = `Never: ${counts.freshness.never}`;

  if (summaryRow) summaryRow.style.display = 'flex';
}

// =============================================================================
// Fast Pricing Mode Functions
// =============================================================================

/**
 * Check if a coin is eligible for fast pricing update
 * @param {Object} coin - The coin object with statusInfo
 * @returns {Object} - { eligible: boolean, reason?: string, numistaId?: number, issueId?: number }
 */
function checkFastPricingEligibility(coin) {
  const status = coin.statusInfo;

  if (!status) {
    return { eligible: false, reason: 'No enrichment data' };
  }

  if (!status.basicData || status.basicData.status !== 'MERGED' || !status.basicData.numistaId) {
    return { eligible: false, reason: 'Needs Numista match first' };
  }

  if (!status.issueData || !status.issueData.issueId) {
    return { eligible: false, reason: 'Needs issue selection', needsIssue: true };
  }

  return {
    eligible: true,
    numistaId: status.basicData.numistaId,
    issueId: status.issueData.issueId
  };
}

/**
 * Reset fast pricing progress state
 */
function resetFastPricingProgress() {
  AppState.fastPricingProgress = {
    running: false,
    total: 0,
    completed: 0,
    succeeded: 0,
    failed: 0,
    cancelled: false,
    uiLocked: false,
    errors: []
  };
}

/**
 * Show/hide and update the inline progress bar in the toolbar
 * @param {boolean} visible - Show or hide the progress bar
 * @param {number} completed - Number of completed items
 * @param {number} total - Total number of items
 */
function updateFpInlineProgress(visible, completed = 0, total = 0) {
  const container = document.getElementById('fpInlineProgress');
  const fill = document.getElementById('fpProgressFill');
  const text = document.getElementById('fpProgressText');

  if (!visible) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  fill.style.width = `${percent}%`;
  text.textContent = `${completed}/${total} (${percent}%)`;
}

/**
 * Enter fast pricing mode - shows checkboxes and toolbar
 */
function enterFastPricingMode() {
  AppState.fastPricingMode = true;
  AppState.fastPricingSelected.clear();
  AppState.fastPricingUpdated.clear();
  AppState.fastPricingFailed.clear();
  resetFastPricingProgress();

  document.getElementById('fastPricingToolbar').style.display = 'flex';
  document.getElementById('fastPricingBtn').classList.add('btn-active');

  renderCoinList();
  updateFastPricingCounts();
  showStatus('Select coins to update pricing', 'info');

  // Sync menu state
  updateMenuState({ fastPricingMode: true });
}

/**
 * Exit fast pricing mode - hides checkboxes and toolbar
 */
function exitFastPricingMode() {
  AppState.fastPricingMode = false;
  AppState.fastPricingSelected.clear();
  AppState.fastPricingUpdated.clear();
  AppState.fastPricingFailed.clear();

  document.getElementById('fastPricingToolbar').style.display = 'none';
  document.getElementById('fastPricingBtn').classList.remove('btn-active');

  renderCoinList();
  showStatus('');

  // Sync menu state
  updateMenuState({
    fastPricingMode: false,
    fastPricingSelectedCount: 0,
    fastPricingEligibleCount: 0
  });
}

/**
 * Update the counts displayed in the fast pricing toolbar
 */
function updateFastPricingCounts() {
  const eligibleCount = AppState.allCoins.filter(c => checkFastPricingEligibility(c).eligible).length;
  const selectedCount = AppState.fastPricingSelected.size;

  document.getElementById('fpSelectedCount').textContent = selectedCount;
  document.getElementById('fpEligibleCount').textContent = eligibleCount;
  document.getElementById('fpUpdateCount').textContent = selectedCount;
  document.getElementById('fpStartUpdate').disabled = selectedCount === 0;

  // Sync menu state with current counts
  updateMenuState({
    fastPricingSelectedCount: selectedCount,
    fastPricingEligibleCount: eligibleCount
  });
}

/**
 * Format seconds into human-readable duration
 * @param {number} seconds - Total seconds
 * @returns {string} - Formatted duration string
 */
function formatDuration(seconds) {
  if (seconds < 60) return `~${seconds} seconds`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `~${mins}m ${secs}s` : `~${mins} minutes`;
}

/**
 * Show confirmation dialog before starting batch update
 * @param {number} coinCount - Number of coins to update
 * @returns {Promise<boolean>} - True if user confirms
 */
async function confirmFastPricingUpdate(coinCount) {
  const estimatedSeconds = coinCount + Math.ceil(coinCount * 0.1);
  const estimatedTime = formatDuration(estimatedSeconds);

  const confirmed = await showModal(
    'Confirm Pricing Update',
    `<p>Ready to update pricing for <strong>${coinCount} coins</strong>.</p>
     <p><strong>Estimated time:</strong> ${estimatedTime}</p>
     <p><strong>Rate:</strong> 1 API call per second (Numista limit)</p>
     <p>A backup will be created before starting.</p>
     <p style="margin-top: 1rem;">Continue?</p>`,
    true
  );

  return confirmed;
}

/**
 * Lock/unlock UI during batch processing
 * @param {boolean} locked - True to lock, false to unlock
 */
function lockUIForBatch(locked) {
  AppState.fastPricingProgress.uiLocked = locked;

  const buttons = [
    'fastPricingBtn',
    'fpSelectAllEligible',
    'fpSelectDisplayed',
    'fpSelectNone',
    'fpStartUpdate',
    'fpExitMode',
    'closeCollectionBtn',
    'dataSettingsBtn'
  ];

  buttons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = locked;
  });

  const cancelBtn = document.getElementById('fpCancelUpdate');
  if (cancelBtn) {
    cancelBtn.style.display = locked ? 'inline-block' : 'none';
  }

  ['statusFilter', 'freshnessFilter', 'sortBy'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = locked;
  });

  const coinList = document.getElementById('coinList');
  if (coinList) {
    coinList.classList.toggle('fp-batch-running', locked);
  }
}

/**
 * Update a single coin row with success/failure indicator during batch
 * Uses row styling only (green/red border + tint) - no icon replacement
 * @param {number} coinId - The coin ID
 * @param {boolean} success - True if update succeeded
 */
function updateCoinRowStatus(coinId, success) {
  // Track which coins were updated/failed for persistent highlighting
  // (must happen before early return so coins on other pages are tracked)
  if (success) {
    AppState.fastPricingUpdated.add(coinId);
    AppState.fastPricingFailed.delete(coinId);
  } else {
    AppState.fastPricingFailed.add(coinId);
    AppState.fastPricingUpdated.delete(coinId);
  }

  // Update DOM only if coin is currently visible on this page
  const coinRow = document.querySelector(`.coin-item[data-coin-id="${coinId}"]`);
  if (!coinRow) return;

  // Hide the checkbox cell content when processed
  const checkCell = coinRow.querySelector('.fast-pricing-checkbox-cell');
  if (checkCell) {
    checkCell.innerHTML = '<span class="fp-processed-marker"></span>';
  }

  coinRow.classList.remove('fp-updated', 'fp-failed');
  coinRow.classList.add(success ? 'fp-updated' : 'fp-failed');
}

/**
 * Show completion modal with results
 * @param {boolean} wasCancelled - True if user cancelled the batch
 */
function showFpCompleteModal(wasCancelled = false) {
  const progress = AppState.fastPricingProgress;
  const remaining = AppState.fastPricingSelected.size;

  const title = wasCancelled ? 'Update Cancelled' : 'Update Complete';

  let body = `
    <p><strong>Processed:</strong> ${progress.completed} of ${progress.total}</p>
    <p class="text-success"><strong>Succeeded:</strong> ${progress.succeeded}</p>
    <p class="text-danger"><strong>Failed:</strong> ${progress.failed}</p>
  `;

  if (wasCancelled && remaining > 0) {
    body += `<p style="margin-top: 1rem;"><strong>${remaining} coins</strong> still selected - click "Update" to continue.</p>`;
  }

  if (progress.errors.length > 0) {
    body += `<div class="error-list" style="margin-top: 1rem;">
      <h4>Errors:</h4>
      <ul>${progress.errors.map(e => `<li><strong>${e.title}</strong>: ${e.error}</li>`).join('')}</ul>
    </div>`;
  }

  document.getElementById('fpCompleteModal').querySelector('.modal-header h3').textContent = title;
  document.getElementById('fpCompleteModal').querySelector('.modal-body').innerHTML = body;
  document.getElementById('fpCompleteModal').style.display = 'flex';
}

/**
 * Start the fast pricing batch update process
 */
async function startFastPricingUpdate() {
  const coins = Array.from(AppState.fastPricingSelected)
    .map(id => AppState.allCoins.find(c => c.id === id))
    .filter(c => c && checkFastPricingEligibility(c).eligible);

  if (coins.length === 0) return;

  const confirmed = await confirmFastPricingUpdate(coins.length);
  if (!confirmed) return;

  showStatus('Creating backup...', 'info');
  const backupResult = await window.electronAPI.createBackupBeforeBatch();
  if (!backupResult.success && !backupResult.skipped) {
    const proceed = await showModal(
      'Backup Failed',
      `<p>Could not create backup: ${backupResult.error}</p>
       <p>Continue anyway without backup?</p>`,
      true
    );
    if (!proceed) return;
  }

  resetFastPricingProgress();
  AppState.fastPricingProgress.running = true;
  AppState.fastPricingProgress.total = coins.length;

  lockUIForBatch(true);
  updateFpInlineProgress(true, 0, coins.length);

  for (let i = 0; i < coins.length; i++) {
    if (AppState.fastPricingProgress.cancelled) break;

    const coin = coins[i];

    const statusText = `Updating: ${AppState.fastPricingProgress.succeeded} updated, ${AppState.fastPricingProgress.failed} failed`;
    showStatus(statusText);
    updateFpInlineProgress(true, i, coins.length);

    let success = false;
    try {
      const elig = checkFastPricingEligibility(coin);
      const result = await window.electronAPI.fastPricingUpdate({
        coinId: coin.id,
        numistaId: elig.numistaId,
        issueId: elig.issueId
      });

      if (result.success) {
        success = true;
        AppState.fastPricingProgress.succeeded++;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      AppState.fastPricingProgress.failed++;
      AppState.fastPricingProgress.errors.push({
        coinId: coin.id, title: coin.title, error: err.message
      });
    }

    AppState.fastPricingProgress.completed++;

    updateCoinRowStatus(coin.id, success);

    // Update inline progress bar after each coin
    updateFpInlineProgress(true, i + 1, coins.length);
    showStatus(`Updating: ${AppState.fastPricingProgress.succeeded} updated, ${AppState.fastPricingProgress.failed} failed`);

    if (success) {
      AppState.fastPricingSelected.delete(coin.id);
    }

    updateFastPricingCounts();

    if (i < coins.length - 1 && !AppState.fastPricingProgress.cancelled) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  AppState.fastPricingProgress.running = false;
  lockUIForBatch(false);
  updateFpInlineProgress(true, coins.length, coins.length);  // Show 100% briefly

  showFpCompleteModal(AppState.fastPricingProgress.cancelled);
  updateFpInlineProgress(false);  // Hide after modal

  await loadCoins();
  renderCoinList();
}

// Build a display label from structured fields when coin.title is empty
function buildCoinDisplayLabel(coin) {
  if (!coin.value && !coin.unit) return null;
  const parts = [];
  if (coin.value) parts.push(coin.value);
  if (coin.unit) parts.push(coin.unit);
  return parts.join(' ') || null;
}

function renderCoinList() {
  const coinList = document.getElementById('coinList');
  coinList.innerHTML = '';

  if (AppState.coins.length === 0) {
    coinList.innerHTML = '<div class="text-center">No coins in collection</div>';
    return;
  }

  AppState.coins.forEach(coin => {
    const coinItem = document.createElement('div');
    coinItem.className = 'coin-item';

    // Add status class for styling
    const status = coin.status || 'PENDING';
    if (status === 'MERGED') {
      coinItem.classList.add('coin-merged');
    } else if (status === 'SKIPPED') {
      coinItem.classList.add('coin-skipped');
    } else if (status === 'ERROR') {
      coinItem.classList.add('coin-error');
    }

    coinItem.dataset.coinId = coin.id;

    // Add checkbox cell when in fast pricing mode
    if (AppState.fastPricingMode) {
      const checkCell = document.createElement('div');
      checkCell.className = 'fast-pricing-checkbox-cell';

      // Check if coin was already processed this session
      const wasUpdated = AppState.fastPricingUpdated.has(coin.id);
      const wasFailed = AppState.fastPricingFailed.has(coin.id);

      if (wasUpdated || wasFailed) {
        // Show processed marker and apply highlighting
        const marker = document.createElement('span');
        marker.className = 'fp-processed-marker';
        checkCell.appendChild(marker);
        coinItem.classList.add(wasUpdated ? 'fp-updated' : 'fp-failed');
      } else {
        const elig = checkFastPricingEligibility(coin);
        if (elig.eligible) {
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.className = 'fast-pricing-checkbox';
          cb.checked = AppState.fastPricingSelected.has(coin.id);
          cb.addEventListener('change', (e) => {
            e.target.checked ? AppState.fastPricingSelected.add(coin.id)
                             : AppState.fastPricingSelected.delete(coin.id);
            updateFastPricingCounts();
          });
          cb.addEventListener('click', (e) => e.stopPropagation());
          checkCell.appendChild(cb);
        } else {
          const dash = document.createElement('span');
          dash.className = 'fast-pricing-ineligible';
          dash.textContent = '-';
          dash.title = elig.reason;
          checkCell.appendChild(dash);
          coinItem.classList.add('fp-ineligible');
        }
      }
      coinItem.insertBefore(checkCell, coinItem.firstChild);
    }

    // Add image thumbnails
    const coinImages = document.createElement('div');
    coinImages.className = 'coin-images';

    const obverseImg = document.createElement('img');
    obverseImg.className = 'coin-thumbnail';
    obverseImg.alt = 'OBV';
    obverseImg.title = 'Obverse';
    obverseImg.dataset.side = 'obverse';
    obverseImg.dataset.coinId = coin.id;

    const reverseImg = document.createElement('img');
    reverseImg.className = 'coin-thumbnail';
    reverseImg.alt = 'REV';
    reverseImg.title = 'Reverse';
    reverseImg.dataset.side = 'reverse';
    reverseImg.dataset.coinId = coin.id;

    // Set placeholder initially
    obverseImg.src = getImagePlaceholder('obverse');
    reverseImg.src = getImagePlaceholder('reverse');

    coinImages.appendChild(obverseImg);
    coinImages.appendChild(reverseImg);

    const info = document.createElement('div');
    info.className = 'coin-info';

    const title = document.createElement('div');
    title.className = 'coin-title';
    title.textContent = coin.title || buildCoinDisplayLabel(coin) || '(Untitled)';

    const details = document.createElement('div');
    details.className = 'coin-details';
    const detailParts = [];
    if (coin.country) detailParts.push(coin.country);
    if (coin.year) detailParts.push(coin.year);
    details.textContent = detailParts.join(' | ');

    info.appendChild(title);
    info.appendChild(details);

    // Three-icon data type display (Basic, Issue, Pricing)
    const dataTypeIcons = document.createElement('div');
    dataTypeIcons.className = 'coin-data-icons';
    dataTypeIcons.innerHTML = getDataTypeIcons(coin);

    coinItem.appendChild(coinImages);
    coinItem.appendChild(info);
    coinItem.appendChild(dataTypeIcons);

    coinItem.addEventListener('click', () => handleCoinClick(coin));

    coinList.appendChild(coinItem);
  });

  // Load images for visible coins (lazy loading)
  loadCoinImages();
}

/**
 * Generate SVG placeholder image for coins
 * @param {string} type - 'obverse', 'reverse', or 'edge'
 * @returns {string} - Data URI for SVG placeholder
 */
function getImagePlaceholder(type) {
  const textMap = { obverse: 'OBV', reverse: 'REV', edge: 'EDGE' };
  const text = textMap[type] || type.toUpperCase().slice(0, 4);
  const color = '#6c757d';
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" fill="${color}"/>
      <text x="20" y="20" font-family="Arial" font-size="10" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${text}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Load images for all coins currently displayed in the list
 */
async function loadCoinImages() {
  const thumbnails = document.querySelectorAll('.coin-thumbnail');

  for (const img of thumbnails) {
    const coinId = parseInt(img.dataset.coinId);
    const side = img.dataset.side;

    // Skip if already loaded
    if (img.dataset.loaded === 'true') {
      continue;
    }

    try {
      const result = await window.electronAPI.getCoinImages(coinId);

      if (result.success && result.images) {
        if (side === 'obverse' && result.images.obverse) {
          img.src = result.images.obverse;
          img.dataset.loaded = 'true';
        } else if (side === 'reverse' && result.images.reverse) {
          img.src = result.images.reverse;
          img.dataset.loaded = 'true';
        }
        // If no image data, keep the placeholder
      }
    } catch (error) {
      console.error(`Error loading image for coin ${coinId}:`, error);
      // Keep placeholder on error
    }
  }
}

function getStatusIcon(status) {
  const icons = {
    'MERGED': UI_STRINGS.ICON_CHECK,
    'SKIPPED': UI_STRINGS.ICON_NO_ENTRY,
    'ERROR': UI_STRINGS.ICON_CROSS,
    'MATCHED': UI_STRINGS.ICON_SEARCH,
    'SEARCHED': UI_STRINGS.ICON_SEARCH_ALT,
    'PENDING': UI_STRINGS.ICON_HOURGLASS
  };
  return icons[status] || UI_STRINGS.ICON_RECORD;
}

function getStatusText(status) {
  const labels = {
    'MERGED': 'Done',
    'SKIPPED': 'Skipped',
    'ERROR': 'Error',
    'MATCHED': 'Matched',
    'SEARCHED': 'Searched',
    'PENDING': 'Pending'
  };
  return labels[status] || 'Pending';
}

/**
 * Get three data type icons for a coin
 * Returns HTML with icons for basicData, issueData, and pricingData
 * 
 * @param {Object} coin - Coin object with statusInfo
 * @returns {string} - HTML string with three icons
 */
function getDataTypeIcons(coin) {
  const statusInfo = coin.statusInfo;

  // Default icons if no statusInfo
  if (!statusInfo) {
    return '<span class="data-icons">' +
      '<span class="data-icon" title="Basic: Pending">' + UI_STRINGS.ICON_HOURGLASS + '</span>' +
      '<span class="data-icon" title="Issue: Pending">' + UI_STRINGS.ICON_HOURGLASS + '</span>' +
      '<span class="data-icon" title="Pricing: Pending">' + UI_STRINGS.ICON_HOURGLASS + '</span>' +
    '</span>';
  }

  // Get icon for each data type
  const basicIcon = getDataTypeIcon(statusInfo.basicData, 'Basic');
  const issueIcon = getDataTypeIcon(statusInfo.issueData, 'Issue');
  const pricingIcon = getPricingIcon(statusInfo.pricingData);

  return '<span class="data-icons">' + basicIcon + issueIcon + pricingIcon + '</span>';
}

/**
 * Get icon for a single data type status
 * 
 * @param {Object} dataStatus - Status object with .status field
 * @param {string} label - Label for tooltip
 * @returns {string} - HTML span with icon
 */
function getDataTypeIcon(dataStatus, label) {
  const status = dataStatus?.status || 'NOT_QUERIED';
  
  const iconMap = {
    'MERGED': { icon: UI_STRINGS.ICON_CHECK, title: label + ': Merged' },
    'NOT_QUERIED': { icon: UI_STRINGS.ICON_CIRCLE_WHITE, title: label + ': Not requested' },
    'PENDING': { icon: UI_STRINGS.ICON_HOURGLASS, title: label + ': Pending' },
    'ERROR': { icon: UI_STRINGS.ICON_CROSS, title: label + ': Error' },
    'NO_MATCH': { icon: UI_STRINGS.ICON_QUESTION, title: label + ': No match found' },
    'NO_DATA': { icon: UI_STRINGS.ICON_MAILBOX_EMPTY, title: label + ': No data available' },
    'SKIPPED': { icon: UI_STRINGS.ICON_NO_ENTRY, title: label + ': Skipped' }
  };
  
  const iconInfo = iconMap[status] || { icon: UI_STRINGS.ICON_CIRCLE_WHITE, title: label + ': Unknown' };
  return '<span class="data-icon" title="' + iconInfo.title + '">' + iconInfo.icon + '</span>';
}

/**
 * Get icon for pricing with freshness color
 * 
 * @param {Object} pricingStatus - Pricing status object with .status and .timestamp
 * @returns {string} - HTML span with colored icon
 */
function getPricingIcon(pricingStatus) {
  const status = pricingStatus?.status || 'NOT_QUERIED';
  
  // If not merged, use standard icons
  if (status !== 'MERGED') {
    const iconMap = {
      'NOT_QUERIED': { icon: UI_STRINGS.ICON_CIRCLE_WHITE, title: 'Pricing: Not requested' },
      'PENDING': { icon: UI_STRINGS.ICON_HOURGLASS, title: 'Pricing: Pending' },
      'ERROR': { icon: UI_STRINGS.ICON_CROSS, title: 'Pricing: Error' },
      'NO_DATA': { icon: UI_STRINGS.ICON_MAILBOX_EMPTY, title: 'Pricing: No data available' },
      'SKIPPED': { icon: UI_STRINGS.ICON_NO_ENTRY, title: 'Pricing: Skipped' }
    };
    const iconInfo = iconMap[status] || { icon: UI_STRINGS.ICON_CIRCLE_WHITE, title: 'Pricing: Unknown' };
    return '<span class="data-icon" title="' + iconInfo.title + '">' + iconInfo.icon + '</span>';
  }
  
  // For merged pricing, show freshness-colored icon
  const timestamp = pricingStatus?.timestamp;
  const freshness = calculatePricingFreshness(timestamp);
  
  return '<span class="data-icon pricing-' + freshness.status.toLowerCase() + '" title="Pricing: ' + freshness.text + '">' + 
    freshness.icon + '</span>';
}

/**
 * Calculate pricing freshness from timestamp
 * Mirrors freshness-calculator.js logic for frontend use
 * 
 * @param {string|null} timestamp - ISO timestamp
 * @returns {Object} - { status, icon, text }
 */
function calculatePricingFreshness(timestamp) {
  if (!timestamp) {
    return { status: 'NEVER', icon: UI_STRINGS.ICON_CIRCLE_WHITE, text: 'Never updated' };
  }
  
  try {
    const pricingDate = new Date(timestamp);
    const now = new Date();
    const ageMs = now - pricingDate;
    const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30.44);
    const ageYears = ageMonths / 12;
    
    if (ageMonths < 3) {
      return { status: 'CURRENT', icon: UI_STRINGS.ICON_CIRCLE_GREEN, text: 'Current (< 3 months)' };
    }
    if (ageYears < 1) {
      return { status: 'RECENT', icon: UI_STRINGS.ICON_CIRCLE_YELLOW, text: 'Recent (' + Math.round(ageMonths) + ' months)' };
    }
    if (ageYears < 2) {
      return { status: 'AGING', icon: UI_STRINGS.ICON_CIRCLE_ORANGE, text: 'Aging (' + ageYears.toFixed(1) + ' years)' };
    }
    return { status: 'OUTDATED', icon: UI_STRINGS.ICON_CIRCLE_RED, text: 'Outdated (' + Math.round(ageYears) + ' years)' };
  } catch (e) {
    return { status: 'NEVER', icon: UI_STRINGS.ICON_CIRCLE_WHITE, text: 'Unknown' };
  }
}


async function handleCoinClick(coin) {
  AppState.currentCoin = coin;

  // Save scroll position before leaving collection screen
  const mainContent = document.querySelector('.app-main');
  if (mainContent) {
    AppState.collectionScrollPosition = mainContent.scrollTop;
  }

  showStatus(`Searching for ${coin.title || 'coin'}...`);
  showScreen('match');
  
  // Show current coin info
  renderCurrentCoinInfo();
  
  // Perform search
  await searchForMatches();
}

async function renderCurrentCoinInfo() {
  const info = document.getElementById('currentCoinInfo');
  const coin = AppState.currentCoin;

  // Create container with images and text
  const container = document.createElement('div');
  container.className = 'current-coin-container';

  // User's coin images
  const imagesDiv = document.createElement('div');
  imagesDiv.className = 'current-coin-images';

  try {
    const result = await window.electronAPI.getCoinImages(coin.id);
    if (result.success && result.images) {
      // Obverse image
      const obverseImg = document.createElement('img');
      obverseImg.className = 'current-coin-image';
      obverseImg.src = result.images.obverse || getImagePlaceholder('obverse');
      obverseImg.alt = 'Your obverse';
      attachLightbox(obverseImg, 'Your obverse');

      // Reverse image
      const reverseImg = document.createElement('img');
      reverseImg.className = 'current-coin-image';
      reverseImg.src = result.images.reverse || getImagePlaceholder('reverse');
      reverseImg.alt = 'Your reverse';
      attachLightbox(reverseImg, 'Your reverse');

      imagesDiv.appendChild(obverseImg);
      imagesDiv.appendChild(reverseImg);
    } else {
      // Show placeholders if no images
      imagesDiv.innerHTML = `
        <img class="current-coin-image" src="${getImagePlaceholder('obverse')}" alt="No obverse" title="No image available">
        <img class="current-coin-image" src="${getImagePlaceholder('reverse')}" alt="No reverse" title="No image available">
      `;
    }
  } catch (error) {
    console.error('Error loading current coin images:', error);
    imagesDiv.innerHTML = `
      <img class="current-coin-image" src="${getImagePlaceholder('obverse')}" alt="Error" title="Error loading image">
      <img class="current-coin-image" src="${getImagePlaceholder('reverse')}" alt="Error" title="Error loading image">
    `;
  }

  // Coin details text
  const textDiv = document.createElement('div');
  textDiv.className = 'current-coin-text';
  textDiv.innerHTML = `
    <div><strong>${coin.title || '(Untitled)'}</strong></div>
    <div>${coin.country || ''} ${coin.year || ''} ${coin.value || ''} ${coin.unit || ''}</div>
  `;

  container.appendChild(imagesDiv);
  container.appendChild(textDiv);

  info.innerHTML = '';
  info.appendChild(container);
}

// =============================================================================
// Numista Search
// =============================================================================

/**
 * Strip parenthetical content from a query string.
 * E.g., "Germany (Nazi) 50 Reichspfennig" -> "Germany 50 Reichspfennig"
 * @param {string} query - Original query string
 * @returns {string} Query with parenthetical content removed
 */
/**
 * Normalize a denomination unit string for use in Numista search queries,
 * since Numista is strict about "1 Centavo" vs "50 Centavos" and about
 * language-specific forms (e.g., Italian "centesimi" vs Spanish "centésimos").
 * When an issuer code is provided, checks issuer-denomination-overrides.json
 * for a country-specific form before falling back to the denomination-aliases.json default.
 * @param {string} unit - Raw unit string from coin data
 * @param {number|null} value - Numeric denomination value (1 = singular, >1 = plural)
 * @param {string|null} [issuerCode] - Resolved Numista issuer code (optional)
 * @returns {string} Normalized unit suitable for API search queries
 */
function normalizeUnitForSearch(unit, value, issuerCode) {
  if (!unit) return unit;
  const canonical = window.stringSimilarity.normalizeUnit(unit);
  if (!canonical) return unit;
  const numValue = parseFloat(value);
  // Issuer-specific override takes priority over denomination-aliases.json default
  if (issuerCode) {
    const overrideEntry = (window.stringSimilarity.issuerOverrides[canonical] || {})[issuerCode];
    if (overrideEntry) {
      if (!isNaN(numValue)) {
        return numValue === 1 ? overrideEntry.singular : overrideEntry.plural;
      }
      return overrideEntry.singular; // no numeric value → use singular as safest default
    }
  }
  // Default path — use denomination-aliases.json plural
  if (!isNaN(numValue)) {
    return window.stringSimilarity.getSearchForm(canonical, numValue);
  }
  // No numeric value available - return canonical (singular) as safest default
  return canonical;
}

/**
 * Normalize denomination terms in a free-text search query.
 * Finds patterns like "1 centavos" or "50 centavo" and corrects the plurality.
 * @param {string} queryText - Raw search query
 * @returns {string} Query with corrected denomination singular/plural forms
 */
function normalizeDenominationInQuery(queryText) {
  if (!queryText) return queryText;
  return queryText.replace(/(\d+\.?\d*)\s+([\p{L}]+)/gu, (match, numStr, word) => {
    const canonical = window.stringSimilarity.normalizeUnit(word);
    if (!canonical) return match;
    // getSearchForm returns canonical as-is for unknown denominations (no plural in map)
    const numValue = parseFloat(numStr);
    const correctedUnit = window.stringSimilarity.getSearchForm(canonical, numValue);
    return `${numStr} ${correctedUnit}`;
  });
}

function stripParenthetical(query) {
  return query.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}


// Fetch all pages for a search query, updating status as pages load.
// Returns the complete array of types across all pages.
async function fetchAllSearchPages(searchFn, firstResult, statusPrefix) {
  const allTypes = [...(firstResult.results.types || [])];
  const totalCount = firstResult.results.count || allTypes.length;

  if (allTypes.length >= totalCount) return allTypes;

  // Calculate remaining pages (API max is 50 per page)
  const perPage = allTypes.length; // first page size
  const totalPages = Math.ceil(totalCount / perPage);

  for (let page = 2; page <= totalPages; page++) {
    document.getElementById('searchStatus').textContent =
      `${statusPrefix} (loading page ${page} of ${totalPages}...)`;

    const pageResult = await searchFn(page);
    if (pageResult.success && pageResult.results.types?.length > 0) {
      allTypes.push(...pageResult.results.types);
    } else {
      break; // No more results or error
    }
  }

  return allTypes;
}

async function searchForMatches() {
  try {
    showStatus('Searching Numista...');
    document.getElementById('searchStatus').textContent = 'Searching...';
    AppState.currentMatches = [];

    const coin = AppState.currentCoin;
    let searchAttempt = 1;
    let result;
    let usedFallback = false;

    // Build initial search parameters
    const baseParams = await buildSearchParams(coin);
    console.log('=== AUTOMATIC SEARCH ===');
    console.log('Current coin:', JSON.stringify({ title: coin.title, country: coin.country, value: coin.value, unit: coin.unit, year: coin.year, category: coin.category }));
    console.log('Search params (attempt 1):', JSON.stringify(baseParams));

    // Strategy 1: Full query as-is
    result = await window.electronAPI.searchNumista(baseParams);
    if (!result.success) throw new Error(result.error);
    if ((result.results.types || []).length > 0) {
      AppState.currentMatches = await fetchAllSearchPages(
        (page) => window.electronAPI.searchNumista({ ...baseParams, page }),
        result, 'Searching'
      );
    }

    // Strategy 2: Alternate denomination forms (e.g., "heller" vs "haléřů")
    // Keeps issuer filter — only the denomination spelling is varied.
    // When a denomination has cross-referenced entries, try each alternate search form.
    if (AppState.currentMatches.length === 0 && coin.unit) {
      const altForms = window.stringSimilarity.getAlternateSearchForms(coin.unit, parseFloat(coin.value) || 0);
      if (altForms.length > 0) {
        // The primary form was already tried; filter it out
        const primaryForm = normalizeUnitForSearch(coin.unit, coin.value, baseParams.issuer);
        const newForms = altForms.filter(f => f !== primaryForm);
        for (const altForm of newForms) {
          if (AppState.currentMatches.length > 0) break;
          const altQuery = (coin.value && !/^\d+\/\d+\s/.test(altForm)) ? `${asciiToUnicodeFraction(coin.value.toString())} ${altForm}` : altForm;
          searchAttempt++;
          console.log(`Search attempt ${searchAttempt}: Alternate denomination -> "${altQuery}"`);
          document.getElementById('searchStatus').textContent = `Trying alternate denomination (${altForm})...`;

          const altParams = { ...baseParams, q: altQuery };
          result = await window.electronAPI.searchNumista(altParams);
          if (result.success && (result.results.types || []).length > 0) {
            AppState.currentMatches = await fetchAllSearchPages(
              (page) => window.electronAPI.searchNumista({ ...altParams, page }),
              result, `Trying alternate (${altForm})`
            );
            usedFallback = true;
          }
        }
      }
    }

    // Strategy 3: No-issuer fallback — country name moves into q, issuer param dropped.
    // Handles coins whose OpenNumismat country label resolves to a modern issuer code that
    // doesn't cover historical sub-issuers (e.g. "South Africa" → afrique_du_sud misses
    // pre-Union ZAR coins cataloged under "South African Republic"). Mirrors the Numista
    // website's own full-text search which finds coins regardless of issuer hierarchy.
    // date and category are kept for precision; issuer is the only param removed.
    if (AppState.currentMatches.length === 0) {
      const country = coin.country ? stripParenthetical(coin.country.trim()) : null;
      const denomPart = (() => {
        if (coin.value && coin.unit) {
          const normUnit = normalizeUnitForSearch(coin.unit, coin.value, baseParams.issuer);
          return /^\d+\/\d+\s/.test(normUnit) ? normUnit : `${asciiToUnicodeFraction(coin.value.toString())} ${normUnit}`;
        }
        return coin.value?.toString() || (coin.unit ? normalizeUnitForSearch(coin.unit, null, baseParams.issuer) : null);
      })();
      const noIssuerQuery = [country, denomPart].filter(Boolean).join(' ');

      if (noIssuerQuery) {
        searchAttempt++;
        console.log(`Search attempt ${searchAttempt}: No-issuer fallback -> "${noIssuerQuery}"`);
        document.getElementById('searchStatus').textContent = 'Trying broader issuer search...';

        const noIssuerParams = { ...baseParams, q: noIssuerQuery };
        delete noIssuerParams.issuer;
        result = await window.electronAPI.searchNumista(noIssuerParams);
        if (result.success && (result.results.types || []).length > 0) {
          AppState.currentMatches = await fetchAllSearchPages(
            (page) => window.electronAPI.searchNumista({ ...noIssuerParams, page }),
            result, 'Trying broader issuer search'
          );
          usedFallback = true;
        }
      }
    }

    // Update status based on results
    if (AppState.currentMatches.length === 0) {
      document.getElementById('searchStatus').textContent = 'No matches found';
      showStatus('No matches found');

      // Update progress to no_matches
      await window.electronAPI.updateCoinStatus({
        coinId: coin.id,
        status: 'no_matches',
        metadata: {}
      });

    } else {
      const fallbackNote = usedFallback ? ' (via fallback)' : '';
      document.getElementById('searchStatus').textContent =
        `Found ${AppState.currentMatches.length} potential matches${fallbackNote}`;
      showStatus(`Found ${AppState.currentMatches.length} matches${fallbackNote}`);
    }

    renderMatches();

    // Refresh session counter after search
    await refreshSessionCounter();

  } catch (error) {
    showStatus(`Error searching: ${error.message}`, 'error');
    document.getElementById('searchStatus').textContent =
      `Error: ${error.message}`;
  }
}

// Category mapping from OpenNumismat values to Numista API values
const CATEGORY_MAP = {
  'coin': 'coin',
  'coins': 'coin',
  'banknote': 'banknote',
  'banknotes': 'banknote',
  'token': 'exonumia',
  'tokens': 'exonumia',
  'medal': 'exonumia',
  'medals': 'exonumia',
  'exonumia': 'exonumia'
};

/**
 * Resolve the category to send to Numista API.
 * @param {string} settingValue - 'all', 'default', 'coin', 'banknote', 'exonumia'
 * @param {Object} coin - The coin object (used when settingValue is 'default')
 * @returns {string|null} - Numista category value or null for no filter
 */
function resolveSearchCategory(settingValue, coin) {
  if (!settingValue || settingValue === 'all') {
    return null;
  }
  if (settingValue === 'default') {
    // Use the coin's own category from OpenNumismat
    const coinCategory = (coin.category || '').trim().toLowerCase();
    return CATEGORY_MAP[coinCategory] || null;
  }
  // Direct value: 'coin', 'banknote', 'exonumia'
  return settingValue;
}

async function buildSearchParams(coin) {
  const params = {};

  // 1. Resolve issuer FIRST — needed for denomination form selection.
  // Country-specific denominations (e.g., Italian "centesimi" vs Spanish "centésimos")
  // require knowing the issuer before we can choose the right plural form.
  let issuerCode = null;
  if (coin.country && coin.country.trim()) {
    try {
      const cleanCountry = stripParenthetical(coin.country.trim());
      const issuerResult = await window.electronAPI.resolveIssuer(cleanCountry);
      if (issuerResult.success && issuerResult.code) {
        issuerCode = issuerResult.code;
        params.issuer = issuerCode;
        console.log(`Resolved issuer for "${coin.country}": ${issuerCode}`);
      }
    } catch (error) {
      console.warn('Issuer resolution failed (non-fatal):', error.message);
    }
  }

  // 2. Build search query preferring structured fields over raw title.
  // Structured fields (value, unit) produce normalized denomination forms
  // that match Numista's expected singular/plural (e.g., "1 crown" not "1 Crowns").
  // Country name is NOT included in query text — the issuer parameter handles filtering.
  let query = '';
  let usedStructuredDenom = false;

  // Prefer structured denomination fields
  if (coin.value) {
    const normalizedUnit = coin.unit ? normalizeUnitForSearch(coin.unit, coin.value, issuerCode) : null;
    // If the unit already encodes the fraction face value (e.g., "1/80 rial"), don't prepend
    // coin.value — that would produce "1 1/80 rial" instead of the correct "1/80 rial".
    const unitIsFraction = normalizedUnit && /^\d+\/\d+\s/.test(normalizedUnit);
    // Convert ASCII fraction to Unicode so Numista API matches coin titles that use
    // Unicode fraction characters (e.g., "1/80" → "⅟₈₀" to match "⅟₈₀ Riyal - Yahya")
    const queryValue = asciiToUnicodeFraction(coin.value.toString());
    query = normalizedUnit
      ? (unitIsFraction ? normalizedUnit : `${queryValue} ${normalizedUnit}`)
      : queryValue;
    usedStructuredDenom = true;
  }

  // Fallback to title only when no structured denomination available
  if (!usedStructuredDenom && coin.title && coin.title.trim()) {
    let titleQuery = stripParenthetical(coin.title.trim());
    // Strip country name from title (issuer parameter handles country filtering)
    if (coin.country) {
      const country = stripParenthetical(coin.country.trim());
      titleQuery = titleQuery.replace(new RegExp(country, 'i'), '').replace(/\s+/g, ' ').trim();
    }
    // Normalize denomination plurals (e.g., "Crowns" -> "Crown")
    titleQuery = normalizeDenominationInQuery(titleQuery);
    if (titleQuery) {
      query = query ? `${query} ${titleQuery}` : titleQuery;
    }
  }

  if (query) {
    params.q = query.trim();
  }

  // Pass year as dedicated date parameter — Numista filters types by issue date range.
  // Do NOT include year in q text: type names ("100 Pesetas - Juan Carlos I") don't
  // contain years, so putting "1981" in q returns 0 results.
  if (coin.year && !isNaN(coin.year)) {
    params.date = coin.year.toString();
  }

  params.page = 1;
  // count omitted — searchTypes() defaults to 50 to maximize result coverage

  // Add category filter from settings
  const categorySetting = AppState.fetchSettings?.searchCategory || 'all';
  const category = resolveSearchCategory(categorySetting, coin);
  if (category) {
    params.category = category;
  }

  return params;
}

function renderMatches() {
  const matchResults = document.getElementById('matchResults');
  matchResults.innerHTML = '';

  if (AppState.currentMatches.length === 0) {
    matchResults.innerHTML = `
      <div class="text-center">
        <p>No matches found. Try searching again with different parameters.</p>
      </div>
    `;
    return;
  }

  // Sort matches by confidence score (high to low)
  const sortedMatches = AppState.currentMatches
    .map((match, originalIndex) => ({
      match,
      originalIndex,
      confidence: calculateConfidence(AppState.currentCoin, match)
    }))
    .sort((a, b) => b.confidence - a.confidence);

  sortedMatches.forEach(({ match, originalIndex, confidence: confidenceScore }, index) => {
    const matchCard = document.createElement('div');
    matchCard.className = 'match-card';
    matchCard.dataset.matchIndex = originalIndex;

    // Thumbnails (obverse and reverse)
    const thumbnailsContainer = document.createElement('div');
    thumbnailsContainer.className = 'match-thumbnails';

    const obverseImg = document.createElement('img');
    obverseImg.className = 'match-thumbnail';
    obverseImg.src = match.obverse_thumbnail || getImagePlaceholder('obverse');
    obverseImg.alt = 'Obverse';
    attachLightbox(obverseImg, 'Obverse');

    const reverseImg = document.createElement('img');
    reverseImg.className = 'match-thumbnail';
    reverseImg.src = match.reverse_thumbnail || getImagePlaceholder('reverse');
    reverseImg.alt = 'Reverse';
    attachLightbox(reverseImg, 'Reverse');

    thumbnailsContainer.appendChild(obverseImg);
    thumbnailsContainer.appendChild(reverseImg);

    // Info
    const info = document.createElement('div');
    info.className = 'match-info';

    const title = document.createElement('div');
    title.className = 'match-title';
    title.textContent = match.title || 'Untitled';

    const details = document.createElement('div');
    details.className = 'match-details';
    const categoryName = match.object_type?.name || match.category || 'N/A';
    details.innerHTML = `
      <div><strong>Issuer:</strong> ${match.issuer?.name || 'N/A'}</div>
      <div><strong>Year:</strong> ${match.min_year || 'N/A'}${match.max_year && match.max_year !== match.min_year ? '-' + match.max_year : ''}</div>
      <div><strong>Category:</strong> ${categoryName}</div>
      <div><strong>Numista ID:</strong> ${match.id || 'N/A'}</div>
    `;

    const confidence = document.createElement('div');
    confidence.className = 'match-confidence';
    const confidenceClass = confidenceScore >= 70 ? 'high' : confidenceScore >= 40 ? 'medium' : 'low';
    confidence.innerHTML = `
      <span class="confidence-badge confidence-${confidenceClass}">
        ${confidenceScore}% match
      </span>
    `;

    info.appendChild(title);
    info.appendChild(details);
    info.appendChild(confidence);

    matchCard.appendChild(thumbnailsContainer);
    matchCard.appendChild(info);

    matchCard.addEventListener('click', () => handleMatchSelection(originalIndex));

    matchResults.appendChild(matchCard);
  });
}

// Unicode fraction to numeric value mapping for Numista title parsing
const UNICODE_FRACTIONS = {
  '½': 0.5, '¼': 0.25, '¾': 0.75,
  '⅓': 1/3, '⅔': 2/3,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 1/6, '⅚': 5/6,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875
};

/**
 * Convert an ASCII fraction string (e.g., "1/80") to its Unicode equivalent
 * for use in Numista API search queries.  Numista stores coin titles using
 * Unicode fraction characters; sending an ASCII slash causes the API to miss
 * coins whose titles use Unicode fraction notation.
 *
 * Standard vulgar fractions map to precomposed Unicode characters (½, ¼, …).
 * Non-standard fractions with numerator 1 use FRACTION NUMERATOR ONE (U+215F)
 * + subscript denominator digits (e.g., "1/80" → "⅟₈₀"), matching Numista's
 * own representation of Yahya-era Yemeni 1/80 Riyal coins.
 * Other non-standard fractions fall back to FRACTION SLASH (U+2044) notation.
 *
 * @param {string|null} valueStr - ASCII fraction string (e.g., "1/80") or plain numeric string
 * @returns {string|null} Unicode fraction string, or original string if not a fraction
 */
function asciiToUnicodeFraction(valueStr) {
  if (!valueStr || typeof valueStr !== 'string') return valueStr;
  const VULGAR = {
    '1/2': '½', '1/3': '⅓', '2/3': '⅔',
    '1/4': '¼', '3/4': '¾',
    '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘',
    '1/6': '⅙', '5/6': '⅚',
    '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞'
  };
  if (VULGAR[valueStr]) return VULGAR[valueStr];
  const m = valueStr.match(/^(\d+)\/(\d+)$/);
  if (!m) return valueStr;
  // Numerator 1: use ⅟ (U+215F) + subscript denominator digits
  if (m[1] === '1') {
    const SUBS = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
                   '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
    return '\u215F' + m[2].split('').map(d => SUBS[d] || d).join('');
  }
  // Other non-standard fractions: FRACTION SLASH (U+2044) notation
  return m[1] + '\u2044' + m[2];
}

// Character class matching digits, dots, and Unicode fractions — used in denomination extraction
const DENOM_NUM_CHARS = '[\\d.½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]';

// ASCII fraction pattern: "1/2", "3/4", etc. as a prefix in unit strings
const ASCII_FRACTION_RE = /^(\d+)\/(\d+)\s+(.+)$/;

// US colloquial denominations — maps Numista denom name to equivalent cent value
// Used to equate "1 Dime" (Numista) with "10 Cents" (OpenNumismat) for US coins
const US_DENOM_CENT_VALUES = {
  'dime': 10,
  'nickel': 5,
  'quarter': 25,
  'half dollar': 50
};

/**
 * Extract a leading ASCII fraction from a unit string (e.g., "1/2 franc") and
 * apply it as a multiplier to the coin value.  Returns adjusted value and unit.
 * Handles denominations stored as value=1, unit="1/2 Franc" in OpenNumismat.
 * @param {string|null} unit - Raw coin unit string
 * @param {number|null} value - Coin face value
 * @returns {{adjValue: number|null, adjUnit: string|null}}
 */
function extractUnitFraction(unit, value) {
  if (!unit) return { adjValue: value, adjUnit: unit };
  const m = unit.match(ASCII_FRACTION_RE);
  if (m) {
    const frac = parseInt(m[1]) / parseInt(m[2]);
    return { adjValue: value != null ? value * frac : frac, adjUnit: m[3] };
  }
  return { adjValue: value, adjUnit: unit };
}

function parseNumericValue(str) {
  if (str == null) return null;
  if (typeof str !== 'string') str = String(str);
  if (!str) return null;
  for (const [frac, val] of Object.entries(UNICODE_FRACTIONS)) {
    if (str.includes(frac)) {
      const prefix = str.replace(frac, '').trim();
      const result = (prefix ? parseFloat(prefix) : 0) + val;
      return isNaN(result) ? null : result;
    }
  }
  // Handle mixed numbers: "2 1/2" or "21/2" (no space) → 2.5
  // Non-greedy first group ensures "21/2" splits as 2 + 1/2, not 21/2
  const mixedMatch = str.match(/^(\d+?)\s*(\d+)\/(\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]);
  }
  // Handle pure ASCII fractions like "1/2", "3/4"
  const asciiMatch = str.match(/^(\d+)\/(\d+)$/);
  if (asciiMatch) {
    return parseInt(asciiMatch[1]) / parseInt(asciiMatch[2]);
  }
  const result = parseFloat(str);
  return isNaN(result) ? null : result;
}

function calculateConfidence(coin, match) {
  // Numista ID match is a perfect match (100%) - coin was previously enriched with this exact type
  const coinNumistaId = coin.metadata?.basicData?.numistaId;
  if (coinNumistaId && match.id && coinNumistaId === match.id) {
    return 100;
  }

  let score = 0;

  // Title similarity (30 points max) - uses Dice coefficient for graduated scoring
  if (coin.title && match.title) {
    const similarity = window.stringSimilarity.diceCoefficient(coin.title, match.title);
    score += Math.round(similarity * 30);
  }

  // Year match (25 points) or penalty (-15 points)
  if (coin.year && match.min_year) {
    const coinYear = parseInt(coin.year);
    const maxYear = match.max_year || match.min_year;
    if (coinYear >= match.min_year && coinYear <= maxYear) {
      score += 25; // Year in range
    } else {
      // Year outside range - penalty (can't be this coin type)
      score -= 15;
    }
  }

  // Country match (20 points)
  if (coin.country && match.issuer?.name) {
    const coinCountry = coin.country.toLowerCase().trim();
    const numistaCountry = match.issuer.name.toLowerCase().trim();
    if (coinCountry === numistaCountry || numistaCountry.includes(coinCountry) || coinCountry.includes(numistaCountry)) {
      score += 20;
    } else if (window.stringSimilarity.issuerAliases?.[coinCountry] && match.issuer?.code &&
               window.stringSimilarity.issuerAliases[coinCountry] === match.issuer.code) {
      // Coin's country resolves to same Numista issuer code via alias map
      // e.g. "Mandatory Palestine" -> "palestine" === match.issuer.code "palestine"
      score += 20;
    }
  }

  // Value/denomination match (25 points) - compare numeric values first, then units
  // OpenNumismat stores value=1, unit="Cents" while Numista uses value.text="1 Cent"
  // coin.value is a string from SQLite (e.g., "1/2" for half dollar); parseNumericValue handles fractions
  const rawCoinValue = coin.value ? parseNumericValue(coin.value) : null;
  const rawCoinUnit = coin.unit?.toLowerCase().trim();
  // If unit contains an ASCII fraction prefix (e.g., "1/2 Franc"), absorb it into the value
  const { adjValue: coinValue, adjUnit: coinUnit } = extractUnitFraction(rawCoinUnit, rawCoinValue);

  // Try value.text first, fallback to extracting from title (e.g., "5 Cents Liberty Nickel")
  let matchDenomination = match.value?.text?.toLowerCase().trim();
  if (!matchDenomination && match.title) {
    // Extract denomination from start of title up to first separator (dash, paren, comma, quote)
    // Handles Unicode fractions: "½ Dime" -> "½ Dime", "1 Cent" -> "1 Cent"
    // Captures multi-word units: "2 Euro Cents - Beatrix" -> "2 Euro Cents"
    const denomNumRe = new RegExp(`^(${DENOM_NUM_CHARS}+\\s*[^-–(,"]+)`, 'i');
    const titleMatch = match.title.match(denomNumRe);
    if (titleMatch) {
      matchDenomination = titleMatch[1].toLowerCase().trim();
    }
  }

  if (coinValue && matchDenomination) {
    // Extract numeric value from denomination text (e.g., "5 Cents" -> 5, "½ Dime" -> 0.5)
    const denomNumStripRe = new RegExp(`^${DENOM_NUM_CHARS}+\\s*`);
    const matchValueMatch = matchDenomination.match(new RegExp(`^(${DENOM_NUM_CHARS}+)`));
    const matchValue = matchValueMatch ? parseNumericValue(matchValueMatch[1]) : null;
    // Extract unit from denomination text (e.g., "5 Cents" -> "cents", "½ Dime" -> "dime")
    const matchUnit = matchDenomination.replace(denomNumStripRe, '').trim();

    if (matchValue !== null) {
      // Check if units match (e.g., "cents" vs "cent" should match, "cent" vs "dime" should not)
      const unitsMatch = coinUnit && matchUnit && (
        window.stringSimilarity.unitsMatch(coinUnit, matchUnit) ||
        window.stringSimilarity.diceCoefficient(coinUnit, matchUnit) > 0.7
      );

      if (coinValue === matchValue && unitsMatch) {
        // Both numeric value AND unit match - full points
        score += 25;
      } else if (coinValue === matchValue && (!coinUnit || !matchUnit)) {
        // Numeric matches but can't compare units - partial points
        score += 15;
      } else {
        // Either numeric value differs OR units differ (e.g., "1 Cent" vs "1 Dime")
        // Check US colloquial denomination equivalence before applying penalty:
        // "10 cents" (OpenNumismat) ↔ "1 dime" (Numista), "5 cents" ↔ "1 nickel", etc.
        const matchUnitCentVal = matchUnit ? US_DENOM_CENT_VALUES[matchUnit.toLowerCase()] : null;
        const coinUnitCentVal = coinUnit ? US_DENOM_CENT_VALUES[coinUnit.toLowerCase()] : null;
        const coinIsCent = coinUnit && window.stringSimilarity.unitsMatch(coinUnit, 'cent');
        const matchIsCent = matchUnit && window.stringSimilarity.unitsMatch(matchUnit, 'cent');
        const isUSEquivalent = (
          (matchUnitCentVal && coinIsCent && coinValue === matchUnitCentVal && matchValue === 1) ||
          (coinUnitCentVal && matchIsCent && matchValue === coinUnitCentVal && coinValue === 1)
        );
        if (isUSEquivalent) {
          score += 25;
        } else if (window.stringSimilarity.valuesMatchViaSubunit(coinValue, coinUnit, matchValue, matchUnit)) {
          score += 25;
        } else {
          score -= 20;
        }
      }
    }
  } else if (coinUnit && matchDenomination) {
    // No numeric value from user's coin, but we have a unit to compare
    // This handles cases like unit="Euro" where value is empty in OpenNumismat
    const matchUnit = matchDenomination.replace(new RegExp(`^${DENOM_NUM_CHARS}+\\s*`), '').trim();
    if (matchUnit) {
      const unitsMatch = (
        window.stringSimilarity.unitsMatch(coinUnit, matchUnit) ||
        window.stringSimilarity.diceCoefficient(coinUnit, matchUnit) > 0.7
      );
      if (unitsMatch) {
        score += 15; // Unit matches but can't verify numeric value
      } else {
        score -= 10; // Unit mismatch
      }
    }
  }

  // Category scoring (10 points max / -10 penalty)
  // Standard circulation coins are most likely what users have
  const category = match.object_type?.name?.toLowerCase() || match.category?.toLowerCase() || '';
  if (category.includes('standard circulation') || category.includes('circulating')) {
    score += 10; // Boost for standard circulation
  } else if (category.includes('pattern') || category.includes('proof') ||
             category.includes('non-circulating') || category.includes('specimen')) {
    score -= 10; // Penalty for rare/collector categories
  }
  // Commemorative coins get no adjustment (neutral)

  return Math.max(0, Math.min(100, score));
}

async function handleMatchSelection(matchIndex) {
  // Remove previous selection
  document.querySelectorAll('.match-card').forEach(card => {
    card.classList.remove('selected');
  });

  // Select this match
  const selectedCard = document.querySelector(`[data-match-index="${matchIndex}"]`);
  selectedCard.classList.add('selected');

  const searchResult = AppState.currentMatches[matchIndex];
  AppState.selectedMatch = searchResult;

  showStatus('Fetching detailed information...');

  try {
    // Fetch all data (basic, issue, pricing) based on settings
    const result = await window.electronAPI.fetchCoinData({
      typeId: AppState.selectedMatch.id,
      coin: AppState.currentCoin
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // Preserve thumbnail URLs from search result when merging with detailed data
    if (result.basicData) {
      result.basicData.obverse_thumbnail = searchResult.obverse_thumbnail;
      result.basicData.reverse_thumbnail = searchResult.reverse_thumbnail;
      // Keep edge_thumbnail from type data - search results don't include it
      // Only use searchResult.edge_thumbnail if it exists (for future API compatibility)
      result.basicData.edge_thumbnail = searchResult.edge_thumbnail || result.basicData.edge_thumbnail;
      AppState.selectedMatch = result.basicData;
    } else {
      // If no basic data was fetched, keep the search result
      AppState.selectedMatch = searchResult;
    }

    // Store the fetched data
    AppState.issueData = result.issueData;
    AppState.pricingData = result.pricingData;
    AppState.issueMatchResult = result.issueMatchResult;

    console.log('Fetched data - basic:', !!result.basicData, 'issue:', !!result.issueData, 'pricing:', !!result.pricingData);
    console.log('Issue match result:', result.issueMatchResult?.type);

    // Check if user needs to pick an issue
    if (result.issueMatchResult?.type === 'USER_PICK' && result.issueOptions && result.issueOptions.length > 0) {
      console.log('USER_PICK scenario - showing issue picker with', result.issueOptions.length, 'options');
      showStatus('Multiple issues found. Please select the correct one...');

      // Show issue picker modal
      const pickerResult = await showIssuePicker(result.issueOptions, AppState.currentCoin, AppState.selectedMatch.id);
      console.log('Issue picker result:', pickerResult);

      if (pickerResult.action === 'selected' && pickerResult.issue) {
        console.log('User selected issue:', pickerResult.issue);
        AppState.issueMatchResult = { type: 'USER_SELECTED', issue: pickerResult.issue };

        // Store the selected issue as issueData
        AppState.issueData = pickerResult.issue;

        // Fetch pricing for the selected issue if pricing was requested
        const settings = await window.api.getSettings();
        if (settings.fetchSettings.pricingData) {
          showStatus('Fetching pricing for selected issue...');
          try {
            const pricingResult = await window.electronAPI.fetchPricingForIssue({
              typeId: AppState.selectedMatch.id,
              issueId: pickerResult.issue.id
            });

            if (pricingResult.success) {
              AppState.pricingData = pricingResult.pricingData;
              console.log('Pricing fetched for selected issue:', !!AppState.pricingData);
            } else {
              console.error('Failed to fetch pricing:', pricingResult.error);
              AppState.pricingData = null;
            }
          } catch (error) {
            console.error('Error fetching pricing for selected issue:', error);
            AppState.pricingData = null;
          }
        }
      } else if (pickerResult.action === 'skip') {
        console.log('User chose to skip issue selection');
        AppState.issueData = null;
        AppState.pricingData = null;
      } else {
        // User cancelled - don't proceed
        console.log('User cancelled issue selection');
        showStatus('Issue selection cancelled.', 'info');
        return;
      }
    }

    // Update progress
    await window.electronAPI.updateCoinStatus({
      coinId: AppState.currentCoin.id,
      status: 'matched',
      metadata: {
        numistaId: AppState.selectedMatch.id
      }
    });

    showStatus('Match selected. Click to continue to field comparison.');

    // Refresh session counter after all API operations
    await refreshSessionCounter();

    // Auto-proceed to comparison after 1 second
    setTimeout(async () => {
      await showFieldComparison();
    }, 1000);

  } catch (error) {
    showStatus(`Error fetching details: ${error.message}`, 'error');
  }
}

// =============================================================================
// Field Comparison
// =============================================================================

async function showFieldComparison() {
  showScreen('comparison');
  showStatus('Comparing fields...');
  // Update menu state - field comparison is now active
  updateMenuState({ fieldComparisonActive: true });

  try {
    const result = await window.electronAPI.compareFields({
      coin: AppState.currentCoin,
      numistaData: AppState.selectedMatch,
      issueData: AppState.issueData,
      pricingData: AppState.pricingData
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // Transform backend array format to frontend object format
    const comparisonObj = {};
    result.comparison.fields.forEach(fieldData => {
      // Use formatted display if available (for catalog numbers), otherwise use raw value
      const numistaDisplay = fieldData.numistaValueDisplay || fieldData.numistaValue || '(empty)';

      comparisonObj[fieldData.field] = {
        current: {
          value: fieldData.onValue,
          display: fieldData.onValue || '(empty)'
        },
        numista: {
          value: fieldData.numistaValue,  // Raw value for database
          display: numistaDisplay  // Formatted for display (e.g., "Krause# 13")
        },
        isDifferent: fieldData.isDifferent,
        recommendUpdate: fieldData.recommendUpdate || false,
        hasCurrentValue: fieldData.onValue !== null && fieldData.onValue !== undefined && fieldData.onValue !== '',
        hasNumistaValue: fieldData.numistaValue !== null && fieldData.numistaValue !== undefined && fieldData.numistaValue !== '',
        priority: fieldData.priority,
        description: fieldData.description,
        category: fieldData.category || 'main',  // Field category for grouping
        displayOrder: fieldData.displayOrder || 999  // Display order within category
      };
    });

    AppState.fieldComparison = comparisonObj;
    
    // Create default selection
    AppState.selectedFields = createDefaultSelection(AppState.fieldComparison);

    renderFieldComparison();
    showStatus('Review and select fields to import');

  } catch (error) {
    showStatus(`Error comparing fields: ${error.message}`, 'error');
    console.error('Comparison error:', error);
  }
}

function createDefaultSelection(comparison) {
  const selection = {};

  console.log('Creating default selection:');
  for (const [fieldName, data] of Object.entries(comparison)) {
    // Auto-select if: current empty + Numista has data, OR field is recommended for update
    const autoSelect = (!data.hasCurrentValue && data.hasNumistaValue) ||
                       (data.recommendUpdate && data.isDifferent);
    selection[fieldName] = autoSelect;
    
    if (autoSelect) {
      console.log(`  ${UI_STRINGS.ICON_CHECK} Auto-selecting '${fieldName}' (current empty, numista has value)`);
    } else {
      console.log(`  - Not selecting '${fieldName}' (hasCurrentValue=${data.hasCurrentValue}, hasNumistaValue=${data.hasNumistaValue})`);
    }
  }

  return selection;
}

/**
 * Render side-by-side image comparison
 * @param {HTMLElement} container - Container element to append to
 */
async function renderImageComparison(container) {
  const imageSection = document.createElement('div');
  imageSection.className = 'image-comparison-section';

  const heading = document.createElement('h3');
  heading.textContent = 'Image Comparison';
  heading.style.marginBottom = '1rem';
  imageSection.appendChild(heading);

  const imageRow = document.createElement('div');
  imageRow.className = 'image-comparison-row';

  // User's images column
  const userColumn = document.createElement('div');
  userColumn.className = 'image-comparison-column';

  const userHeading = document.createElement('div');
  userHeading.className = 'image-comparison-heading';
  userHeading.textContent = 'Your Coin';
  userColumn.appendChild(userHeading);

  const userImages = document.createElement('div');
  userImages.className = 'image-comparison-images';

  // Load user's images from database
  try {
    const result = await window.electronAPI.getCoinImages(AppState.currentCoin.id);
    if (result.success && result.images) {
      const userObverse = document.createElement('img');
      userObverse.className = 'comparison-image';
      userObverse.src = result.images.obverse || getImagePlaceholder('obverse');
      userObverse.alt = 'Your obverse';
      attachLightbox(userObverse, 'Your obverse');

      const userReverse = document.createElement('img');
      userReverse.className = 'comparison-image';
      userReverse.src = result.images.reverse || getImagePlaceholder('reverse');
      userReverse.alt = 'Your reverse';
      attachLightbox(userReverse, 'Your reverse');

      userImages.appendChild(userObverse);
      userImages.appendChild(userReverse);
    } else {
      userImages.innerHTML = '<p style="color: #666;">No images available</p>';
    }
  } catch (error) {
    console.error('Error loading user images:', error);
    userImages.innerHTML = '<p style="color: #999;">Error loading images</p>';
  }

  userColumn.appendChild(userImages);

  // Numista images column
  const numistaColumn = document.createElement('div');
  numistaColumn.className = 'image-comparison-column';

  const numistaHeading = document.createElement('div');
  numistaHeading.className = 'image-comparison-heading';
  numistaHeading.textContent = 'Numista Match';
  numistaColumn.appendChild(numistaHeading);

  const numistaImages = document.createElement('div');
  numistaImages.className = 'image-comparison-images';

  // Get Numista images from selected match
  if (AppState.selectedMatch) {
    const numistaObverse = document.createElement('img');
    numistaObverse.className = 'comparison-image';
    numistaObverse.src = AppState.selectedMatch.obverse_thumbnail || getImagePlaceholder('obverse');
    numistaObverse.alt = 'Numista obverse';
    attachLightbox(numistaObverse, 'Numista obverse');

    const numistaReverse = document.createElement('img');
    numistaReverse.className = 'comparison-image';
    numistaReverse.src = AppState.selectedMatch.reverse_thumbnail || getImagePlaceholder('reverse');
    numistaReverse.alt = 'Numista reverse';
    attachLightbox(numistaReverse, 'Numista reverse');

    numistaImages.appendChild(numistaObverse);
    numistaImages.appendChild(numistaReverse);
  } else {
    numistaImages.innerHTML = '<p style="color: #666;">No match selected</p>';
  }

  numistaColumn.appendChild(numistaImages);

  // Add download button below images
  if (AppState.selectedMatch) {
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-primary';
    downloadBtn.style.marginTop = '1rem';
    downloadBtn.style.width = '100%';
    downloadBtn.textContent = 'Download Images to Collection';
    downloadBtn.addEventListener('click', async () => {
      await handleImageDownload();
    });
    numistaColumn.appendChild(downloadBtn);
  }

  imageRow.appendChild(userColumn);
  imageRow.appendChild(numistaColumn);
  imageSection.appendChild(imageRow);

  container.appendChild(imageSection);
}

/**
 * Handle downloading images from Numista and storing in database
 */
async function handleImageDownload() {
  if (!AppState.selectedMatch || !AppState.currentCoin) {
    showStatus('No match or coin selected', 'error');
    return;
  }

  try {
    showStatus('Downloading images from Numista...');

    // Debug: Log the selectedMatch structure for edge images
    console.log('=== IMAGE DOWNLOAD DEBUG ===');
    console.log('selectedMatch keys:', Object.keys(AppState.selectedMatch));
    console.log('edge_thumbnail:', AppState.selectedMatch.edge_thumbnail);
    console.log('edge object:', AppState.selectedMatch.edge);
    console.log('edge.picture:', AppState.selectedMatch.edge?.picture);

    // Extract image URLs from the selected match
    // Note: obverse/reverse use top-level thumbnail fields, but edge uses nested edge.picture
    const imageUrls = {
      obverse: AppState.selectedMatch.obverse_thumbnail?.replace('150x150', '400x400'),
      reverse: AppState.selectedMatch.reverse_thumbnail?.replace('150x150', '400x400'),
      // edge_thumbnail may not exist - fall back to edge.picture (full-size image URL)
      edge: AppState.selectedMatch.edge_thumbnail?.replace('150x150', '400x400')
            || AppState.selectedMatch.edge?.picture
    };

    console.log('Final imageUrls to download:', imageUrls);

    // Call backend to download and store
    const result = await window.electronAPI.downloadAndStoreImages({
      coinId: AppState.currentCoin.id,
      imageUrls
    });

    console.log('Download result:', result);

    if (result.success) {
      showStatus('Images downloaded successfully!', 'success');
      // Refresh the image comparison display
      renderFieldComparison();
    } else {
      showStatus(`Error downloading images: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Error downloading images:', error);
    showStatus(`Error downloading images: ${error.message}`, 'error');
  }
}

// =============================================================================
// Fetch More Data (Task 2.7)
// =============================================================================

function createFetchCard({ title, description, cost, buttonText, buttonId, handler, warning }) {
  const card = document.createElement('div');
  card.className = 'fetch-more-card';

  const info = document.createElement('div');
  info.className = 'fetch-more-info';

  const titleEl = document.createElement('strong');
  titleEl.textContent = title;
  info.appendChild(titleEl);

  const descEl = document.createElement('span');
  descEl.className = 'fetch-more-description';
  descEl.textContent = description;
  info.appendChild(descEl);

  const costEl = document.createElement('span');
  costEl.className = 'fetch-more-cost';
  costEl.textContent = 'Cost: ' + cost;
  info.appendChild(costEl);

  if (warning) {
    const warnEl = document.createElement('span');
    warnEl.className = 'fetch-more-warning';
    warnEl.textContent = warning;
    info.appendChild(warnEl);
  }

  const btn = document.createElement('button');
  btn.className = 'btn btn-secondary';
  btn.id = buttonId;
  btn.textContent = buttonText;
  btn.addEventListener('click', handler);

  card.appendChild(info);
  card.appendChild(btn);

  return card;
}

function renderFetchMoreDataSection(container) {
  const hasIssueData = AppState.issueData !== null && AppState.issueData !== undefined;
  const hasPricingData = AppState.pricingData !== null && AppState.pricingData !== undefined;
  const hasMatchedType = AppState.selectedMatch && AppState.selectedMatch.id;

  if (!hasMatchedType) return;

  // Check metadata for previously fetched pricing (for "Refresh" scenario)
  const pricingMetadata = AppState.currentCoin?.statusInfo?.pricingData;
  const pricingTimestamp = pricingMetadata?.timestamp;

  const cards = [];

  // Issue Data button - show if not already fetched in this session
  if (!hasIssueData) {
    cards.push(createFetchCard({
      title: 'Issue Data',
      description: 'Fetch mintmark & mintage from Numista',
      cost: '1 API call',
      buttonText: 'Fetch Issue Data',
      buttonId: 'fetchIssueDataBtn',
      handler: handleFetchIssueData
    }));
  }

  // Pricing Data button
  if (!hasPricingData) {
    cards.push(createFetchCard({
      title: 'Pricing Data',
      description: 'Fetch current market values from Numista',
      cost: hasIssueData ? '1 API call' : '2 API calls (issue lookup + pricing)',
      buttonText: 'Fetch Pricing Data',
      buttonId: 'fetchPricingDataBtn',
      handler: handleFetchPricingData,
      warning: !hasIssueData ? 'Requires issue lookup first' : null
    }));
  } else if (pricingTimestamp) {
    // Pricing exists in this session - check freshness for refresh option
    const freshness = calculatePricingFreshness(pricingTimestamp);
    if (freshness.status === 'AGING' || freshness.status === 'OUTDATED') {
      cards.push(createFetchCard({
        title: freshness.icon + ' Refresh Pricing',
        description: 'Last fetched: ' + freshness.text + ' (' + new Date(pricingTimestamp).toLocaleDateString() + ')',
        cost: '1 API call',
        buttonText: 'Refresh Pricing Data',
        buttonId: 'refreshPricingDataBtn',
        handler: handleFetchPricingData
      }));
    }
  }

  if (cards.length === 0) return;

  const section = document.createElement('div');
  section.className = 'fetch-more-data-section';
  section.id = 'fetchMoreDataSection';

  const heading = document.createElement('h3');
  heading.textContent = 'Additional Data Available';
  section.appendChild(heading);

  cards.forEach(card => section.appendChild(card));
  container.appendChild(section);
}

async function handleFetchIssueData() {
  const typeId = AppState.selectedMatch.id;
  const coin = AppState.currentCoin;

  try {
    showStatus('Fetching issue data...');

    const btn = document.getElementById('fetchIssueDataBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Fetching...'; }

    const result = await window.electronAPI.fetchIssueData({
      typeId: typeId,
      coin: coin
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    if (result.issueMatchResult?.type === 'USER_PICK' && result.issueOptions?.length > 0) {
      showStatus('Multiple issues found. Please select the correct one...');
      const pickerResult = await showIssuePicker(result.issueOptions, coin, typeId);

      if (pickerResult.action === 'selected' && pickerResult.issue) {
        AppState.issueData = pickerResult.issue;
        AppState.issueMatchResult = { type: 'USER_SELECTED', issue: pickerResult.issue };
      } else if (pickerResult.action === 'skip') {
        AppState.issueData = null;
        showStatus('Issue data skipped.');
        await showFieldComparison();
        return;
      } else {
        showStatus('Issue selection cancelled.');
        if (btn) { btn.disabled = false; btn.textContent = 'Fetch Issue Data'; }
        return;
      }
    } else if (result.issueMatchResult?.type === 'AUTO_MATCHED') {
      AppState.issueData = result.issueData;
      AppState.issueMatchResult = result.issueMatchResult;
    } else if (result.issueMatchResult?.type === 'NO_ISSUES' || result.issueMatchResult?.type === 'NO_MATCH') {
      showStatus('No matching issues found for this coin.');
      if (btn) { btn.disabled = false; btn.textContent = 'Fetch Issue Data'; }
      return;
    }

    showStatus('Issue data fetched. Refreshing comparison...');

    // Refresh session counter after fetching issue data
    await refreshSessionCounter();

    await showFieldComparison();

  } catch (error) {
    showStatus('Error fetching issue data: ' + error.message, 'error');
    const btn = document.getElementById('fetchIssueDataBtn');
    if (btn) { btn.disabled = false; btn.textContent = 'Fetch Issue Data'; }
  }
}

async function handleFetchPricingData() {
  const typeId = AppState.selectedMatch.id;
  const coin = AppState.currentCoin;

  try {
    showStatus('Fetching pricing data...');

    const btn = document.getElementById('fetchPricingDataBtn') || document.getElementById('refreshPricingDataBtn');
    const originalText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Fetching...'; }

    let issueId = null;

    if (AppState.issueData && AppState.issueData.id) {
      issueId = AppState.issueData.id;
    } else {
      // Need to fetch issues first to get an issue ID for pricing
      showStatus('Looking up issue data first (required for pricing)...');

      const issueResult = await window.electronAPI.fetchIssueData({
        typeId: typeId,
        coin: coin
      });

      if (!issueResult.success) {
        throw new Error('Failed to look up issue: ' + issueResult.error);
      }

      if (issueResult.issueMatchResult?.type === 'USER_PICK' && issueResult.issueOptions?.length > 0) {
        const pickerResult = await showIssuePicker(issueResult.issueOptions, coin, typeId);

        if (pickerResult.action === 'selected' && pickerResult.issue) {
          AppState.issueData = pickerResult.issue;
          issueId = pickerResult.issue.id;
        } else {
          showStatus('Cannot fetch pricing without selecting an issue.');
          if (btn) { btn.disabled = false; btn.textContent = originalText; }
          return;
        }
      } else if (issueResult.issueMatchResult?.type === 'AUTO_MATCHED') {
        AppState.issueData = issueResult.issueData;
        issueId = issueResult.issueData.id;
      } else {
        showStatus('No matching issue found. Cannot fetch pricing without an issue.');
        if (btn) { btn.disabled = false; btn.textContent = originalText; }
        return;
      }
    }

    showStatus('Fetching pricing for issue...');
    const pricingResult = await window.electronAPI.fetchPricingForIssue({
      typeId: typeId,
      issueId: issueId
    });

    if (pricingResult.success) {
      AppState.pricingData = pricingResult.pricingData;
    } else {
      throw new Error('Pricing fetch failed: ' + (pricingResult.error || 'Unknown error'));
    }

    showStatus('Pricing data fetched. Refreshing comparison...');

    // Refresh session counter after fetching pricing data
    await refreshSessionCounter();

    await showFieldComparison();

  } catch (error) {
    showStatus('Error fetching pricing: ' + error.message, 'error');
    const btn = document.getElementById('fetchPricingDataBtn') || document.getElementById('refreshPricingDataBtn');
    if (btn) { btn.disabled = false; }
  }
}

async function renderFieldComparison() {
  const container = document.getElementById('fieldComparison');
  container.innerHTML = '';

  // Add "Fetch More Data" section if additional data types are available
  renderFetchMoreDataSection(container);

  // Fetch user's coin images once for use in image field rows
  let userImages = { obverse: null, reverse: null, edge: null };
  try {
    const result = await window.electronAPI.getCoinImages(AppState.currentCoin.id);
    if (result.success && result.images) {
      userImages = result.images;
    }
  } catch (error) {
    console.error('Error loading user images for field comparison:', error);
  }

  // Map field names to image types
  const imageFieldMap = {
    obverseimg: 'obverse',
    reverseimg: 'reverse',
    edgeimg: 'edge'
  };

  // Category display names and tracking
  const categoryNames = {
    main: 'Type Data',
    issue: 'Issue Data',
    pricing: 'Pricing Data'
  };
  let currentCategory = null;

  // Only show category headers if we have more than just 'main' (i.e., issue or pricing data present)
  const categories = new Set(Object.values(AppState.fieldComparison).map(d => d.category));
  const showCategoryHeaders = categories.size > 1;

  for (const [fieldName, data] of Object.entries(AppState.fieldComparison)) {
    // Add category header when category changes (only if multiple categories exist)
    if (data.category !== currentCategory) {
      currentCategory = data.category;
      if (showCategoryHeaders && categoryNames[currentCategory]) {
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'field-category-header';
        categoryHeader.textContent = categoryNames[currentCategory];
        container.appendChild(categoryHeader);
      }
    }
    const row = document.createElement('div');
    row.className = 'field-row';

    const isImageField = imageFieldMap.hasOwnProperty(fieldName);
    if (isImageField) {
      row.classList.add('image-field-row');
    }

    if (data.isDifferent) {
      row.classList.add('different');
    }

    // Checkbox
    const checkboxCell = document.createElement('div');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'field-checkbox';
    checkbox.checked = AppState.selectedFields[fieldName] || false;
    checkbox.addEventListener('change', (e) => {
      AppState.selectedFields[fieldName] = e.target.checked;
      console.log(`Checkbox '${fieldName}' changed to: ${e.target.checked}`);

      // Count how many are now selected
      const selectedCount = Object.values(AppState.selectedFields).filter(v => v === true).length;
      console.log(`Total selected fields: ${selectedCount}`);
    });
    checkboxCell.appendChild(checkbox);

    // Field name
    const nameCell = document.createElement('div');
    const nameDiv = document.createElement('div');
    nameDiv.className = 'field-name';
    nameDiv.textContent = fieldName;
    const descDiv = document.createElement('div');
    descDiv.className = 'field-description';
    descDiv.textContent = data.description;
    nameCell.appendChild(nameDiv);
    nameCell.appendChild(descDiv);

    // Current value cell
    const currentCell = document.createElement('div');
    const currentLabel = document.createElement('div');
    currentLabel.style.fontWeight = '600';
    currentLabel.style.fontSize = '0.75rem';
    currentLabel.style.marginBottom = '0.25rem';
    currentLabel.textContent = 'Current';
    currentCell.appendChild(currentLabel);

    // Numista value cell
    const numistaCell = document.createElement('div');
    const numistaLabel = document.createElement('div');
    numistaLabel.style.fontWeight = '600';
    numistaLabel.style.fontSize = '0.75rem';
    numistaLabel.style.marginBottom = '0.25rem';
    numistaLabel.textContent = 'Numista';
    numistaCell.appendChild(numistaLabel);

    if (isImageField) {
      // Render inline image previews for image fields
      const imageType = imageFieldMap[fieldName];

      // Current image
      const currentImgContainer = document.createElement('div');
      currentImgContainer.className = 'field-image-container';
      const currentImg = document.createElement('img');
      currentImg.className = 'field-image-preview';
      currentImg.alt = `Current ${imageType}`;

      if (userImages[imageType]) {
        currentImg.src = userImages[imageType];
        attachLightbox(currentImg, `Your ${imageType}`);
      } else {
        currentImg.src = getImagePlaceholder(imageType);
        currentImg.classList.add('placeholder');
      }
      currentImgContainer.appendChild(currentImg);
      currentCell.appendChild(currentImgContainer);

      // Numista image
      const numistaImgContainer = document.createElement('div');
      numistaImgContainer.className = 'field-image-container';
      const numistaImg = document.createElement('img');
      numistaImg.className = 'field-image-preview';
      numistaImg.alt = `Numista ${imageType}`;

      // Get Numista image URL from selectedMatch
      let numistaImgUrl = null;
      if (AppState.selectedMatch) {
        if (imageType === 'obverse') {
          numistaImgUrl = AppState.selectedMatch.obverse_thumbnail;
        } else if (imageType === 'reverse') {
          numistaImgUrl = AppState.selectedMatch.reverse_thumbnail;
        } else if (imageType === 'edge') {
          numistaImgUrl = AppState.selectedMatch.edge_thumbnail || AppState.selectedMatch.edge?.picture;
        }
      }

      if (numistaImgUrl) {
        numistaImg.src = numistaImgUrl;
        attachLightbox(numistaImg, `Numista ${imageType}`);
      } else {
        numistaImg.src = getImagePlaceholder(imageType);
        numistaImg.classList.add('placeholder');
      }
      numistaImgContainer.appendChild(numistaImg);
      numistaCell.appendChild(numistaImgContainer);
    } else {
      // Regular text field rendering
      const currentValue = document.createElement('div');
      currentValue.className = data.hasCurrentValue ? 'field-value' : 'field-value empty';
      currentValue.textContent = data.current.display;
      currentCell.appendChild(currentValue);

      const numistaValue = document.createElement('div');
      numistaValue.className = data.hasNumistaValue ? 'field-value' : 'field-value empty';
      numistaValue.textContent = data.numista.display;
      numistaCell.appendChild(numistaValue);
    }

    row.appendChild(checkboxCell);
    row.appendChild(nameCell);
    row.appendChild(currentCell);
    row.appendChild(numistaCell);

    container.appendChild(row);
  }
}

// =============================================================================
// Issue Picker Modal
// =============================================================================

/**
 * Show the Issue Picker modal when multiple issues are found
 * @param {Array} issueOptions - Array of issue objects from Numista
 * @param {Object} coin - User's coin data
 */
async function showIssuePicker(issueOptions, coin, typeId) {
  const modal = document.getElementById('issuePickerModal');
  const coinNameSpan = document.getElementById('issuePickerCoinName');
  const userYearSpan = document.getElementById('issuePickerUserYear');
  const userMintmarkSpan = document.getElementById('issuePickerUserMintmark');
  const userTypeSpan = document.getElementById('issuePickerUserType');
  const userImagesDiv = document.getElementById('issuePickerUserImages');
  const optionsList = document.getElementById('issueOptionsList');
  const applyBtn = document.getElementById('applyIssueSelectionBtn');
  const skipBtn = document.getElementById('skipIssueSelectionBtn');
  const closeBtn = document.getElementById('issuePickerCloseBtn');

  if (!modal) {
    console.error('Issue Picker modal not found');
    return null;
  }

  // Set coin name and user's coin info
  coinNameSpan.textContent = coin.title || 'this coin';
  userYearSpan.textContent = coin.year || '(not specified)';
  userMintmarkSpan.textContent = coin.mintmark || '(not specified)';
  userTypeSpan.textContent = coin.type || '(regular/circulation)';

  // Fetch and display user's coin images (same pattern as renderCurrentCoinInfo)
  userImagesDiv.innerHTML = '';
  try {
    const result = await window.electronAPI.getCoinImages(coin.id);
    if (result.success && result.images && (result.images.obverse || result.images.reverse)) {
      if (result.images.obverse) {
        const img = document.createElement('img');
        img.src = result.images.obverse;
        img.alt = 'Obverse';
        img.className = 'issue-picker-coin-img';
        attachLightbox(img, 'Your obverse');
        userImagesDiv.appendChild(img);
      }
      if (result.images.reverse) {
        const img = document.createElement('img');
        img.src = result.images.reverse;
        img.alt = 'Reverse';
        img.className = 'issue-picker-coin-img';
        attachLightbox(img, 'Your reverse');
        userImagesDiv.appendChild(img);
      }
    } else {
      userImagesDiv.innerHTML = '<span class="no-images-text">No images available</span>';
    }
  } catch (error) {
    console.error('Error loading coin images for issue picker:', error);
    userImagesDiv.innerHTML = '<span class="no-images-text">No images available</span>';
  }

  // Add "View on Numista" link if typeId is available
  const existingLink = modal.querySelector('.numista-link');
  if (existingLink) existingLink.remove();
  if (typeId) {
    const numistaLink = document.createElement('a');
    numistaLink.href = '#';
    numistaLink.className = 'numista-link';
    numistaLink.textContent = 'View on Numista';
    numistaLink.title = 'Open this coin type on Numista website';
    numistaLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.electronAPI.openExternal(`https://en.numista.com/catalogue/pieces${typeId}.html`);
    });
    const headerEl = modal.querySelector('.modal-header h3');
    if (headerEl) {
      headerEl.parentNode.insertBefore(numistaLink, headerEl.nextSibling);
    }
  }

  // Clear previous options
  optionsList.innerHTML = '';

  // Store selected issue
  let selectedIssue = null;
  const previousIssueId = coin.metadata?.issueData?.issueId || null;

  // Calculate match scores for sorting
  // Higher score = better match
  const scoredIssues = issueOptions.map((issue, originalIndex) => {
    const matchesYear = issue.year == coin.year;

    // Normalize to booleans (!! required: Numista omits mint_letter entirely for no-mintmark
    // issues so issue.mint_letter is undefined; null===undefined is false under strict equality)
    const userHasMintmark = !!(coin.mintmark && coin.mintmark.trim() !== '');
    const issueHasMintmark = !!(issue.mint_letter && issue.mint_letter.trim() !== '');
    const matchesMintmark = userHasMintmark === issueHasMintmark &&
                           (!userHasMintmark || issue.mint_letter.toLowerCase() === coin.mintmark.toLowerCase());

    // Type/comment matching (!! prevents null/undefined strict-equality mismatches)
    const userHasType = !!(coin.type && coin.type.trim() !== '');
    const issueHasComment = !!(issue.comment && issue.comment.trim() !== '');
    const matchesType = userHasType === issueHasComment ?
                       (!userHasType || issue.comment.toLowerCase().includes(coin.type.toLowerCase())) :
                       false;

    // Calculate score: year match is baseline, mintmark and type add points
    let score = 0;
    if (matchesYear) score += 10;
    if (matchesMintmark) score += 5;
    if (matchesType) score += 3;

    return { issue, originalIndex, score, matchesYear, matchesMintmark, matchesType };
  });

  // Sort by score descending (best matches first)
  scoredIssues.sort((a, b) => b.score - a.score);

  // Determine if we have a mix of match qualities for section headers
  const bestScore = scoredIssues[0]?.score || 0;
  const hasMixedMatches = scoredIssues.some(s => s.score < bestScore && s.score > 0);
  let addedOtherHeader = false;

  // Render issue options (now sorted)
  scoredIssues.forEach(({ issue, originalIndex, score, matchesMintmark, matchesType }, renderIndex) => {
    // Add section header if transitioning from best matches to other options
    if (hasMixedMatches && !addedOtherHeader && score < bestScore) {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'issue-section-header';
      headerDiv.innerHTML = '<span>Other options for this year</span>';
      optionsList.appendChild(headerDiv);
      addedOtherHeader = true;
    }

    const optionDiv = document.createElement('div');
    optionDiv.className = 'issue-option';
    optionDiv.dataset.issueIndex = originalIndex;

    const isFullMatch = matchesMintmark && matchesType;
    const isPartialMatch = matchesMintmark || matchesType;

    optionDiv.innerHTML = `
      <div class="issue-option-header">
        <input type="radio" name="issueSelection" class="issue-option-radio" value="${originalIndex}">
        <div class="issue-option-title">
          ${issue.year || '?'} ${issue.mint_letter ? `- ${issue.mint_letter}` : ''}
          ${issue.comment ? `(${issue.comment})` : ''}
          ${isFullMatch ? '<span class="issue-option-match-badge">EXACT MATCH</span>' : ''}
          ${isPartialMatch && !isFullMatch ? '<span class="issue-option-partial-badge">PARTIAL MATCH</span>' : ''}
          ${previousIssueId && issue.id === previousIssueId ? '<span class="issue-option-previous-badge">PREVIOUS SELECTION</span>' : ''}
        </div>
      </div>
      <div class="issue-option-details">
        <span class="issue-detail-label">Year:</span>
        <span class="issue-detail-value">${issue.year || '<span class="empty">(none)</span>'}</span>

        <span class="issue-detail-label">Mintmark:</span>
        <span class="issue-detail-value ${!issue.mint_letter ? 'empty' : ''}">
          ${issue.mint_letter || '(none)'}
        </span>

        <span class="issue-detail-label">Mintage:</span>
        <span class="issue-detail-value ${!issue.mintage ? 'empty' : ''}">
          ${issue.mintage ? issue.mintage.toLocaleString() : '(unknown)'}
        </span>

        ${issue.comment ? `
          <span class="issue-detail-label">Type:</span>
          <span class="issue-detail-value">${issue.comment}</span>
        ` : ''}
      </div>
    `;

    // Add click handler to select this option
    optionDiv.addEventListener('click', (e) => {
      // Clear all selections
      document.querySelectorAll('.issue-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      document.querySelectorAll('.issue-option-radio').forEach(radio => {
        radio.checked = false;
      });

      // Select this option
      optionDiv.classList.add('selected');
      const radio = optionDiv.querySelector('.issue-option-radio');
      radio.checked = true;
      selectedIssue = issue;
      applyBtn.disabled = false;
    });

    // Also handle radio button clicks
    const radio = optionDiv.querySelector('.issue-option-radio');
    radio.addEventListener('change', () => {
      if (radio.checked) {
        selectedIssue = issue;
        applyBtn.disabled = false;
      }
    });

    optionsList.appendChild(optionDiv);

    // Pre-select previously chosen issue
    if (previousIssueId && issue.id === previousIssueId) {
      optionDiv.classList.add('selected');
      const radioEl = optionDiv.querySelector('.issue-option-radio');
      radioEl.checked = true;
      selectedIssue = issue;
      applyBtn.disabled = false;
    }
  });

  // Show modal
  modal.style.display = 'flex';

  // Return a promise that resolves when user makes a selection
  return new Promise((resolve) => {
    const cleanup = () => {
      modal.style.display = 'none';
      applyBtn.removeEventListener('click', handleApply);
      skipBtn.removeEventListener('click', handleSkip);
      closeBtn.removeEventListener('click', handleClose);
    };

    const handleApply = () => {
      cleanup();
      resolve({ action: 'selected', issue: selectedIssue });
    };

    const handleSkip = () => {
      cleanup();
      resolve({ action: 'skip', issue: null });
    };

    const handleClose = () => {
      cleanup();
      resolve({ action: 'cancel', issue: null });
    };

    applyBtn.addEventListener('click', handleApply);
    skipBtn.addEventListener('click', handleSkip);
    closeBtn.addEventListener('click', handleClose);
  });
}

// =============================================================================
// Field Selection Controls
// =============================================================================

document.getElementById('selectAllFieldsBtn').addEventListener('click', () => {
  for (const field in AppState.selectedFields) {
    AppState.selectedFields[field] = true;
  }
  renderFieldComparison();
});

document.getElementById('selectNoneFieldsBtn').addEventListener('click', () => {
  for (const field in AppState.selectedFields) {
    AppState.selectedFields[field] = false;
  }
  renderFieldComparison();
});

document.getElementById('selectEmptyFieldsBtn').addEventListener('click', () => {
  for (const [fieldName, data] of Object.entries(AppState.fieldComparison)) {
    AppState.selectedFields[fieldName] = !data.hasCurrentValue && data.hasNumistaValue;
  }
  renderFieldComparison();
});

document.getElementById('selectDifferentFieldsBtn').addEventListener('click', () => {
  for (const [fieldName, data] of Object.entries(AppState.fieldComparison)) {
    AppState.selectedFields[fieldName] = data.isDifferent;
  }
  renderFieldComparison();
});

// =============================================================================
// Apply Changes
// =============================================================================

document.getElementById('applyChangesBtn').addEventListener('click', async () => {
  const confirmed = await showModal(
    'Confirm Changes',
    'Are you sure you want to apply these changes to the coin?<br>A backup will be created automatically.',
    true
  );

  if (!confirmed) {
    return;
  }

  try {
    showStatus('Applying changes...');
    showProgress(true, 50);

    console.log('=== Frontend Apply Changes ===');
    console.log('coinId:', AppState.currentCoin.id);
    console.log('selectedFields:', AppState.selectedFields);
    console.log('Number of selected fields:', Object.keys(AppState.selectedFields).filter(k => AppState.selectedFields[k]).length);
    console.log('numistaData.id:', AppState.selectedMatch?.id);

    const result = await window.electronAPI.mergeData({
      coinId: AppState.currentCoin.id,
      selectedFields: AppState.selectedFields,
      numistaData: AppState.selectedMatch,
      issueData: AppState.issueData,
      pricingData: AppState.pricingData
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    showProgress(true, 100);
    showStatus('Changes applied successfully!');

    const backupMsg = result.backupPath
      ? `<br>Backup saved to: ${result.backupPath}`
      : '<br>(Auto-backup is disabled)';
    await showModal('Success', `Coin updated successfully!${backupMsg}`);

    // Track lifetime enrichment and check if license prompt should show
    try {
      const enrichResult = await window.electronAPI.incrementLifetimeEnrichments(1);
      if (enrichResult.success && enrichResult.shouldPrompt) {
        // Show license prompt after a short delay
        setTimeout(() => showLicensePromptModal(enrichResult.totalCoinsEnriched), 1000);
      }
    } catch (e) {
      console.error('Error tracking enrichment:', e);
    }

    // Task 3.12: Check for matching coins and offer batch propagation (if enabled)
    // Skip if no fields were selected (nothing to propagate)
    const hasSelectedFields = Object.values(AppState.selectedFields).some(v => v === true);
    if (AppState.fetchSettings?.enableAutoPropagate !== false && hasSelectedFields) {
      try {
        const batchResult = await showBatchTypePropagationPrompt(
          AppState.currentCoin,
          AppState.selectedMatch,
          AppState.issueData,
          AppState.pricingData,
          AppState.selectedFields
        );

        if (batchResult && batchResult.action === 'apply_all') {
          await applyBatchTypePropagation(batchResult);
        }
      } catch (e) {
        console.error('Error in batch type propagation:', e);
        // Don't block the main flow if batch propagation fails
      }
    }

    // Refresh progress stats
    const statsResult = await window.electronAPI.getProgressStats();
    if (statsResult.success) {
      AppState.progressStats = statsResult.stats;
      updateProgressStats();
    }

    // Go back to collection
    setTimeout(async () => {
      showProgress(false);
      showScreen('collection');
      await loadCoins();
      restoreCollectionScrollPosition();
      // Leaving comparison screen after successful merge
      updateMenuState({ fieldComparisonActive: false });
    }, 500);

  } catch (error) {
    showProgress(false);
    showStatus(`Error applying changes: ${error.message}`, 'error');
    showModal('Error', `Failed to apply changes:<br>${error.message}`);
  }
});

// =============================================================================
// Navigation Buttons
// =============================================================================

document.getElementById('closeCollectionBtn').addEventListener('click', () => {
  AppState.collectionPath = null;
  AppState.collection = null;
  AppState.coins = [];
  showScreen('welcome');
  showStatus('');

  // Hide header collection elements
  document.getElementById('headerCollection').style.display = 'none';
  document.getElementById('headerCollectionActions').style.display = 'none';
  document.getElementById('dataSettingsBtn').style.display = 'none';

  // Update menu state
  updateMenuState({ collectionLoaded: false, fieldComparisonActive: false });
});

document.getElementById('fastPricingBtn').addEventListener('click', async () => {
  // Check if premium feature is available
  const canUse = await requirePremiumFeature('fast-pricing');
  if (!canUse) return;

  // Toggle fast pricing mode
  if (AppState.fastPricingMode) {
    exitFastPricingMode();
  } else {
    enterFastPricingMode();
  }
});

// Fast Pricing toolbar button handlers
document.getElementById('fpSelectAllEligible').addEventListener('click', () => {
  AppState.allCoins.forEach(c => {
    if (checkFastPricingEligibility(c).eligible) AppState.fastPricingSelected.add(c.id);
  });
  renderCoinList();
  updateFastPricingCounts();
});

document.getElementById('fpSelectDisplayed').addEventListener('click', () => {
  AppState.coins.forEach(c => {
    if (checkFastPricingEligibility(c).eligible) AppState.fastPricingSelected.add(c.id);
  });
  renderCoinList();
  updateFastPricingCounts();
});

document.getElementById('fpSelectNone').addEventListener('click', () => {
  AppState.fastPricingSelected.clear();
  renderCoinList();
  updateFastPricingCounts();
});

document.getElementById('fpExitMode').addEventListener('click', exitFastPricingMode);

document.getElementById('fpStartUpdate').addEventListener('click', startFastPricingUpdate);

document.getElementById('fpCancelUpdate').addEventListener('click', () => {
  AppState.fastPricingProgress.cancelled = true;
  showStatus('Cancelling after current coin...', 'warning');
});

document.getElementById('fpCompleteOk').addEventListener('click', () => {
  document.getElementById('fpCompleteModal').style.display = 'none';
});

document.getElementById('backToListBtn').addEventListener('click', () => {
  showScreen('collection');
  // Restore scroll position since we're not reloading coins
  restoreCollectionScrollPosition();
  // Leaving match screen
  updateMenuState({ fieldComparisonActive: false });
});

document.getElementById('backToMatchesBtn').addEventListener('click', () => {
  showScreen('match');
  // Leaving comparison screen
  updateMenuState({ fieldComparisonActive: false });
});

document.getElementById('skipCoinBtn').addEventListener('click', async () => {
  await window.electronAPI.updateCoinStatus({
    coinId: AppState.currentCoin.id,
    status: 'skipped',
    metadata: {}
  });

  showScreen('collection');
  await loadCoins();
  restoreCollectionScrollPosition();
  // Leaving match screen
  updateMenuState({ fieldComparisonActive: false });
});

document.getElementById('cancelMergeBtn').addEventListener('click', () => {
  showScreen('match');
  // Leaving comparison screen
  updateMenuState({ fieldComparisonActive: false });
});

// =============================================================================
// Manual Search
// =============================================================================

document.getElementById('manualSearchBtn').addEventListener('click', () => {
  const panel = document.getElementById('manualSearchPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';

  if (panel.style.display === 'block') {
    // Pre-populate category dropdown from settings
    const manualCategorySelect = document.getElementById('manualSearchCategory');
    if (manualCategorySelect) {
      manualCategorySelect.value = AppState.fetchSettings?.searchCategory || 'all';
    }
    document.getElementById('manualSearchInput').focus();
  }
});

document.getElementById('cancelManualSearchBtn').addEventListener('click', () => {
  document.getElementById('manualSearchPanel').style.display = 'none';
  document.getElementById('manualSearchInput').value = '';
});

document.getElementById('performManualSearchBtn').addEventListener('click', async () => {
  const rawSearchTerm = document.getElementById('manualSearchInput').value.trim();

  if (!rawSearchTerm) {
    showStatus('Please enter a search term', 'error');
    return;
  }

  // Extract 4-digit Gregorian year to pass as dedicated date param.
  // Year in q returns 0 results — Numista type titles don't contain years (Lesson 32).
  const yearMatch = rawSearchTerm.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  const extractedYear = yearMatch ? yearMatch[1] : null;

  // Build clean denomination query: strip extracted year and coin's country name.
  // Country is handled by the issuer param; year by the date param.
  let cleanedQuery = rawSearchTerm;
  if (extractedYear) {
    cleanedQuery = cleanedQuery.replace(extractedYear, '').replace(/\s+/g, ' ').trim();
  }
  if (AppState.currentCoin?.country) {
    const escapedCountry = stripParenthetical(AppState.currentCoin.country.trim())
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleanedQuery = cleanedQuery.replace(new RegExp(escapedCountry, 'gi'), '').replace(/\s+/g, ' ').trim();
  }

  // Normalize denomination singular/plural, then convert any ASCII fractions to Unicode
  // so the Numista API can match coin titles that use Unicode fraction characters.
  const searchTerm = normalizeDenominationInQuery(cleanedQuery || rawSearchTerm)
    .replace(/\b(\d+\/\d+)\b/g, f => asciiToUnicodeFraction(f));

  try {
    showStatus('Searching Numista with custom term...');
    document.getElementById('searchStatus').textContent =
      `Searching for "${rawSearchTerm}"${extractedYear ? ` (date=${extractedYear})` : ''}...`;

    // Resolve category from manual search dropdown
    const manualCategorySelect = document.getElementById('manualSearchCategory');
    const categorySetting = manualCategorySelect ? manualCategorySelect.value : 'all';
    const category = resolveSearchCategory(categorySetting, AppState.currentCoin);

    // Resolve issuer from current coin's country to narrow results
    let issuer = null;
    if (AppState.currentCoin?.country) {
      try {
        const cleanCountry = stripParenthetical(AppState.currentCoin.country.trim());
        const issuerResult = await window.electronAPI.resolveIssuer(cleanCountry);
        if (issuerResult.success && issuerResult.code) {
          issuer = issuerResult.code;
        }
      } catch (e) { console.warn('Issuer resolution failed (non-fatal):', e.message); }
    }

    let result = await window.electronAPI.manualSearchNumista({
      query: searchTerm,
      coinId: AppState.currentCoin.id,
      category,
      issuer,
      date: extractedYear
    });

    if (!result.success) throw new Error(result.error);

    // S3 fallback: if no results with issuer constraint, retry without issuer —
    // moves country into q, mirrors automatic searchForMatches() S3.
    let winningParams = { query: searchTerm, coinId: AppState.currentCoin.id, category, issuer, date: extractedYear };
    if ((result.results?.types || []).length === 0 && issuer && AppState.currentCoin?.country) {
      const countryName = stripParenthetical(AppState.currentCoin.country.trim());
      const s3Query = [countryName, searchTerm].filter(Boolean).join(' ');
      document.getElementById('searchStatus').textContent = 'Retrying without issuer constraint...';
      const s3Result = await window.electronAPI.manualSearchNumista({
        query: s3Query,
        coinId: AppState.currentCoin.id,
        category,
        issuer: null,
        date: extractedYear
      });
      if (s3Result.success && (s3Result.results?.types || []).length > 0) {
        result = s3Result;
        winningParams = { query: s3Query, coinId: AppState.currentCoin.id, category, issuer: null, date: extractedYear };
      }
    }

    // Fetch all pages if results span multiple pages
    if ((result.results?.types || []).length > 0) {
      AppState.currentMatches = await fetchAllSearchPages(
        (page) => window.electronAPI.manualSearchNumista({ ...winningParams, page }),
        result, `Searching for "${rawSearchTerm}"`
      );
    } else {
      AppState.currentMatches = [];
    }

    // Hide manual search panel
    document.getElementById('manualSearchPanel').style.display = 'none';

    if (AppState.currentMatches.length === 0) {
      document.getElementById('searchStatus').textContent =
        `No matches found for "${rawSearchTerm}"`;
      showStatus('No matches found - try different search terms');
    } else {
      document.getElementById('searchStatus').textContent =
        `Found ${AppState.currentMatches.length} matches for "${rawSearchTerm}"`;
      showStatus(`Found ${AppState.currentMatches.length} matches`);
    }

    renderMatches();

    // Refresh session counter after search
    await refreshSessionCounter();

  } catch (error) {
    showStatus(`Error searching: ${error.message}`, 'error');
    document.getElementById('searchStatus').textContent =
      `Error: ${error.message}`;
  }
});

// Allow Enter key in manual search input
document.getElementById('manualSearchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('performManualSearchBtn').click();
  }
});

// =============================================================================
// Filter & Sort
// =============================================================================

document.getElementById('statusFilter').addEventListener('change', (e) => {
  AppState.filterSort.statusFilter = e.target.value;
  AppState.pagination.currentPage = 1; // Reset to first page
  loadCoins();
  saveViewState();
});

document.getElementById('freshnessFilter').addEventListener('change', (e) => {
  AppState.filterSort.freshnessFilter = e.target.value;
  AppState.pagination.currentPage = 1; // Reset to first page
  loadCoins();
  saveViewState();
});

document.getElementById('sortBy').addEventListener('change', (e) => {
  AppState.filterSort.sortBy = e.target.value;
  AppState.pagination.currentPage = 1; // Reset to first page
  loadCoins();
  saveViewState();
});

// Click handlers for stat card error/skipped counts
document.querySelectorAll('.stat-clickable').forEach(el => {
  el.addEventListener('click', () => {
    const filterValue = el.dataset.filter;
    if (filterValue) {
      const statusFilter = document.getElementById('statusFilter');
      statusFilter.value = filterValue;
      AppState.filterSort.statusFilter = filterValue;
      AppState.pagination.currentPage = 1;
      loadCoins();
      saveViewState();
    }
  });
});

document.getElementById('resetFiltersBtn').addEventListener('click', () => {
  // Reset all filters to default values
  AppState.filterSort.statusFilter = 'all';
  AppState.filterSort.freshnessFilter = 'all';
  AppState.filterSort.sortBy = 'title';
  AppState.filterSort.sortOrder = 'ASC';
  AppState.pagination.currentPage = 1;

  // Update the UI dropdowns to reflect the reset
  document.getElementById('statusFilter').value = 'all';
  document.getElementById('freshnessFilter').value = 'all';
  document.getElementById('sortBy').value = 'title';

  // Reload coins with reset filters
  loadCoins();
  saveViewState();
});

// =============================================================================
// View Mode Toggle
// =============================================================================

/**
 * Toggle between list and grid view modes
 * @param {string} mode - 'list' or 'grid'
 * @param {boolean} [persist=true] - Whether to persist the preference
 */
function setViewMode(mode, persist = true) {
  if (mode !== 'list' && mode !== 'grid') return;

  AppState.viewMode = mode;

  // Update toggle button states
  document.getElementById('listViewBtn').classList.toggle('active', mode === 'list');
  document.getElementById('gridViewBtn').classList.toggle('active', mode === 'grid');

  // Update coin list CSS class
  const coinList = document.getElementById('coinList');
  coinList.classList.toggle('grid-view', mode === 'grid');

  // Persist preference if collection is loaded
  if (persist && AppState.collectionPath) {
    window.api.saveUiPreference('defaultView', mode).catch(err => {
      console.error('Error saving view mode preference:', err);
    });
  }

  // Notify main process for menu state sync
  window.api.updateMenuState({ viewMode: mode });
}

// View toggle button listeners
document.getElementById('listViewBtn').addEventListener('click', () => setViewMode('list'));
document.getElementById('gridViewBtn').addEventListener('click', () => setViewMode('grid'));

// =============================================================================
// Info Bar Pin Toggle
// =============================================================================

/**
 * Toggle sticky/pinned state of the info bar card
 * @param {boolean} enabled - Whether the info bar should be pinned (sticky)
 * @param {boolean} [persist=true] - Whether to persist the preference
 */
function setStickyInfoBar(enabled, persist = true) {
  const infoBarCard = document.getElementById('infoBarCard');
  const pinBtn = document.getElementById('infoBarPinBtn');

  if (!infoBarCard || !pinBtn) return;

  infoBarCard.classList.toggle('pinned', enabled);
  pinBtn.title = enabled ? 'Unpin info bar' : 'Pin info bar';

  // Persist preference if collection is loaded
  if (persist && AppState.collectionPath) {
    window.api.saveUiPreference('stickyInfoBar', enabled).catch(err => {
      console.error('Error saving sticky info bar preference:', err);
    });
  }
}

// Info bar pin button listener
document.getElementById('infoBarPinBtn').addEventListener('click', () => {
  const infoBarCard = document.getElementById('infoBarCard');
  const isPinned = infoBarCard.classList.contains('pinned');
  setStickyInfoBar(!isPinned);
});

// =============================================================================
// View State Persistence (Remember page/filters/sort on close)
// =============================================================================

/**
 * Save current view state (page, scroll, filters, sort) to collection settings.
 * Called on state changes (page, filter, sort) so the saved state is always current.
 * Uses a debounce to avoid excessive writes during rapid changes.
 */
let _saveViewStateTimer = null;
function saveViewState() {
  if (!AppState.collectionPath) return;

  clearTimeout(_saveViewStateTimer);
  _saveViewStateTimer = setTimeout(() => {
    const mainContent = document.querySelector('.app-main');
    const scrollTop = mainContent ? mainContent.scrollTop : 0;

    const viewState = {
      currentPage: AppState.pagination.currentPage,
      scrollTop: scrollTop,
      statusFilter: AppState.filterSort.statusFilter,
      freshnessFilter: AppState.filterSort.freshnessFilter,
      sortBy: AppState.filterSort.sortBy,
      sortOrder: AppState.filterSort.sortOrder
    };

    window.api.saveUiPreference('lastViewState', viewState).catch(err => {
      console.error('Error saving view state:', err);
    });
  }, 500);
}

/**
 * Restore view state (filters, sort, page) from saved preferences.
 * Applied during collection load before loadCoins() so the first render uses saved state.
 * @param {Object|null} lastViewState - Saved view state from uiPreferences
 */
function restoreViewState(lastViewState) {
  if (!lastViewState) return;

  // Restore filters
  if (lastViewState.statusFilter) {
    AppState.filterSort.statusFilter = lastViewState.statusFilter;
    const statusEl = document.getElementById('statusFilter');
    if (statusEl) statusEl.value = lastViewState.statusFilter;
  }
  if (lastViewState.freshnessFilter) {
    AppState.filterSort.freshnessFilter = lastViewState.freshnessFilter;
    const freshnessEl = document.getElementById('freshnessFilter');
    if (freshnessEl) freshnessEl.value = lastViewState.freshnessFilter;
  }

  // Restore sort
  if (lastViewState.sortBy) {
    AppState.filterSort.sortBy = lastViewState.sortBy;
    const sortEl = document.getElementById('sortBy');
    if (sortEl) sortEl.value = lastViewState.sortBy;
  }
  if (lastViewState.sortOrder) {
    AppState.filterSort.sortOrder = lastViewState.sortOrder;
  }

  // Restore page (will be clamped in loadCoins if out of range)
  if (lastViewState.currentPage && lastViewState.currentPage > 0) {
    AppState.pagination.currentPage = lastViewState.currentPage;
  }

  // Restore scroll position after coins render
  if (lastViewState.scrollTop && lastViewState.scrollTop > 0) {
    AppState.collectionScrollPosition = lastViewState.scrollTop;
  }
}

// Save view state immediately when the app is closing (bypass debounce)
window.addEventListener('beforeunload', () => {
  if (!AppState.collectionPath) return;

  const mainContent = document.querySelector('.app-main');
  const scrollTop = mainContent ? mainContent.scrollTop : 0;

  const viewState = {
    currentPage: AppState.pagination.currentPage,
    scrollTop: scrollTop,
    statusFilter: AppState.filterSort.statusFilter,
    freshnessFilter: AppState.filterSort.freshnessFilter,
    sortBy: AppState.filterSort.sortBy,
    sortOrder: AppState.filterSort.sortOrder
  };

  // Use sendSync-style fire-and-forget to maximize chance of delivery before close
  window.api.saveUiPreference('lastViewState', viewState).catch(() => {});
});

// =============================================================================
// Pagination
// =============================================================================

document.getElementById('firstPageBtn').addEventListener('click', () => {
  AppState.pagination.currentPage = 1;
  loadCoins();
  saveViewState();
});

document.getElementById('prevPageBtn').addEventListener('click', () => {
  if (AppState.pagination.currentPage > 1) {
    AppState.pagination.currentPage--;
    loadCoins();
    saveViewState();
  }
});

document.getElementById('nextPageBtn').addEventListener('click', () => {
  if (AppState.pagination.currentPage < AppState.pagination.totalPages) {
    AppState.pagination.currentPage++;
    loadCoins();
    saveViewState();
  }
});

document.getElementById('lastPageBtn').addEventListener('click', () => {
  AppState.pagination.currentPage = AppState.pagination.totalPages;
  loadCoins();
  saveViewState();
});

// =============================================================================
// Settings
// =============================================================================

// Settings dropdown toggle
document.getElementById('settingsDropdownBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  const menu = document.getElementById('settingsDropdownMenu');
  menu.classList.toggle('open');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('settingsDropdown');
  const menu = document.getElementById('settingsDropdownMenu');
  if (!dropdown.contains(e.target)) {
    menu.classList.remove('open');
  }
});

// App Settings button (in dropdown)
document.getElementById('settingsBtn').addEventListener('click', async () => {
  document.getElementById('settingsDropdownMenu').classList.remove('open');
  const result = await window.electronAPI.getAppSettings();
  if (result.success) {
    AppState.settings = result.settings;
    loadSettingsScreen();
    showScreen('settings');
  }
});

function loadSettingsScreen() {
  if (!AppState.settings) return;

  document.getElementById('apiKeyInput').value = AppState.settings.apiKey || '';
  document.getElementById('requestDelayInput').value = AppState.settings.searchDelay || 2000;
  document.getElementById('autoBackupCheckbox').checked = AppState.settings.autoBackup !== false;

  // Max backups: 0 = unlimited
  const maxBackups = AppState.settings.maxBackups !== undefined ? AppState.settings.maxBackups : 5;
  const isUnlimited = maxBackups === 0;
  document.getElementById('maxBackupsInput').value = isUnlimited ? 5 : maxBackups;
  document.getElementById('unlimitedBackupsCheckbox').checked = isUnlimited;
  updateBackupControlsState();

  // Load cache TTL settings
  const cacheTtlIssuers = document.getElementById('cacheTtlIssuers');
  const cacheTtlTypes = document.getElementById('cacheTtlTypes');
  const cacheTtlIssues = document.getElementById('cacheTtlIssues');
  const monthlyApiLimit = document.getElementById('monthlyApiLimit');
  if (cacheTtlIssuers) cacheTtlIssuers.value = AppState.settings.cacheTtlIssuers != null ? AppState.settings.cacheTtlIssuers : 90;
  if (cacheTtlTypes) cacheTtlTypes.value = AppState.settings.cacheTtlTypes != null ? AppState.settings.cacheTtlTypes : 30;
  if (cacheTtlIssues) cacheTtlIssues.value = AppState.settings.cacheTtlIssues != null ? AppState.settings.cacheTtlIssues : 30;
  if (monthlyApiLimit) monthlyApiLimit.value = AppState.settings.monthlyApiLimit || 2000;

  // Load log level setting
  const logLevelSelect = document.getElementById('logLevelSelect');
  if (logLevelSelect) logLevelSelect.value = AppState.settings.logLevel || 'info';

  // Load current monthly usage for manual adjustment field
  loadMonthlyUsageForSettings();

  // Load default collection path
  loadDefaultCollectionDisplay();

  // Load license management display
  loadLicenseManagementDisplay();

  // Load cache location settings
  loadCacheLocationSettings();
}

/**
 * Load and display cache location settings
 * @async
 */
async function loadCacheLocationSettings() {
  try {
    const result = await window.electronAPI.cacheSettings.get();
    if (result) {
      // Store current cache settings for comparison
      AppState.currentCacheSettings = {
        location: result.location || 'default',
        customPath: result.customPath || '',
        lockTimeout: result.lockTimeout || 30000
      };

      // Display default cache path
      const defaultPathEl = document.getElementById('defaultCacheLocationPath');
      if (defaultPathEl) {
        defaultPathEl.textContent = result.defaultPath;
      }

      // Set cache location radio buttons
      const locationRadios = document.getElementsByName('cacheLocation');
      locationRadios.forEach(radio => {
        radio.checked = radio.value === (result.location || 'default');
      });

      // Set custom path if available
      const customPathInput = document.getElementById('customCacheLocationInput');
      if (customPathInput) {
        customPathInput.value = result.customPath || '';
      }

      // Set lock timeout
      const lockTimeoutInput = document.getElementById('cacheLockTimeout');
      if (lockTimeoutInput) {
        lockTimeoutInput.value = (result.lockTimeout || 30000) / 1000; // Convert ms to seconds
      }

      // Update custom controls visibility
      updateCacheLocationControlsVisibility();

      // Check for shared config at the configured location
      checkAndShowSharedConfigBanner();
    }
  } catch (error) {
    console.warn('Error loading cache location settings:', error.message);
  }
}

/**
 * Update visibility of custom cache location controls based on selected radio button
 */
function updateCacheLocationControlsVisibility() {
  const customRadio = document.querySelector('input[name="cacheLocation"][value="custom"]');
  const customControls = document.getElementById('customCacheLocationControls');
  if (customControls) {
    customControls.style.display = customRadio && customRadio.checked ? 'block' : 'none';
  }
}

/**
 * Check for a shared config file at the configured cache location.
 * Shows the import banner if the shared config is newer than the last import.
 * @async
 */
async function checkAndShowSharedConfigBanner() {
  try {
    const result = await window.electronAPI.getSharedConfig();
    const banner = document.getElementById('sharedConfigBanner');
    const dateSpan = document.getElementById('sharedConfigDate');
    if (!banner) return;

    if (!result.found) {
      banner.style.display = 'none';
      return;
    }

    const appSettings = await window.electronAPI.getAppSettings();
    const lastImport = appSettings.settings?.lastSharedConfigImport;
    const sharedDate = new Date(result.exportedAt);

    if (!lastImport || sharedDate > new Date(lastImport)) {
      if (dateSpan) dateSpan.textContent = sharedDate.toLocaleDateString();
      banner.style.display = '';
    } else {
      banner.style.display = 'none';
    }
  } catch (e) {
    console.error('Error checking shared config:', e);
  }
}

/**
 * Load current monthly usage into the manual adjustment field in settings
 * @async
 */
async function loadMonthlyUsageForSettings() {
  try {
    const result = await window.electronAPI.getMonthlyUsage();
    if (result.success) {
      const usageInput = document.getElementById('currentMonthUsage');
      if (usageInput) {
        usageInput.value = result.usage.total || 0;
      }
    }
  } catch (error) {
    console.warn('Error loading monthly usage for settings:', error.message);
  }
}

/**
 * Load and display the default collection path in settings
 */
async function loadDefaultCollectionDisplay() {
  try {
    const result = await window.electronAPI.getDefaultCollection();
    updateDefaultCollectionUI(result.path);
  } catch (error) {
    console.error('Error loading default collection:', error);
    updateDefaultCollectionUI(null);
  }
}

/**
 * Update the default collection UI elements
 * @param {string|null} path - The default collection path or null if not set
 */
function updateDefaultCollectionUI(path) {
  const displayEl = document.getElementById('defaultCollectionPath');
  const clearBtn = document.getElementById('clearDefaultCollectionBtn');
  const useCurrentBtn = document.getElementById('useCurrentAsDefaultBtn');

  if (path) {
    // Extract just the filename for cleaner display
    const filename = path.split(/[\\/]/).pop();
    displayEl.innerHTML = `<strong>${filename}</strong><br><small style="color: var(--text-secondary, #666);">${path}</small>`;
    clearBtn.style.display = 'inline-block';
  } else {
    displayEl.innerHTML = '<em>No default collection set</em>';
    clearBtn.style.display = 'none';
  }

  // Show "Use Current Collection" button only if a collection is loaded and differs from default
  if (AppState.collectionPath && AppState.collectionPath !== path) {
    useCurrentBtn.style.display = 'inline-block';
  } else {
    useCurrentBtn.style.display = 'none';
  }
}

/**
 * Load and display license management information in settings
 */
async function loadLicenseManagementDisplay() {
  const groupEl = document.getElementById('licenseManagementGroup');
  const entryFormEl = document.getElementById('licenseEntryForm');
  const infoEl = document.getElementById('licenseInfoDisplay');
  const actionsEl = document.getElementById('licenseActions');
  const actionsHelpEl = document.getElementById('licenseActionsHelp');

  if (!groupEl || !entryFormEl || !infoEl || !actionsEl) return;

  try {
    const result = await window.electronAPI.getSupporterStatus();

    if (!result.success) {
      // Error getting status - show entry form by default
      entryFormEl.style.display = 'block';
      infoEl.style.display = 'none';
      actionsEl.style.display = 'none';
      if (actionsHelpEl) actionsHelpEl.style.display = 'none';
      return;
    }

    const supporter = result.supporter;

    if (!supporter?.isSupporter) {
      // No license - show entry form
      entryFormEl.style.display = 'block';
      infoEl.style.display = 'none';
      actionsEl.style.display = 'none';
      if (actionsHelpEl) actionsHelpEl.style.display = 'none';

      // Clear any previous messages
      const messageEl = document.getElementById('settingsLicenseMessage');
      if (messageEl) messageEl.textContent = '';
      return;
    }

    // Has license - show info display and actions
    entryFormEl.style.display = 'none';
    infoEl.style.display = 'block';
    actionsEl.style.display = 'block';
    if (actionsHelpEl) actionsHelpEl.style.display = 'block';

    const deviceLabel = supporter.deviceLabel || 'Unknown';
    const activatedDate = supporter.validatedAt
      ? new Date(supporter.validatedAt).toLocaleDateString()
      : 'Unknown';
    const activationId = supporter.activationId || 'Not available';

    infoEl.innerHTML = `
      <div style="background: var(--bg-secondary, #f5f5f5); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="display: inline-block; padding: 4px 12px; background: linear-gradient(135deg, #FFD700, #FFA500); color: #333; border-radius: 4px; font-size: 0.85em; font-weight: bold;">Active Supporter</span>
        </div>
        <table style="width: 100%; font-size: 0.9em;">
          <tr>
            <td style="padding: 5px 0; color: var(--text-secondary, #666); width: 130px;">Device Label:</td>
            <td style="padding: 5px 0;"><code>${deviceLabel}</code></td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: var(--text-secondary, #666);">Activation Date:</td>
            <td style="padding: 5px 0;">${activatedDate}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: var(--text-secondary, #666);">Activation ID:</td>
            <td style="padding: 5px 0;"><code style="font-size: 0.8em; word-break: break-all;">${activationId}</code></td>
          </tr>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Error loading license info:', error);
    // On error, show entry form
    entryFormEl.style.display = 'block';
    infoEl.style.display = 'none';
    actionsEl.style.display = 'none';
    if (actionsHelpEl) actionsHelpEl.style.display = 'none';
  }
}

function updateBackupControlsState() {
  const autoBackup = document.getElementById('autoBackupCheckbox').checked;
  const unlimited = document.getElementById('unlimitedBackupsCheckbox').checked;

  document.getElementById('maxBackupsInput').disabled = !autoBackup || unlimited;
  document.getElementById('unlimitedBackupsCheckbox').disabled = !autoBackup;
  document.getElementById('backupDisabledWarning').style.display = autoBackup ? 'none' : 'block';
}

document.getElementById('autoBackupCheckbox').addEventListener('change', updateBackupControlsState);
document.getElementById('unlimitedBackupsCheckbox').addEventListener('change', updateBackupControlsState);

document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
  const unlimited = document.getElementById('unlimitedBackupsCheckbox').checked;
  const settings = {
    apiKey: document.getElementById('apiKeyInput').value,
    searchDelay: parseInt(document.getElementById('requestDelayInput').value),
    imageHandling: document.querySelector('input[name="imageHandling"]:checked').value,
    autoBackup: document.getElementById('autoBackupCheckbox').checked,
    maxBackups: unlimited ? 0 : Math.max(0, parseInt(document.getElementById('maxBackupsInput').value) || 5),
    fieldMapping: AppState.settings?.fieldMapping,
    cacheTtlIssuers: parseInt(document.getElementById('cacheTtlIssuers').value) || 0,
    cacheTtlTypes: parseInt(document.getElementById('cacheTtlTypes').value) || 0,
    cacheTtlIssues: parseInt(document.getElementById('cacheTtlIssues').value) || 0,
    monthlyApiLimit: parseInt(document.getElementById('monthlyApiLimit').value) || 2000,
    logLevel: document.getElementById('logLevelSelect').value
  };

  // Save monthly limit to cache as well
  try {
    await window.electronAPI.setMonthlyUsage(parseInt(document.getElementById('monthlyApiLimit').value) || 2000);
  } catch (e) { /* non-fatal */ }

  // If manual usage was adjusted, update it
  const manualUsageInput = document.getElementById('currentMonthUsage');
  if (manualUsageInput) {
    const manualTotal = parseInt(manualUsageInput.value);
    if (!isNaN(manualTotal) && manualTotal >= 0) {
      try {
        await window.electronAPI.setMonthlyUsageTotal(manualTotal);
      } catch (e) { /* non-fatal */ }
    }
  }

  // Handle cache location settings with collision detection
  const cacheLocation = document.querySelector('input[name="cacheLocation"]:checked').value;
  const customCachePath = document.getElementById('customCacheLocationInput').value;
  const cacheLockTimeout = parseInt(document.getElementById('cacheLockTimeout').value) * 1000; // Convert seconds to ms

  // Validate custom path if selected
  if (cacheLocation === 'custom' && !customCachePath) {
    showModal('Error', 'Please select a custom cache location or choose the default location.');
    return;
  }

  // Only run collision detection if cache location actually changed
  const currentSettings = AppState.currentCacheSettings;
  const locationChanged = !currentSettings ||
    currentSettings.location !== cacheLocation ||
    (cacheLocation === 'custom' && currentSettings.customPath !== customCachePath);

  if (locationChanged) {
    // Cache location changed - run collision detection
    const cacheSuccess = await handleCacheLocationChange(cacheLocation, customCachePath, cacheLockTimeout);
    if (!cacheSuccess) {
      return; // User will handle via modal dialogs
    }
  } else {
    // Cache location unchanged - just save the lock timeout if it changed
    if (currentSettings && currentSettings.lockTimeout !== cacheLockTimeout) {
      await saveCacheLocationSettings(cacheLocation, customCachePath, cacheLockTimeout, false);
    }
  }

  const result = await window.electronAPI.saveAppSettings(settings);

  if (result.success) {
    showModal('Success', 'Settings saved successfully!');
    AppState.settings = settings;
    // Refresh footer monthly display
    refreshSessionCounter();
  } else {
    showModal('Error', 'Failed to save settings');
  }
});

document.getElementById('closeSettingsBtn').addEventListener('click', () => {
  showScreen(AppState.collectionPath ? 'collection' : 'welcome');
});

document.getElementById('resetSettingsBtn').addEventListener('click', async () => {
  const defaultSettings = {
    apiKey: AppState.settings?.apiKey || '',  // Preserve API key
    searchDelay: 2000,
    imageHandling: 'url',
    autoBackup: true,
    maxBackups: 5,
    cacheTtlIssuers: 90,
    cacheTtlTypes: 30,
    cacheTtlIssues: 30,
    monthlyApiLimit: 2000,
    logLevel: 'info'
  };

  const result = await window.electronAPI.saveAppSettings(defaultSettings);
  if (result.success) {
    AppState.settings = defaultSettings;
    loadSettingsScreen();
    showModal('Success', 'Settings reset to defaults (API key preserved)');
  } else {
    showModal('Error', 'Failed to reset settings');
  }
});

// Clear API Cache button handler
document.getElementById('clearApiCacheBtn').addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.clearApiCache();
    if (result.success) {
      showModal('Success', 'API cache cleared. Monthly usage tracking is preserved.');
    } else {
      showModal('Error', 'Failed to clear API cache');
    }
  } catch (error) {
    showModal('Error', 'Failed to clear API cache: ' + error.message);
  }
});

// Download Log File button handler
document.getElementById('downloadLogBtn').addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.exportLogFile();
    if (result.success) {
      showModal('Success', 'Log file saved successfully.');
    }
  } catch (error) {
    showModal('Error', 'Failed to save log file: ' + error.message);
  }
});

// Numista Dashboard link handler
document.getElementById('numistaDashboardLink').addEventListener('click', (e) => {
  e.preventDefault();
  window.electronAPI.openExternal('https://en.numista.com/api/dashboard.php');
});


// =============================================================================
// Cache Collision Detection
// =============================================================================

// Cache collision detection state
let pendingCacheLocationChange = null;

/**
 * Handle cache location change with collision detection
 * @param {string} cacheLocation - 'default' or 'custom'
 * @param {string} customCachePath - Custom path if cacheLocation is 'custom'
 * @param {number} cacheLockTimeout - Lock timeout in milliseconds
 * @returns {Promise<boolean>} True if successful, false if user needs to handle via modal
 */
async function handleCacheLocationChange(cacheLocation, customCachePath, cacheLockTimeout) {
  // Store pending change
  pendingCacheLocationChange = { cacheLocation, customCachePath, cacheLockTimeout };

  // Only check collision for custom locations
  if (cacheLocation === 'custom' && customCachePath) {
    const validation = await window.electronAPI.cacheSettings.validatePath(customCachePath);

    if (!validation.valid) {
      showModal('Error', `Invalid cache location: ${validation.reason}\n\nPlease select a different folder.`);
      return false;
    }

    // Check for collision
    if (validation.collision && validation.collision.cacheExists) {
      const lockStatus = validation.collision.lockStatus;

      if (lockStatus === 'locked') {
        // Cache is actively locked - show locked modal
        showCacheLockedModal(validation.collision);
        return false;
      } else {
        // Cache exists but not locked - show collision modal
        showCacheCollisionModal(validation.collision, customCachePath);
        return false;
      }
    }
  }

  // No collision, proceed with save
  return await saveCacheLocationSettings(cacheLocation, customCachePath, cacheLockTimeout, false);
}

/**
 * Show cache collision modal
 * @param {Object} collision - Collision information from validation
 * @param {string} cachePath - Path to cache directory
 */
function showCacheCollisionModal(collision, cachePath) {
  const modal = document.getElementById('cacheCollisionModal');

  // Populate cache path
  document.getElementById('collisionCachePath').textContent = cachePath;

  // Populate cache details
  const detailsDiv = document.getElementById('collisionCacheDetails');
  const metadata = collision.cacheMetadata;

  if (metadata && metadata.valid) {
    detailsDiv.innerHTML = `
      <strong>Cache Information:</strong>
      <ul style="margin-top: 8px; margin-left: 20px;">
        <li>Entries: ${metadata.entryCount || 0} cached items</li>
        <li>Size: ${formatBytes(metadata.size)}</li>
        <li>Last Modified: ${new Date(metadata.lastModified).toLocaleString()}</li>
      </ul>
    `;
  } else if (metadata) {
    detailsDiv.innerHTML = '<p style="color: #d97706;">' + UI_STRINGS.ICON_WARNING + ' Cache file exists but may be corrupted or invalid.</p>';
  }

  // Show stale lock warning if applicable
  if (collision.lockStatus === 'stale') {
    const lockWarning = document.getElementById('collisionLockWarning');
    const lockText = document.getElementById('lockWarningText');
    lockText.textContent = 'The cache has a stale lock file (older than 5 minutes), which will be automatically cleaned up when used.';
    lockWarning.style.display = 'block';
  } else {
    document.getElementById('collisionLockWarning').style.display = 'none';
  }

  modal.style.display = 'block';
}

/**
 * Show cache locked modal
 * @param {Object} collision - Collision information with lock owner details
 */
function showCacheLockedModal(collision) {
  const modal = document.getElementById('cacheLockedModal');

  // Populate lock owner info
  const lockOwnerDiv = document.getElementById('lockOwnerInfo');
  const owner = collision.lockOwner;

  if (owner) {
    const lockAge = formatDuration(collision.lockAge);
    lockOwnerDiv.innerHTML = `
      <strong>Locked by:</strong> ${owner.hostname}<br>
      <strong>Process ID:</strong> ${owner.pid}<br>
      <strong>Since:</strong> ${owner.acquiredAt.toLocaleString()} (${lockAge} ago)
    `;
  }

  modal.style.display = 'block';
}

/**
 * Save cache location settings
 * @param {string} cacheLocation - 'default' or 'custom'
 * @param {string} customCachePath - Custom path if applicable
 * @param {number} cacheLockTimeout - Lock timeout in milliseconds
 * @param {boolean} useExisting - If true, don't migrate, just point to existing cache
 * @returns {Promise<boolean>} True if successful
 */
async function saveCacheLocationSettings(cacheLocation, customCachePath, cacheLockTimeout, useExisting) {
  try {
    // Save cache location settings first
    await window.electronAPI.cacheSettings.set({
      location: cacheLocation,
      customPath: customCachePath,
      lockTimeout: cacheLockTimeout
    });

    // If not using existing, perform migration
    if (!useExisting) {
      const migrationResult = await window.electronAPI.cacheSettings.migrate(cacheLocation, customCachePath);
      if (!migrationResult.success) {
        showModal('Warning', `Settings saved, but cache migration failed: ${migrationResult.error}\n\nThe cache will be rebuilt at the new location.`);
      }
    }

    showStatus('Cache location settings saved');
    return true;
  } catch (error) {
    console.error('Error saving cache settings:', error);
    showModal('Error', 'Failed to save cache location settings: ' + error.message);
    return false;
  }
}

// Event handlers for collision modal
document.getElementById('useExistingCacheBtn').addEventListener('click', async () => {
  document.getElementById('cacheCollisionModal').style.display = 'none';

  if (pendingCacheLocationChange) {
    const { cacheLocation, customCachePath, cacheLockTimeout } = pendingCacheLocationChange;
    const success = await saveCacheLocationSettings(cacheLocation, customCachePath, cacheLockTimeout, true);
    if (success) {
      showStatus('Now using existing cache at selected location');
    }
    pendingCacheLocationChange = null;
  }
});

document.getElementById('selectDifferentLocationBtn').addEventListener('click', () => {
  document.getElementById('cacheCollisionModal').style.display = 'none';
  pendingCacheLocationChange = null;
  // Re-open browse dialog
  document.getElementById('browseCacheLocationBtn').click();
});

document.getElementById('cancelCollisionBtn').addEventListener('click', () => {
  document.getElementById('cacheCollisionModal').style.display = 'none';
  pendingCacheLocationChange = null;
});

// Close button for collision modal
document.getElementById('cacheCollisionCloseBtn').addEventListener('click', () => {
  document.getElementById('cacheCollisionModal').style.display = 'none';
  pendingCacheLocationChange = null;
});

// Event handlers for locked cache modal
document.getElementById('retryLockedCacheBtn').addEventListener('click', async () => {
  document.getElementById('cacheLockedModal').style.display = 'none';

  if (pendingCacheLocationChange) {
    const { cacheLocation, customCachePath, cacheLockTimeout } = pendingCacheLocationChange;
    // Retry validation - will re-show collision modal or proceed
    await handleCacheLocationChange(cacheLocation, customCachePath, cacheLockTimeout);
  }
});

document.getElementById('selectDifferentFromLockedBtn').addEventListener('click', () => {
  document.getElementById('cacheLockedModal').style.display = 'none';
  pendingCacheLocationChange = null;
  document.getElementById('browseCacheLocationBtn').click();
});

document.getElementById('cancelLockedBtn').addEventListener('click', () => {
  document.getElementById('cacheLockedModal').style.display = 'none';
  pendingCacheLocationChange = null;
});

// Close button for locked modal
document.getElementById('cacheLockedCloseBtn').addEventListener('click', () => {
  document.getElementById('cacheLockedModal').style.display = 'none';
  pendingCacheLocationChange = null;
});

// Helper functions
/**
 * Format bytes to human-readable size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Format milliseconds to human-readable duration
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// =============================================================================
// Cache Location Settings
// =============================================================================

// Cache location radio button change handler
document.getElementsByName('cacheLocation').forEach(radio => {
  radio.addEventListener('change', async (e) => {
    if (e.target.value === 'custom' && e.target.disabled) {
      e.preventDefault();
      document.querySelector('input[name="cacheLocation"][value="default"]').checked = true;
      return;
    }
    updateCacheLocationControlsVisibility();
  });
});

// Upgrade link for custom cache location premium gate
const cacheLocationUpgradeLink = document.getElementById('cacheLocationUpgradeLink');
if (cacheLocationUpgradeLink) {
  cacheLocationUpgradeLink.addEventListener('click', (e) => {
    e.preventDefault();
    showUpgradeModal('Multi-machine sync requires a Supporter Edition license.', null, '1.0.0');
  });
}

// Wire shared config banner buttons
document.getElementById('importSharedConfigBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const result = await window.electronAPI.applySharedConfig();
  if (result.success) {
    document.getElementById('sharedConfigBanner').style.display = 'none';
    const appResult = await window.electronAPI.getAppSettings();
    if (appResult.success) AppState.settings = appResult.settings;
    loadSettingsScreen();
    showStatus('Shared settings imported successfully.');
  } else {
    showModal('Import Failed', 'Could not import shared settings: ' + (result.error || 'Unknown error'));
  }
});

document.getElementById('dismissSharedConfigBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  await window.electronAPI.saveAppSettings({ lastSharedConfigImport: new Date().toISOString() });
  document.getElementById('sharedConfigBanner').style.display = 'none';
});

/**
 * Bootstrap import — browse for a shared folder and import settings + activate license.
 * Visible to all users regardless of supporter status.
 * The import is atomic: if license activation fails, nothing is written.
 */
document.getElementById('importFromFolderBtn')?.addEventListener('click', async () => {
  const statusEl = document.getElementById('importFromFolderStatus');

  const folderPath = await window.electronAPI.cacheSettings.browseDirectory();
  if (!folderPath) return;

  statusEl.textContent = 'Activating license and importing settings...';
  statusEl.style.color = '';
  statusEl.style.display = '';

  const result = await window.electronAPI.importFromFolder(folderPath);

  if (result.success) {
    statusEl.style.display = 'none';
    loadSettingsScreen();
    await updateVersionBadge();
    showStatus('Settings imported and license activated. You can now configure the cache location under Settings \u2192 Cache.');
  } else {
    statusEl.textContent = result.error || 'Import failed.';
    statusEl.style.color = '#c0392b';
  }
});

// Browse cache location button handler
document.getElementById('browseCacheLocationBtn').addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.cacheSettings.browseDirectory();
    if (result) {
      // Validate the selected path
      const validation = await window.electronAPI.cacheSettings.validatePath(result);
      if (validation.valid) {
        document.getElementById('customCacheLocationInput').value = result;
        showStatus('Cache location selected');
      } else {
        showModal('Invalid Location', `Cannot use this location: ${validation.reason}\n\nPlease select a different folder with read/write permissions.`);
      }
    }
  } catch (error) {
    console.error('Error browsing for cache location:', error);
    showModal('Error', 'Failed to browse for cache location: ' + error.message);
  }
});

// =============================================================================
// Default Collection Settings
// =============================================================================

document.getElementById('browseDefaultCollectionBtn').addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.browseDefaultCollection();
    if (result.success && result.path) {
      const setResult = await window.electronAPI.setDefaultCollection(result.path);
      if (setResult.success) {
        updateDefaultCollectionUI(result.path);
        showStatus('Default collection set successfully');
      } else {
        showModal('Error', 'Failed to save default collection setting');
      }
    }
  } catch (error) {
    console.error('Error browsing for default collection:', error);
    showModal('Error', 'Failed to browse for collection: ' + error.message);
  }
});

document.getElementById('useCurrentAsDefaultBtn').addEventListener('click', async () => {
  if (!AppState.collectionPath) {
    showModal('Error', 'No collection is currently loaded');
    return;
  }

  try {
    const result = await window.electronAPI.setDefaultCollection(AppState.collectionPath);
    if (result.success) {
      updateDefaultCollectionUI(AppState.collectionPath);
      showStatus('Current collection set as default');
    } else {
      showModal('Error', 'Failed to save default collection setting');
    }
  } catch (error) {
    console.error('Error setting current as default:', error);
    showModal('Error', 'Failed to set default collection: ' + error.message);
  }
});

document.getElementById('clearDefaultCollectionBtn').addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.setDefaultCollection('');
    if (result.success) {
      updateDefaultCollectionUI(null);
      showStatus('Default collection cleared');
    } else {
      showModal('Error', 'Failed to clear default collection setting');
    }
  } catch (error) {
    console.error('Error clearing default collection:', error);
    showModal('Error', 'Failed to clear default collection: ' + error.message);
  }
});

// =============================================================================
// License Management Settings
// =============================================================================

document.getElementById('revalidateLicenseBtn').addEventListener('click', async () => {
  const btn = document.getElementById('revalidateLicenseBtn');
  btn.disabled = true;
  btn.textContent = 'Validating...';

  try {
    const result = await window.electronAPI.validateLicense();

    if (result.valid) {
      showModal('License Valid', 'Your license has been validated successfully.');
    } else {
      showModal('License Invalid', `Your license is no longer valid: ${result.message}`);
      // Refresh the display as license may have been cleared
      loadLicenseManagementDisplay();
    }
  } catch (error) {
    console.error('Error validating license:', error);
    showModal('Error', 'Failed to validate license: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Validate License';
  }
});

document.getElementById('deactivateLicenseBtn').addEventListener('click', async () => {
  const confirmed = await showModal(
    'Deactivate License?',
    `<p>Are you sure you want to deactivate your license on this device?</p>
     <p>This will:</p>
     <ul>
       <li>Remove the license from this computer</li>
       <li>Free up one of your 5 device activation slots</li>
       <li>Allow you to activate on a different device</li>
     </ul>
     <p>You can re-activate on this device later using the same license key.</p>`,
    true  // showCancel
  );

  if (!confirmed) return;

  const btn = document.getElementById('deactivateLicenseBtn');
  btn.disabled = true;
  btn.textContent = 'Deactivating...';

  try {
    const result = await window.electronAPI.deactivateLicense();

    if (result.success) {
      showModal('License Deactivated', result.message);
      // Refresh the settings display
      const settingsResult = await window.electronAPI.getAppSettings();
      if (settingsResult.success) {
        AppState.settings = settingsResult.settings;
        loadSettingsScreen();
      }
      // Update all license-related UI (badge, premium buttons, menu)
      updateVersionBadge();
    } else {
      showModal('Error', result.message);
    }
  } catch (error) {
    console.error('Error deactivating license:', error);
    showModal('Error', 'Failed to deactivate license: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Deactivate License';
  }
});

// =============================================================================
// Settings Screen - License Entry Event Handlers
// =============================================================================

/**
 * Handle license activation from Settings screen
 */
document.getElementById('settingsActivateLicenseBtn').addEventListener('click', async () => {
  const keyInput = document.getElementById('settingsLicenseKeyInput');
  const activateBtn = document.getElementById('settingsActivateLicenseBtn');
  const messageEl = document.getElementById('settingsLicenseMessage');

  if (!keyInput || !activateBtn || !messageEl) return;

  const key = keyInput.value.trim();
  if (!key) {
    messageEl.style.color = 'var(--error, #dc3545)';
    messageEl.textContent = 'Please enter a license key';
    return;
  }

  // Disable button and show loading state
  activateBtn.disabled = true;
  activateBtn.textContent = 'Validating...';
  messageEl.textContent = '';

  try {
    const result = await window.electronAPI.validateLicenseKey(key);

    if (result.valid) {
      // Success
      messageEl.style.color = 'var(--success, #28a745)';
      messageEl.textContent = result.message || 'License activated successfully!';

      // Clear input
      keyInput.value = '';

      // Wait a moment, then refresh the display and update version badge
      setTimeout(async () => {
        await loadLicenseManagementDisplay();
        updateVersionBadge();
      }, 1500);
    } else {
      // Validation failed
      messageEl.style.color = 'var(--error, #dc3545)';
      messageEl.textContent = result.message || 'License validation failed';
      activateBtn.disabled = false;
      activateBtn.textContent = 'Activate License';
    }
  } catch (error) {
    console.error('Error validating license:', error);
    messageEl.style.color = 'var(--error, #dc3545)';
    messageEl.textContent = 'Error validating license: ' + error.message;
    activateBtn.disabled = false;
    activateBtn.textContent = 'Activate License';
  }
});

/**
 * Handle "Enter" key press in license input field
 */
document.getElementById('settingsLicenseKeyInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('settingsActivateLicenseBtn').click();
  }
});

/**
 * Handle purchase link click
 */
document.getElementById('settingsPurchaseLicenseLink').addEventListener('click', async (e) => {
  e.preventDefault();

  let checkoutUrl = '';
  try {
    const result = await window.electronAPI.getSupporterStatus();
    if (result.success) {
      checkoutUrl = result.polarConfig?.checkoutUrl || '';
    }
  } catch (error) {
    console.error('Error getting checkout URL:', error);
  }

  const url = checkoutUrl || 'https://buy.polar.sh/polar_cl_4hKjIXXM8bsjk9MivMFIvtXbg7zWswAzEAVJK2TVZZ0';
  window.electronAPI.openExternal(url);
});

// =============================================================================
// Periodic License Validation
// =============================================================================

/**
 * Validate the license periodically to ensure it's still active
 * Runs on app startup and every 7 days while app is running
 */
async function performPeriodicLicenseValidation() {
  try {
    const statusResult = await window.electronAPI.getSupporterStatus();

    if (!statusResult.success || !statusResult.supporter?.isSupporter) {
      return; // No license to validate
    }

    const supporter = statusResult.supporter;
    const lastValidated = supporter.validatedAt ? new Date(supporter.validatedAt) : null;
    const now = new Date();

    // Skip if validated within last 7 days
    if (lastValidated) {
      const daysSinceValidation = (now - lastValidated) / (1000 * 60 * 60 * 24);
      if (daysSinceValidation < 7) {
        console.log(`License validated ${daysSinceValidation.toFixed(1)} days ago, skipping`);
        return;
      }
    }

    console.log('Performing periodic license validation...');
    const result = await window.electronAPI.validateLicense();

    if (result.success === false) {
      // Network error - handle offline gracefully
      if (!supporter.offlineSkipUsed) {
        // First offline attempt - allow grace period
        console.log('License validation failed (offline), using grace period');
        await window.electronAPI.updateSupporterStatus({ offlineSkipUsed: true });
      } else {
        // Already used offline skip - notify user
        showModal(
          'License Validation Required',
          `<p>Unable to validate your license. Please connect to the internet to verify your license status.</p>
           <p>If this problem persists, check your license at <a href="#" onclick="window.electronAPI.openExternal('https://sandbox.polar.sh'); return false;">sandbox.polar.sh</a></p>`
        );
      }
      return;
    }

    if (!result.valid && result.status) {
      // License was revoked/disabled - notify user
      showModal(
        'License Status Changed',
        `<p>Your license status has changed: <strong>${result.status}</strong></p>
         <p>${result.message}</p>
         <p>Please check your license at <a href="#" onclick="window.electronAPI.openExternal('https://sandbox.polar.sh'); return false;">sandbox.polar.sh</a></p>`
      );
    } else if (result.valid) {
      console.log('License validation successful');
    }
  } catch (error) {
    console.error('Periodic license validation failed:', error);
    // Silently fail - don't bother user if network is unavailable
  }
}

// Validation interval ID for cleanup
let licenseValidationInterval = null;

/**
 * Start periodic license validation (every 7 days)
 */
function startPeriodicLicenseValidation() {
  // Validate on startup (with slight delay to not block UI)
  setTimeout(performPeriodicLicenseValidation, 5000);

  // Then every 7 days (check daily, but validation only runs if 7 days passed)
  licenseValidationInterval = setInterval(
    performPeriodicLicenseValidation,
    24 * 60 * 60 * 1000  // Check daily
  );
}

/**
 * Update all license-related UI elements based on supporter status
 * - Version badge in header
 * - Premium feature buttons (locked/unlocked state)
 * - Menu state (show/hide purchase option)
 */
async function updateVersionBadge() {
  let isSupporter = false;
  let checkoutUrl = '';

  try {
    const result = await window.electronAPI.getSupporterStatus();
    isSupporter = result.success && result.supporter?.isSupporter;
    checkoutUrl = result.polarConfig?.checkoutUrl || '';
  } catch (e) {
    console.error('Error getting supporter status:', e);
  }

  // Update version badge
  const badge = document.getElementById('versionBadge');
  if (badge) {
    if (isSupporter) {
      badge.textContent = 'Supporter Edition';
      badge.classList.remove('version-badge-free');
      badge.classList.add('version-badge-supporter');
    } else {
      badge.textContent = 'Free Version';
      badge.classList.remove('version-badge-supporter');
      badge.classList.add('version-badge-free');
    }
  }

  // Update premium feature buttons
  const fastPricingBtn = document.getElementById('fastPricingBtn');
  if (fastPricingBtn) {
    const iconSpan = fastPricingBtn.querySelector('.premium-icon');
    if (isSupporter) {
      fastPricingBtn.classList.remove('btn-premium-locked');
      fastPricingBtn.classList.add('btn-premium-unlocked');
      if (iconSpan) iconSpan.style.display = 'none';
    } else {
      fastPricingBtn.classList.remove('btn-premium-unlocked');
      fastPricingBtn.classList.add('btn-premium-locked');
      if (iconSpan) iconSpan.style.display = '';
    }
  }

  // Update cache location premium gate (multi-machine sync)
  const customCacheRadio = document.getElementById('customCacheLocationRadio');
  const cacheLocationPremiumBadge = document.getElementById('cacheLocationPremiumBadge');
  const cacheLocationPremiumNote = document.getElementById('cacheLocationPremiumNote');
  if (customCacheRadio) {
    customCacheRadio.disabled = !isSupporter;
    if (cacheLocationPremiumBadge) cacheLocationPremiumBadge.style.display = isSupporter ? 'none' : '';
    if (cacheLocationPremiumNote) cacheLocationPremiumNote.style.display = isSupporter ? 'none' : '';
  }

  // Update menu state to show/hide purchase option
  updateMenuState({ isSupporter });
}

/**
 * Open the purchase license URL
 */
async function openPurchaseLicenseUrl() {
  try {
    const result = await window.electronAPI.getSupporterStatus();
    const checkoutUrl = result.polarConfig?.checkoutUrl || 'https://buy.polar.sh/polar_cl_4hKjIXXM8bsjk9MivMFIvtXbg7zWswAzEAVJK2TVZZ0';
    window.electronAPI.openExternal(checkoutUrl);
  } catch (e) {
    console.error('Error opening purchase URL:', e);
    // Fallback to sandbox URL
    window.electronAPI.openExternal('https://buy.polar.sh/polar_cl_4hKjIXXM8bsjk9MivMFIvtXbg7zWswAzEAVJK2TVZZ0');
  }
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Try to auto-load a default collection if one is configured
 * @returns {Promise<boolean>} True if a collection was auto-loaded
 */
async function tryAutoLoadDefaultCollection() {
  try {
    const result = await window.electronAPI.getDefaultCollection();

    if (!result.success || !result.path) {
      return false;
    }

    // A default collection is configured - try to load it
    console.log('Auto-loading default collection:', result.path);
    showStatus('Loading default collection...');
    showProgress(true, 30);

    const loadResult = await window.electronAPI.loadCollection(result.path);

    if (!loadResult.success) {
      if (loadResult.error === 'cancelled') {
        // User cancelled from the database-in-use dialog
        showProgress(false);
        showStatus('Collection load cancelled');
        return false;
      }

      // Failed to load - show warning but don't block
      console.error('Failed to auto-load default collection:', loadResult.error);
      showProgress(false);
      showStatus('');
      showModal('Auto-Load Failed',
        `Could not load your default collection:<br><br>` +
        `<strong>${result.path}</strong><br><br>` +
        `Error: ${loadResult.error}<br><br>` +
        `The file may have been moved or deleted. You can update or clear the default in Settings.`
      );
      return false;
    }

    // Successfully loaded
    AppState.collectionPath = loadResult.filePath;
    AppState.collection = loadResult.summary;
    AppState.progressStats = loadResult.progress.statistics;

    showProgress(true, 100);
    showStatus(`Loaded collection: ${loadResult.filePath}`);

    await loadCollectionScreen();

    setTimeout(() => {
      showProgress(false);
      showScreen('collection');
    }, 500);

    return true;
  } catch (error) {
    console.error('Error checking default collection:', error);
    return false;
  }
}

// Note: Auto-load is handled in the DOMContentLoaded handler after EULA check

/**
 * Data Settings UI Handler
 * 
 * Manages the data settings modal and UI interactions.
 * Works with settings-manager.js to persist settings.
 */

// This would be integrated into app.js in the renderer process

class DataSettingsUI {
  constructor() {
    this.modal = null;
    this.currentSettings = null;
    this.sessionCallCount = 0;
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for data settings UI
   */
  setupEventListeners() {
    // Open data settings modal
    const dataSettingsBtn = document.getElementById('dataSettingsBtn');
    if (dataSettingsBtn) {
      dataSettingsBtn.addEventListener('click', () => {
        // Close settings dropdown if open
        document.getElementById('settingsDropdownMenu')?.classList.remove('open');
        this.openModal();
      });
    }

    // Close buttons
    const closeBtn = document.getElementById('dataSettingsCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    const cancelBtn = document.getElementById('cancelDataSettingsBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeModal());
    }

    // Save button
    const saveBtn = document.getElementById('saveDataSettingsBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveSettings());
    }

    // Reset to defaults button
    const resetBtn = document.getElementById('resetDataSettingsBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetToDefaults());
    }

    // Checkboxes - update display when changed
    const issueCheckbox = document.getElementById('fetchIssueData');
    const pricingCheckbox = document.getElementById('fetchPricingData');
    
    if (issueCheckbox) {
      issueCheckbox.addEventListener('change', () => this.updateCostDisplay());
    }
    
    if (pricingCheckbox) {
      pricingCheckbox.addEventListener('change', () => this.updateCostDisplay());
    }

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        if (tabName) this.switchTab(tabName);
      });
    });

    // Export/Import field mappings buttons
    const exportFmBtn = document.getElementById('exportFieldMappingsBtn');
    if (exportFmBtn) {
      exportFmBtn.addEventListener('click', () => this.exportFieldMappings());
    }

    const importFmBtn = document.getElementById('importFieldMappingsBtn');
    if (importFmBtn) {
      importFmBtn.addEventListener('click', () => this.importFieldMappings());
    }

    // Bulk toggle buttons
    const enableAllBtn = document.getElementById('fmEnableAllBtn');
    if (enableAllBtn) {
      enableAllBtn.addEventListener('click', () => this.bulkToggle(true));
    }

    const disableAllBtn = document.getElementById('fmDisableAllBtn');
    if (disableAllBtn) {
      disableAllBtn.addEventListener('click', () => this.bulkToggle(false));
    }
  }

  /**
   * Open the data settings modal
   */
  async openModal() {
    this.modal = document.getElementById('dataSettingsModal');
    if (!this.modal) return;

    try {
      // Load current settings from main process
      const settings = await window.api.getSettings();
      this.currentSettings = settings;
      
      // Load currency
      const currency = await window.api.getCurrency();
      
      // Load session call count
      const stats = await window.api.getStatistics();
      this.sessionCallCount = stats.sessionCallCount || 0;
      
      // Update UI with current settings
      this.populateSettings(settings.fetchSettings, currency);
      this.updateCostDisplay();
      
      // Show modal
      this.modal.style.display = 'flex';
      
    } catch (error) {
      console.error('Error opening data settings modal:', error);
      this.showError('Failed to load settings');
    }
  }

  /**
   * Close the modal
   */
  closeModal() {
    if (this.modal) {
      this.modal.style.display = 'none';
      this.modal.classList.remove('modal-wide');
    }
    // Reset field mapping load state so it reloads next time
    this.fieldMappingsLoaded = false;
    this.fieldMappingsDirty = false;
  }

  /**
   * Populate settings in the UI
   */
  populateSettings(fetchSettings, currency) {
    // Basic data checkbox
    const basicCheckbox = document.getElementById('fetchBasicData');
    if (basicCheckbox) {
      basicCheckbox.checked = fetchSettings.basicData !== undefined ? fetchSettings.basicData : true;
    }

    // Issue data
    const issueCheckbox = document.getElementById('fetchIssueData');
    if (issueCheckbox) {
      issueCheckbox.checked = fetchSettings.issueData || false;
    }

    // Pricing data
    const pricingCheckbox = document.getElementById('fetchPricingData');
    if (pricingCheckbox) {
      pricingCheckbox.checked = fetchSettings.pricingData || false;
    }
    
    // Currency selection
    const currencySelect = document.getElementById('pricingCurrency');
    if (currencySelect) {
      currencySelect.value = currency || 'USD';
    }

    // Search category
    const categorySelect = document.getElementById('searchCategory');
    if (categorySelect) {
      categorySelect.value = fetchSettings.searchCategory || 'all';
    }

    // Empty mintmark interpretation (Task 3.12.7)
    const emptyMintmarkValue = fetchSettings.emptyMintmarkInterpretation || 'no_mint_mark';
    const noMintMarkRadio = document.getElementById('emptyMintmarkNoMark');
    const unknownRadio = document.getElementById('emptyMintmarkUnknown');
    if (noMintMarkRadio && unknownRadio) {
      noMintMarkRadio.checked = (emptyMintmarkValue === 'no_mint_mark');
      unknownRadio.checked = (emptyMintmarkValue === 'unknown');
    }

    // Auto-Propagate toggle (Task 3.12.11)
    const autoPropagateCheckbox = document.getElementById('enableAutoPropagate');
    if (autoPropagateCheckbox) {
      autoPropagateCheckbox.checked = fetchSettings.enableAutoPropagate !== false;
    }
  }

  /**
   * Update the cost display based on current selections
   */
  updateCostDisplay() {
    const issueCheckbox = document.getElementById('fetchIssueData');
    const pricingCheckbox = document.getElementById('fetchPricingData');
    
    const basicCheckbox = document.getElementById('fetchBasicData');
    let callsPerCoin = 0;

    if (basicCheckbox && basicCheckbox.checked) {
      callsPerCoin += 2;
    }

    if (issueCheckbox && issueCheckbox.checked) {
      callsPerCoin += 1;
    }

    if (pricingCheckbox && pricingCheckbox.checked) {
      callsPerCoin += 1;
    }
    
    // Update displays
    const callsDisplay = document.getElementById('callsPerCoinDisplay');
    if (callsDisplay) {
      callsDisplay.textContent = `${callsPerCoin} call${callsPerCoin !== 1 ? 's' : ''} per coin`;
    }
    
    const sessionDisplay = document.getElementById('sessionCallsDisplay');
    if (sessionDisplay) {
      sessionDisplay.textContent = `${this.sessionCallCount} call${this.sessionCallCount !== 1 ? 's' : ''} used`;
    }
  }

  /**
   * Save settings
   */
  async saveSettings() {
    try {
      const basicCheckbox = document.getElementById('fetchBasicData');
      const issueCheckbox = document.getElementById('fetchIssueData');
      const pricingCheckbox = document.getElementById('fetchPricingData');
      const currencySelect = document.getElementById('pricingCurrency');

      const categorySelect = document.getElementById('searchCategory');

      // Get empty mintmark interpretation (Task 3.12.7)
      const unknownRadio = document.getElementById('emptyMintmarkUnknown');
      const emptyMintmarkValue = (unknownRadio && unknownRadio.checked) ? 'unknown' : 'no_mint_mark';

      // Get Auto-Propagate setting (Task 3.12.11)
      const autoPropagateCheckbox = document.getElementById('enableAutoPropagate');
      const enableAutoPropagate = autoPropagateCheckbox ? autoPropagateCheckbox.checked : true;

      const newSettings = {
        basicData: basicCheckbox ? basicCheckbox.checked : true,
        issueData: issueCheckbox ? issueCheckbox.checked : false,
        pricingData: pricingCheckbox ? pricingCheckbox.checked : false,
        searchCategory: categorySelect ? categorySelect.value : 'all',
        emptyMintmarkInterpretation: emptyMintmarkValue,
        enableAutoPropagate: enableAutoPropagate
      };
      
      // Save fetch settings to main process
      await window.api.saveFetchSettings(newSettings);
      
      // Save currency separately
      if (currencySelect) {
        await window.api.saveCurrency(currencySelect.value);
      }
      
      // Update status bar and counter strip
      this.updateStatusBarDisplay(newSettings);
      AppState.fetchSettings = newSettings;
      updateProgressStats();

            // Save field mappings if they were loaded and modified
      if (this.fieldMappingsLoaded && this.fieldMappingsDirty) {
        await this.saveFieldMappings();
      }

// Close modal
      this.closeModal();
      
      // Show success message
      this.showSuccess('Data settings saved successfully');
      
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showError('Failed to save settings');
    }
  }

  /**
   * Reset data settings to defaults
   */
  async resetToDefaults() {
    try {
      // If on field mappings tab, reset field mappings specifically
      if (this.activeTab === 'fieldMappingsTab') {
        await this.resetFieldMappingsToDefaults();
        return;
      }

      const result = await window.api.resetSettings();
      if (result.success) {
        // Repopulate the modal with reset values
        this.currentSettings = result.settings;
        this.populateSettings(result.settings.fetchSettings, result.settings.currency || 'USD');

        // Update status bar and counter strip
        this.updateStatusBarDisplay(result.settings.fetchSettings);
        AppState.fetchSettings = result.settings.fetchSettings;
        updateProgressStats();

        this.showSuccess('Settings reset to defaults');
      } else {
        this.showError('Failed to reset settings: ' + result.error);
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      this.showError('Failed to reset settings');
    }
  }

  /**
   * Update status bar to show current fetch settings
   */
  updateStatusBarDisplay(settings) {
    const statusText = document.getElementById('fetchSettingsText');
    if (!statusText) return;
    
    const parts = [];
    let callCount = 0;

    if (settings.basicData) {
      parts.push('Basic');
      callCount += 2;
    }

    if (settings.issueData) {
      parts.push('Issue');
      callCount += 1;
    }

    if (settings.pricingData) {
      parts.push('Pricing');
      callCount += 1;
    }

    if (parts.length === 0) {
      statusText.textContent = 'Fetch: None (0 calls)';
    } else {
      statusText.textContent = `Fetch: ${parts.join(' + ')} (${callCount} calls)`;
    }
  }

  /**
   * Update session call count display
   */
  updateSessionCallDisplay(count) {
    this.sessionCallCount = count;
    
    const sessionText = document.getElementById('sessionCallsText');
    if (sessionText) {
      sessionText.textContent = `Session: ${count} calls`;
    }
    
    // Also update in modal if open
    const sessionDisplay = document.getElementById('sessionCallsDisplay');
    if (sessionDisplay) {
      sessionDisplay.textContent = `${count} call${count !== 1 ? 's' : ''} used`;
    }
  }

  /**
   * Get current fetch settings from UI
   */
  getCurrentSettings() {
    const basicCheckbox = document.getElementById('fetchBasicData');
    const issueCheckbox = document.getElementById('fetchIssueData');
    const pricingCheckbox = document.getElementById('fetchPricingData');

    return {
      basicData: basicCheckbox ? basicCheckbox.checked : true,
      issueData: issueCheckbox ? issueCheckbox.checked : false,
      pricingData: pricingCheckbox ? pricingCheckbox.checked : false
    };
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
      statusMessage.textContent = `${UI_STRINGS.ICON_CHECK} ${message}`;
      statusMessage.style.color = '#27ae60';
      
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 3000);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
      statusMessage.textContent = `${UI_STRINGS.ICON_WARNING} ${message}`;
      statusMessage.style.color = '#e74c3c';
      
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 5000);
    }
  }

  // ===========================================================================
  // Tab Switching
  // ===========================================================================

  switchTab(tabName) {
    this.activeTab = tabName;

    // Toggle tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Toggle tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === tabName);
    });

    // Toggle wide modal class
    const modalEl = document.getElementById('dataSettingsModal');
    if (tabName === 'fieldMappingsTab') {
      modalEl.classList.add('modal-wide');
      // Show export/import buttons
      const exportBtn = document.getElementById('exportFieldMappingsBtn');
      const importBtn = document.getElementById('importFieldMappingsBtn');
      if (exportBtn) exportBtn.style.display = '';
      if (importBtn) importBtn.style.display = '';
      // Load field mappings if not loaded yet
      if (!this.fieldMappingsLoaded) {
        this.loadFieldMappings();
      }
    } else {
      modalEl.classList.remove('modal-wide');
      // Hide export/import buttons
      const exportBtn = document.getElementById('exportFieldMappingsBtn');
      const importBtn = document.getElementById('importFieldMappingsBtn');
      if (exportBtn) exportBtn.style.display = 'none';
      if (importBtn) importBtn.style.display = 'none';
    }
  }

  // ===========================================================================
  // Field Mapping Methods
  // ===========================================================================

  async loadFieldMappings() {
    try {
      const result = await window.api.getFieldMappings();
      if (!result.success) {
        this.showError('Failed to load field mappings: ' + result.error);
        return;
      }
      this.fieldMappings = result.fieldMappings;
      this.availableSources = result.sources;
      this.fieldMappingsLoaded = true;
      this.fieldMappingsDirty = false;

      this.populateCategoryFilter();
      this.renderFieldMappingTable();
    } catch (error) {
      console.error('Error loading field mappings:', error);
      this.showError('Failed to load field mappings');
    }
  }

  populateCategoryFilter() {
    const select = document.getElementById('fmCategoryFilter');
    if (!select || !this.availableSources) return;

    const groups = new Set();
    for (const src of Object.values(this.availableSources)) {
      if (src.group && src.group !== 'System') groups.add(src.group);
    }

    select.innerHTML = '<option value="all">All</option>';
    for (const group of [...groups].sort()) {
      const opt = document.createElement('option');
      opt.value = group;
      opt.textContent = group;
      select.appendChild(opt);
    }

    select.addEventListener('change', () => this.applyFieldFilters());
  }

  renderFieldMappingTable() {
    const tbody = document.getElementById('fmTableBody');
    if (!tbody || !this.fieldMappings || !this.availableSources) return;

    tbody.innerHTML = '';

    // Build grouped source options for the dropdown
    const sourcesByGroup = {};
    for (const [key, src] of Object.entries(this.availableSources)) {
      const group = src.group || 'Other';
      if (!sourcesByGroup[group]) sourcesByGroup[group] = [];
      sourcesByGroup[group].push({ key, ...src });
    }

    const catalogCodes = ['KM', 'Schön', 'Y', 'Numista'];

    for (const [fieldName, config] of Object.entries(this.fieldMappings)) {
      const tr = document.createElement('tr');
      tr.dataset.field = fieldName;
      tr.dataset.sourceGroup = this.getFieldSourceGroup(config.sourceKey);

      if (!config.enabled) tr.classList.add('fm-row-disabled');

      const isImageField = fieldName.match(/img$/);
      const isCatalogField = fieldName.startsWith('catalognum');

      // Enabled toggle
      const tdEnabled = document.createElement('td');
      tdEnabled.className = 'fm-col-enabled';
      tdEnabled.innerHTML = '<label class="fm-toggle"><input type="checkbox" ' +
        (config.enabled ? 'checked' : '') +
        '><span class="fm-toggle-slider"></span></label>';
      const checkbox = tdEnabled.querySelector('input');
      checkbox.addEventListener('change', () => {
        this.toggleField(fieldName, checkbox.checked);
        tr.classList.toggle('fm-row-disabled', !checkbox.checked);
      });
      tr.appendChild(tdEnabled);

      // Field name
      const tdField = document.createElement('td');
      tdField.className = 'fm-col-field';
      tdField.textContent = fieldName;
      tr.appendChild(tdField);

      // Source dropdown
      const tdSource = document.createElement('td');
      tdSource.className = 'fm-col-source';
      const sourceSelect = document.createElement('select');
      sourceSelect.className = 'fm-source-select';

      for (const [group, sources] of Object.entries(sourcesByGroup).sort()) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group;
        for (const src of sources) {
          const opt = document.createElement('option');
          opt.value = src.key;
          opt.textContent = src.displayName;
          if (src.key === config.sourceKey) opt.selected = true;
          optgroup.appendChild(opt);
        }
        sourceSelect.appendChild(optgroup);
      }

      sourceSelect.addEventListener('change', () => {
        this.changeSource(fieldName, sourceSelect.value);
      });
      tdSource.appendChild(sourceSelect);
      if (isImageField) {
        const note = document.createElement('div');
        note.className = 'fm-image-note';
        note.textContent = 'Image download handled separately';
        tdSource.appendChild(note);
      }
      tr.appendChild(tdSource);

      // Catalog code dropdown
      const tdCatalog = document.createElement('td');
      tdCatalog.className = 'fm-col-catalog';
      if (isCatalogField) {
        const catSelect = document.createElement('select');
        catSelect.className = 'fm-catalog-select';

        const emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.textContent = '(none)';
        catSelect.appendChild(emptyOpt);

        for (const code of catalogCodes) {
          const opt = document.createElement('option');
          opt.value = code;
          opt.textContent = code;
          if (code === config.catalogCode) opt.selected = true;
          catSelect.appendChild(opt);
        }
        catSelect.addEventListener('change', () => {
          this.changeCatalogCode(fieldName, catSelect.value || null);
        });
        tdCatalog.appendChild(catSelect);
      } else {
        tdCatalog.textContent = '-';
        tdCatalog.style.color = 'var(--text-secondary)';
      }
      tr.appendChild(tdCatalog);

      // Description
      const tdDesc = document.createElement('td');
      tdDesc.className = 'fm-col-desc';
      tdDesc.textContent = config.description || '';
      tr.appendChild(tdDesc);

      tbody.appendChild(tr);
    }

    // Set up status filter listener
    const statusFilter = document.getElementById('fmStatusFilter');
    if (statusFilter) {
      statusFilter.removeEventListener('change', this._statusFilterHandler);
      this._statusFilterHandler = () => this.applyFieldFilters();
      statusFilter.addEventListener('change', this._statusFilterHandler);
    }
  }

  getFieldSourceGroup(sourceKey) {
    if (!sourceKey || !this.availableSources || !this.availableSources[sourceKey]) return 'Other';
    return this.availableSources[sourceKey].group || 'Other';
  }

  applyFieldFilters() {
    const catFilter = document.getElementById('fmCategoryFilter')?.value || 'all';
    const statusFilter = document.getElementById('fmStatusFilter')?.value || 'all';
    const tbody = document.getElementById('fmTableBody');
    if (!tbody) return;

    for (const tr of tbody.querySelectorAll('tr')) {
      const field = tr.dataset.field;
      const config = this.fieldMappings[field];
      if (!config) continue;

      let visible = true;
      if (catFilter !== 'all') {
        const group = tr.dataset.sourceGroup;
        if (group !== catFilter) visible = false;
      }
      if (statusFilter === 'enabled' && !config.enabled) visible = false;
      if (statusFilter === 'disabled' && config.enabled) visible = false;

      tr.style.display = visible ? '' : 'none';
    }
  }

  bulkToggle(enabled) {
    const tbody = document.getElementById('fmTableBody');
    if (!tbody) return;

    for (const tr of tbody.querySelectorAll('tr')) {
      if (tr.style.display === 'none') continue;
      const field = tr.dataset.field;
      if (!this.fieldMappings[field]) continue;

      this.fieldMappings[field].enabled = enabled;
      const checkbox = tr.querySelector('.fm-toggle input');
      if (checkbox) checkbox.checked = enabled;
      tr.classList.toggle('fm-row-disabled', !enabled);
    }
    this.fieldMappingsDirty = true;
  }

  toggleField(fieldName, enabled) {
    if (!this.fieldMappings[fieldName]) return;
    this.fieldMappings[fieldName].enabled = enabled;
    this.fieldMappingsDirty = true;
  }

  changeSource(fieldName, sourceKey) {
    if (!this.fieldMappings[fieldName]) return;
    this.fieldMappings[fieldName].sourceKey = sourceKey;
    this.fieldMappingsDirty = true;

    const tr = document.querySelector('tr[data-field="' + fieldName + '"]');
    if (tr) {
      tr.dataset.sourceGroup = this.getFieldSourceGroup(sourceKey);
    }
  }

  changeCatalogCode(fieldName, code) {
    if (!this.fieldMappings[fieldName]) return;
    this.fieldMappings[fieldName].catalogCode = code;
    this.fieldMappingsDirty = true;
    this.checkDuplicateCatalogCodes();
  }

  checkDuplicateCatalogCodes() {
    const codes = {};
    for (const [fieldName, config] of Object.entries(this.fieldMappings)) {
      if (!fieldName.startsWith('catalognum') || !config.catalogCode) continue;
      if (!codes[config.catalogCode]) codes[config.catalogCode] = [];
      codes[config.catalogCode].push(fieldName);
    }

    document.querySelectorAll('.fm-catalog-warning').forEach(el => el.remove());

    for (const [code, fields] of Object.entries(codes)) {
      if (fields.length > 1) {
        for (const field of fields) {
          const tr = document.querySelector('tr[data-field="' + field + '"]');
          if (tr) {
            const catTd = tr.querySelector('.fm-col-catalog');
            if (catTd) {
              const warn = document.createElement('div');
              warn.className = 'fm-catalog-warning';
              warn.style.cssText = 'color: var(--warning-color); font-size: 0.7rem;';
              warn.textContent = 'Duplicate: ' + code;
              catTd.appendChild(warn);
            }
          }
        }
      }
    }
  }

  async saveFieldMappings() {
    try {
      const result = await window.api.saveFieldMappings(this.fieldMappings);
      if (!result.success) {
        this.showError('Failed to save field mappings: ' + result.error);
        return;
      }
      this.fieldMappingsDirty = false;
    } catch (error) {
      console.error('Error saving field mappings:', error);
      this.showError('Failed to save field mappings');
    }
  }

  async exportFieldMappings() {
    try {
      const result = await window.api.exportFieldMappings();
      if (result.success) {
        this.showSuccess('Field mappings exported');
      } else if (result.error !== 'Canceled') {
        this.showError('Export failed: ' + result.error);
      }
    } catch (error) {
      console.error('Error exporting field mappings:', error);
      this.showError('Export failed');
    }
  }

  async importFieldMappings() {
    try {
      const result = await window.api.importFieldMappings();
      if (result.success) {
        this.fieldMappings = result.fieldMappings;
        this.fieldMappingsDirty = false;
        this.renderFieldMappingTable();
        this.showSuccess('Field mappings imported');
      } else if (result.error !== 'Canceled') {
        this.showError('Import failed: ' + result.error);
      }
    } catch (error) {
      console.error('Error importing field mappings:', error);
      this.showError('Import failed');
    }
  }

  async resetFieldMappingsToDefaults() {
    try {
      const result = await window.api.resetFieldMappings();
      if (result.success) {
        this.fieldMappings = result.fieldMappings;
        this.fieldMappingsDirty = false;
        this.renderFieldMappingTable();
        this.showSuccess('Field mappings reset to defaults');
      } else {
        this.showError('Reset failed: ' + result.error);
      }
    } catch (error) {
      console.error('Error resetting field mappings:', error);
      this.showError('Reset failed');
    }
  }
}

// Initialize on DOM load
let dataSettingsUI;

/**
 * Helper function to refresh session counter display
 * Call this after any API operation that might increment the counter
 */
async function refreshSessionCounter() {
  try {
    const stats = await window.api.getStatistics();
    if (dataSettingsUI) {
      dataSettingsUI.updateSessionCallDisplay(stats.sessionCallCount || 0);
    }
  } catch (error) {
    console.error('Error refreshing session counter:', error);
  }

  // Update monthly usage display in footer
  try {
    const usageResult = await window.electronAPI.getMonthlyUsage();
    if (usageResult.success) {
      const total = usageResult.usage.total || 0;
      const limit = usageResult.limit || 2000;
      const monthlyEl = document.getElementById('monthlyUsageText');
      if (monthlyEl) {
        monthlyEl.textContent = `Month: ${total.toLocaleString()}/${limit.toLocaleString()}`;
        // Color based on usage percentage
        const pct = total / limit;
        if (pct > 0.9) {
          monthlyEl.style.color = '#d9534f'; // red
        } else if (pct >= 0.75) {
          monthlyEl.style.color = '#f0ad4e'; // orange
        } else {
          monthlyEl.style.color = '';
        }
      }
    }
  } catch (error) {
    // Non-fatal — monthly usage display is informational
    console.warn('Error refreshing monthly usage:', error.message);
  }
}

// =============================================================================
// Menu Event Handling
// =============================================================================

/**
 * Handle menu actions from main process
 * @param {string} action - Menu action identifier
 * @param {*} data - Optional data for the action
 */
async function handleMenuAction(action, data) {
  console.log('Menu action received:', action, data);

  switch (action) {
    case 'load-collection':
      document.getElementById('loadCollectionBtn').click();
      break;

    case 'load-recent':
      // Load a collection from the recent list
      if (data) {
        showStatus('Loading collection...');
        const result = await window.electronAPI.loadCollection(data);
        if (result.success) {
          AppState.collectionPath = result.filePath;
          AppState.collection = result.summary;
          await loadCollectionScreen();
        } else if (result.error !== 'cancelled') {
          showModal('Error', 'Failed to load collection: ' + result.error);
        }
      }
      break;

    case 'close-collection':
      document.getElementById('closeCollectionBtn').click();
      break;

    case 'select-all-fields':
      if (AppState.currentScreen === 'comparison' && AppState.fieldComparison) {
        const selectAllBtn = document.getElementById('selectAllFieldsBtn');
        if (selectAllBtn) selectAllBtn.click();
      }
      break;

    case 'select-none':
      if (AppState.currentScreen === 'comparison' && AppState.fieldComparison) {
        const selectNoneBtn = document.getElementById('selectNoneFieldsBtn');
        if (selectNoneBtn) selectNoneBtn.click();
      }
      break;

    case 'select-empty':
      if (AppState.currentScreen === 'comparison' && AppState.fieldComparison) {
        const selectEmptyBtn = document.getElementById('selectEmptyFieldsBtn');
        if (selectEmptyBtn) selectEmptyBtn.click();
      }
      break;

    case 'select-different':
      if (AppState.currentScreen === 'comparison' && AppState.fieldComparison) {
        const selectDiffBtn = document.getElementById('selectDifferentFieldsBtn');
        if (selectDiffBtn) selectDiffBtn.click();
      }
      break;

    case 'filter-status':
      if (AppState.collectionPath) {
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
          statusFilter.value = data;
          AppState.filterSort.statusFilter = data;
          AppState.pagination.currentPage = 1;
          loadCoins();
        }
      }
      break;

    case 'filter-freshness':
      if (AppState.collectionPath) {
        const freshnessFilter = document.getElementById('freshnessFilter');
        if (freshnessFilter) {
          freshnessFilter.value = data;
          AppState.filterSort.freshnessFilter = data;
          AppState.pagination.currentPage = 1;
          loadCoins();
        }
      }
      break;

    case 'sort-by':
      if (AppState.collectionPath) {
        const sortBy = document.getElementById('sortBy');
        if (sortBy) {
          sortBy.value = data;
          AppState.filterSort.sortBy = data;
          AppState.pagination.currentPage = 1;
          loadCoins();
        }
      }
      break;

    case 'reset-filters':
      if (AppState.collectionPath) {
        const resetBtn = document.getElementById('resetFiltersBtn');
        if (resetBtn) resetBtn.click();
      }
      break;

    case 'refresh-list':
      if (AppState.collectionPath) {
        loadCoins();
      }
      break;

    case 'set-view-mode':
      if (AppState.collectionPath && data) {
        setViewMode(data);
      }
      break;

    case 'open-app-settings':
      // Open App Settings screen (API key, backup, default collection)
      {
        const result = await window.electronAPI.getAppSettings();
        if (result.success) {
          AppState.settings = result.settings;
          loadSettingsScreen();
          showScreen('settings');
        }
      }
      break;

    case 'open-data-settings':
      // Open Data Settings modal on Fetch Settings tab (collection-specific)
      if (dataSettingsUI && AppState.collectionPath) {
        dataSettingsUI.openModal();
        dataSettingsUI.switchTab('fetchSettingsTab');
      }
      break;

    case 'open-field-mappings':
      // Open Data Settings modal on Field Mappings tab
      if (dataSettingsUI && AppState.collectionPath) {
        dataSettingsUI.openModal();
        dataSettingsUI.switchTab('fieldMappingsTab');
      }
      break;

    case 'export-mappings':
      if (AppState.collectionPath) {
        const result = await window.electronAPI.exportFieldMappings();
        if (result.success) {
          showStatus('Field mappings exported');
        }
      }
      break;

    case 'import-mappings':
      if (AppState.collectionPath) {
        const result = await window.electronAPI.importFieldMappings();
        if (result.success) {
          showStatus('Field mappings imported');
          if (dataSettingsUI) {
            dataSettingsUI.loadFieldMappings();
          }
        }
      }
      break;

    case 'reset-mappings':
      if (AppState.collectionPath) {
        const confirmed = await new Promise(resolve => {
          showModal('Confirm Reset', 'Reset all field mappings to defaults?', true);
          document.getElementById('modalConfirmBtn').onclick = () => {
            document.getElementById('confirmModal').style.display = 'none';
            resolve(true);
          };
          document.getElementById('modalCancelBtn').onclick = () => {
            document.getElementById('confirmModal').style.display = 'none';
            resolve(false);
          };
        });
        if (confirmed) {
          await window.electronAPI.resetFieldMappings();
          showStatus('Field mappings reset to defaults');
          if (dataSettingsUI) {
            dataSettingsUI.loadFieldMappings();
          }
        }
      }
      break;

    case 'reset-all':
      if (AppState.collectionPath) {
        const confirmed = await new Promise(resolve => {
          showModal('Confirm Reset', 'Reset ALL settings to defaults? This includes fetch settings, currency, and field mappings.', true);
          document.getElementById('modalConfirmBtn').onclick = () => {
            document.getElementById('confirmModal').style.display = 'none';
            resolve(true);
          };
          document.getElementById('modalCancelBtn').onclick = () => {
            document.getElementById('confirmModal').style.display = 'none';
            resolve(false);
          };
        });
        if (confirmed) {
          await window.electronAPI.resetSettings();
          showStatus('All settings reset to defaults');
          if (dataSettingsUI) {
            await dataSettingsUI.loadSettings();
            dataSettingsUI.loadFieldMappings();
          }
        }
      }
      break;

    case 'set-default':
      if (AppState.collectionPath) {
        await window.electronAPI.setDefaultCollection(AppState.collectionPath);
        showStatus('Default collection set');
      }
      break;

    case 'clear-default':
      await window.electronAPI.setDefaultCollection('');
      showStatus('Default collection cleared');
      break;

    case 'clear-recent':
      await window.electronAPI.clearRecentCollections();
      showStatus('Recent collections cleared');
      break;

    case 'about':
      showAboutDialog();
      break;

    case 'report-issue':
      showReportIssueDialog();
      break;

    case 'view-eula':
      showEulaModal(false);
      break;

    case 'purchase-license':
      // Open checkout URL for license purchase
      openPurchaseLicenseUrl();
      break;

    // Fast Pricing Mode menu actions
    case 'enter-fast-pricing-mode':
      if (AppState.collectionPath && !AppState.fastPricingMode) {
        // Check premium status (same as button click)
        const canUse = await requirePremiumFeature('fast-pricing');
        if (canUse) {
          enterFastPricingMode();
        }
      }
      break;

    case 'exit-fast-pricing-mode':
      if (AppState.fastPricingMode) {
        exitFastPricingMode();
      }
      break;

    case 'fp-select-all':
      if (AppState.fastPricingMode) {
        AppState.allCoins.forEach(c => {
          if (checkFastPricingEligibility(c).eligible) AppState.fastPricingSelected.add(c.id);
        });
        renderCoinList();
        updateFastPricingCounts();
      }
      break;

    case 'fp-select-displayed':
      if (AppState.fastPricingMode) {
        AppState.coins.forEach(c => {
          if (checkFastPricingEligibility(c).eligible) AppState.fastPricingSelected.add(c.id);
        });
        renderCoinList();
        updateFastPricingCounts();
      }
      break;

    case 'fp-clear':
      if (AppState.fastPricingMode) {
        AppState.fastPricingSelected.clear();
        renderCoinList();
        updateFastPricingCounts();
      }
      break;

    case 'fp-start-update':
      if (AppState.fastPricingMode && AppState.fastPricingSelected.size > 0) {
        startFastPricingUpdate();
      }
      break;

    default:
      console.warn('Unknown menu action:', action);
  }
}

/**
 * Update menu state in main process
 * Call this when app state changes that affects menu items
 * @param {Object} state - State object with collectionLoaded and/or fieldComparisonActive
 */
function updateMenuState(state) {
  if (window.electronAPI && window.electronAPI.updateMenuState) {
    window.electronAPI.updateMenuState(state).catch(err => {
      console.error('Error updating menu state:', err);
    });
  }
}

// ============================================
// MICROSOFT STORE UPDATE NOTIFICATIONS
// ============================================

/**
 * Show passive notification for available Store update
 * @param {Object} updateInfo - Update information from GitHub API
 */
function showStoreUpdateNotification(updateInfo) {
  const banner = document.createElement('div');
  banner.id = 'store-update-banner';
  banner.className = 'update-banner';
  banner.innerHTML = `
    <div class="update-banner-content">
      <span class="update-icon">${UI_STRINGS.ICON_REFRESH}</span>
      <span class="update-text">
        Version ${updateInfo.version} is available.
        Updates install automatically through Microsoft Store.
      </span>
      <button class="update-dismiss" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;

  // Add to top of app
  document.body.insertBefore(banner, document.body.firstChild);

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (banner.parentElement) {
      banner.remove();
    }
  }, 10000);
}

/**
 * Show "What's New" modal after Store auto-update
 * @param {Object} info - Version and release notes
 */
function showWhatsNewModal(info) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-dialog whats-new-modal">
      <div class="modal-header">
        <h2>${UI_STRINGS.ICON_PARTY} What's New in Version ${info.version}</h2>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <p class="update-info">Updated from version ${info.previousVersion}</p>
        <div class="release-notes">
          ${formatReleaseNotes(info.releaseNotes)}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
          Got it!
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

/**
 * Format markdown release notes to HTML
 * @param {string} markdown - Release notes in markdown
 * @returns {string} HTML formatted notes
 */
function formatReleaseNotes(markdown) {
  if (!markdown) return '<p>No release notes available.</p>';

  // Simple markdown to HTML conversion
  const lines = markdown.split('\n');
  let html = '';
  let inList = false;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += `<h3>${line.substring(3)}</h3>`;
    } else if (line.startsWith('- ')) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${line.substring(2)}</li>`;
    } else if (line.trim() === '') {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
    } else if (line.trim()) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += `<p>${line}</p>`;
    }
  }

  if (inList) {
    html += '</ul>';
  }

  return html;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Populate emoji placeholders from UI_STRINGS (spans in index.html)
  document.querySelectorAll('.emoji-placeholder[data-ui-key]').forEach(function(el) {
    var key = el.getAttribute('data-ui-key');
    if (UI_STRINGS[key]) el.textContent = UI_STRINGS[key];
  });

  // Show welcome screen initially while we check EULA and default collection
  showScreen('welcome');
  showStatus('Starting...');

  // Check EULA acceptance first before initializing the app
  const eulaOk = await checkEulaOnStartup();
  if (!eulaOk) {
    // User declined EULA - window.close() was called in the handler
    return;
  }

  dataSettingsUI = new DataSettingsUI();

  // Start periodic license validation (runs 5 seconds after startup, then every 7 days)
  startPeriodicLicenseValidation();

  // Update version badge based on supporter status
  updateVersionBadge();

  // Setup menu event listeners
  if (window.menuEvents) {
    window.menuEvents.onMenuAction(handleMenuAction);
    console.log('Menu event listeners registered');
  }

  // Setup Store update event listeners
  if (window.electronAPI && window.electronAPI.onStoreUpdateAvailable) {
    window.electronAPI.onStoreUpdateAvailable((updateInfo) => {
      showStoreUpdateNotification(updateInfo);
    });
    console.log('Store update listeners registered');
  }

  if (window.electronAPI && window.electronAPI.onShowWhatsNew) {
    window.electronAPI.onShowWhatsNew((info) => {
      showWhatsNewModal(info);
    });
    console.log('What\'s New listener registered');
  }

  // Try to auto-load default collection (after EULA is accepted)
  const autoLoaded = await tryAutoLoadDefaultCollection();

  if (!autoLoaded) {
    // No default collection or failed to load - show welcome screen
    showScreen('welcome');
    showStatus('Ready');
  } else {
    // Collection was loaded - update status bar displays
    window.api.getSettings().then(settings => {
      if (dataSettingsUI) {
        dataSettingsUI.updateStatusBarDisplay(settings.fetchSettings);
      }
    }).catch(error => {
      console.error('Error loading initial settings:', error);
    });

    window.api.getStatistics().then(stats => {
      if (dataSettingsUI) {
        dataSettingsUI.updateSessionCallDisplay(stats.sessionCallCount || 0);
      }
    }).catch(error => {
      console.error('Error loading statistics:', error);
    });
  }

  // Wire up "View EULA" link in Settings
  const viewEulaLink = document.getElementById('viewEulaLink');
  if (viewEulaLink) {
    viewEulaLink.addEventListener('click', (e) => {
      e.preventDefault();
      showEulaModal(false); // Not first launch - can just close
    });
  }

  // Wire up Numista website link in Settings
  const numistaWebsiteLink = document.getElementById('numistaWebsiteLink');
  if (numistaWebsiteLink) {
    numistaWebsiteLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.electronAPI.openExternal('https://en.numista.com');
    });
  }
});

// ============================================================
// Image Lightbox
// ============================================================

/**
 * Open the image lightbox with a full-size image
 * @param {string} src - Image source URL or data URI
 * @param {string} [caption] - Optional caption text
 */
function openImageLightbox(src, caption) {
  const lightbox = document.getElementById('imageLightbox');
  const lightboxImg = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');

  if (!lightbox || !lightboxImg) return;

  lightboxImg.src = src;
  lightboxCaption.textContent = caption || '';
  lightboxCaption.style.display = caption ? 'block' : 'none';
  lightbox.style.display = 'flex';
}

/**
 * Close the image lightbox
 */
function closeImageLightbox() {
  const lightbox = document.getElementById('imageLightbox');
  if (lightbox) {
    lightbox.style.display = 'none';
    document.getElementById('lightboxImage').src = '';
  }
}

/**
 * Attach lightbox click handler to an image element
 * @param {HTMLImageElement} imgElement - The image element
 * @param {string} [caption] - Optional caption
 */
function attachLightbox(imgElement, caption) {
  imgElement.style.cursor = 'pointer';
  imgElement.title = (caption || 'Image') + ' - click to view full size';
  imgElement.addEventListener('click', (e) => {
    e.stopPropagation();
    // Upgrade Numista thumbnail URLs to larger versions for the lightbox
    let src = imgElement.src;
    if (src.includes('150x150')) {
      src = src.replace('150x150', '400x400');
    }
    openImageLightbox(src, caption);
  });
}

// Wire up lightbox close handlers
document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('imageLightbox');
  if (!lightbox) return;

  // Close on backdrop click
  lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeImageLightbox);

  // Close on X button click
  lightbox.querySelector('.lightbox-close').addEventListener('click', closeImageLightbox);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.style.display !== 'none') {
      closeImageLightbox();
    }
  });
});

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataSettingsUI;
}
