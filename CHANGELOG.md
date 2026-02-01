# Changelog

All notable changes to the OpenNumismat Enrichment Tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **Pagination for Coin List** (2026-01-31)
  - Added navigation controls to browse through large coin collections
  - Displays 100 coins per page with clear page indicators
  - Navigation buttons: First Page (⏮️), Previous (◀️), Next (▶️), Last Page (⏭️)
  - Page status shows current range (e.g., "Showing 101-200 of 500 coins")
  - Smart button states - automatically disables first/previous on page 1, next/last on final page
  - Improved performance for collections with hundreds or thousands of coins

### Changed
- Updated coin loading logic to support offset-based pagination
- Enhanced status display to show current page range instead of total only

### Technical Details
- Modified files:
  - `src/renderer/app.js` - Added pagination state management and event handlers
  - `src/renderer/index.html` - Added pagination controls UI
  - `src/renderer/styles/main.css` - Added pagination styling
- Page size: 100 coins per page
- Backend already supported limit/offset parameters via `getCoins()` method

---

## [Phase 1] - Initial Release

### Added
- Core enrichment functionality
- Numista API integration
- Basic coin search and matching
- Field comparison and selective merging
- Progress tracking
- OpenNumismat database integration
- Settings management
- Manual search capability
- Skip coin functionality
- Metadata storage in note field
- Granular data type tracking (Basic, Issue, Pricing)
- Data type status indicators with emoji icons
- Freshness tracking for pricing data
- User-controlled data fetching settings
