# NumiSync Wizard

🌐 **[Visit the Homepage](https://numisync.com)**

[![GitHub release](https://img.shields.io/github/v/release/inguy24/numismat-enrichment)](https://github.com/inguy24/numismat-enrichment/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/inguy24/numismat-enrichment?style=social)](https://github.com/inguy24/numismat-enrichment)

**NumiSync Wizard** is a cross-platform desktop application for Windows, macOS, and Linux that automatically enriches your [OpenNumismat](https://opennumismat.github.io/) coin collection database with detailed catalog data, pricing information, and images from [Numista](https://www.numista.com/).

---

## Features

- **Intelligent Coin Matching** - Fuzzy search with denomination normalization and issuer resolution
- **Granular Data Control** - Choose exactly what data to sync (Basic/Issue/Pricing)
- **Visual Field Comparison** - Side-by-side comparison, cherry-pick fields to update
- **Fast Pricing Mode** - Batch update pricing for all matched coins *(Premium)*
- **Auto-Propagate** - Apply type data to matching coins automatically *(Premium)*
- **Smart Caching** - Persistent API cache reduces requests, respects rate limits
- **Advanced Field Mapping** - Customize how 45+ data sources map to OpenNumismat

---

## Installation

NumiSync Wizard is available through multiple distribution channels:

### Windows

**Option 1: Microsoft Store (Coming Soon)**
- Submitted for Microsoft Store certification (February 2026)
- Automatic updates through Windows
- Signed by Microsoft (no SmartScreen warnings)

**Option 2: Direct Download**
- Download the latest `.exe` installer from [GitHub Releases](https://github.com/inguy24/numismat-enrichment/releases/latest)
- Run the installer and follow the setup wizard
- Updates available through the app (Help > Check for Updates)
- Signed by SignPath Foundation (when available)

### macOS *(Coming Soon)*

Download the `.dmg` file from [GitHub Releases](https://github.com/inguy24/numismat-enrichment/releases/latest).

**Installation steps**: See [macOS Installation Guide](https://numisync.com/installation#macos)

### Linux *(Coming Soon)*

Choose your preferred package format:
- **AppImage**: Universal, no installation required
- **.deb**: For Debian/Ubuntu-based distributions
- **.rpm**: For Fedora/RHEL-based distributions

Download from [GitHub Releases](https://github.com/inguy24/numismat-enrichment/releases/latest).

---

## Quick Start

1. **Install** NumiSync Wizard (see Installation above)
2. **Launch** the application
3. **Open** your OpenNumismat collection (.db file)
4. **Settings** → Add your Numista API key (free from [numista.com](https://www.numista.com/))
5. **Select coins** → Click "Search & Enrich" → Review matches → Accept!

For detailed instructions, see the **[Quick Start Guide](https://numisync.com/quickstart)**.

---

## Documentation

- **[Homepage](https://numisync.com)** - Features, screenshots, and downloads
- **[Installation Guide](https://numisync.com/installation)** - System requirements and setup
- **[Quick Start Guide](https://numisync.com/quickstart)** - Get started in 5 minutes
- **[Full Documentation](docs/)** - Technical reference and guides
- **[Changelog](docs/CHANGELOG.md)** - Version history and updates
- **[Build Guide](docs/guides/BUILD-GUIDE.md)** - For developers

---

## System Requirements

- **OS:** Windows 10/11 (64-bit), macOS 10.13+, or Linux (Ubuntu, Debian, Fedora, etc.)
- **RAM:** 4 GB minimum, 8 GB recommended
- **Storage:** 200 MB + cache space
- **Dependencies:** OpenNumismat, Numista API key (free)

---

## Support Development

NumiSync Wizard is **free** for core features, with optional **Supporter License ($10)** that unlocks:

- **Fast Pricing Mode** - Batch update pricing across your collection
- **Auto-Propagate** - Apply type data automatically
- **No nag prompts** - Uninterrupted workflow
- **Discounts on future premium features** - Early supporter benefits

**[Become a Supporter](https://numisync.com/license)** - Buy once, use forever • No subscriptions

Your support helps cover development costs and keeps NumiSync improving for our community of collectors.

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Note:** Premium features require a paid Supporter License, managed separately from the MIT-licensed codebase.

---

## Code Signing Policy

This application is digitally signed for your security.

### Windows Code Signing

| Distribution | Signing Authority | Status |
|--------------|-------------------|--------|
| **Microsoft Store** | Microsoft Corporation | ⏳ Submitted for certification (Feb 2026) |
| **Direct Download (NSIS)** | SignPath Foundation | ⏳ Pending Approval |

**Microsoft Store** packages are automatically signed by Microsoft during the Store submission process.

**Direct Download** packages will be signed via **[SignPath Foundation](https://signpath.org)** (free code signing for open source). Application submitted and awaiting approval.

### Project Roles

| Role | Member |
|------|--------|
| Approver | Shane Burkhardt ([@inguy24](https://github.com/inguy24)) |
| Committer | Shane Burkhardt ([@inguy24](https://github.com/inguy24)) |

### Privacy

This application does not transmit personal information without user consent. See our privacy policy:

- No analytics or telemetry collection
- No transmission of collection data
- Only communicates with Numista API when explicitly using search features
- All data stored locally on your machine
- Open-source - review the code anytime

### Platform Signing Status

- **Windows:** Signed with SignPath Foundation certificate (free for open-source)
- **macOS:** Unsigned (requires manual installation - [see instructions](docs/macos-install.md))
- **Linux:** Unsigned (standard for open-source Linux packages)

---

## Acknowledgments

- **[Numista](https://www.numista.com/)** - Comprehensive numismatic catalog and API
- **[OpenNumismat](https://opennumismat.github.io/)** - Open-source coin collection software
- **Community contributors** - Thank you for bug reports, feature requests, and support!

---

## Contact

- **Issues:** [Report bugs or request features](https://github.com/inguy24/numismat-enrichment/issues)
- **Discussions:** [Ask questions and share ideas](https://github.com/inguy24/numismat-enrichment/discussions)
- **Author:** Shane Burkhardt ([@inguy24](https://github.com/inguy24))

---

<div align="center">

**[Download Now](https://numisync.com/download)** • **[Documentation](https://numisync.com)** • **[Support](https://numisync.com/license)**

Made by a fellow coin collector

</div>
