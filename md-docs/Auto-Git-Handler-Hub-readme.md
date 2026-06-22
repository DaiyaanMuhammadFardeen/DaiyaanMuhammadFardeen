# Auto-Git-Handler-Hub (AGHH) 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/DaiyaanMuhammadFardeen/Auto-Git-Handler-Hub)](https://github.com/DaiyaanMuhammadFardeen/Auto-Git-Handler-Hub/issues)
[![GitHub stars](https://img.shields.io/github/stars/DaiyaanMuhammadFardeen/Auto-Git-Handler-Hub)](https://github.com/DaiyaanMuhammadFardeen/Auto-Git-Handler-Hub/stargazers)
[![GitHub last commit](https://img.shields.io/github/last-commit/DaiyaanMuhammadFardeen/Auto-Git-Handler-Hub)](https://github.com/DaiyaanMuhammadFardeen/Auto-Git-Handler-Hub/commits/main)

---

**Auto-Git-Handler-Hub (AGHH)** is a terminal-based Git management and automation tool. It provides an intuitive text-based user interface (TUI) using `dialog`, allowing seamless repository navigation, automation tasks, and GitHub integration.

---

## Features ✨

* **File Manager & Automation**: Navigate project directories and run scripts efficiently.
* **Git Repository Management**: Scan your system for Git repositories and select one to work with.
* **GitHub CLI Integration**: Authenticate and manage repositories with GitHub CLI.
* **Insights & Analysis**: Generate stats and view repository status.
* **Conflict Helper**: Quickly resolve Git conflicts.
* **Cross-Platform**: Linux (Debian/Ubuntu, Arch, Fedora, openSUSE, Alpine) and macOS.
* **Customizable Settings**: Configure themes, Git behavior, backups, AI integrations.

---

## Prerequisites 🛠️

* Linux or macOS terminal
* `sudo` privileges
* Internet connection for package downloads

---

## Installation 💻

### Step 1: Clone the repository

```bash
git clone https://github.com/yourusername/Auto-Git-Handler-Hub.git
cd Auto-Git-Handler-Hub
```

### Step 2: Run the installer

```bash
bash install.sh
```

The installer will:

* Detect your OS and package manager
* Install dependencies: Git, dialog, Python3, GitHub CLI, and Python modules (`torch`, `transformers`)
* Make `aghh` executable and available globally
* Handle system-specific installation for:

  * Debian/Ubuntu (`apt`)
  * Arch/Manjaro/EndeavourOS (`pacman`)
  * Fedora/RHEL/CentOS (`dnf`)
  * openSUSE (`zypper`)
  * Alpine Linux (`apk`)
  * macOS (`brew`)

### Step 3: Verify installation

```bash
aghh --verify
```

Or check manually:

```bash
git --version
dialog --version
python3 --version
pip3 --version  # Debian/macOS only
python3 -c "import torch; print(torch.__version__)"
python3 -c "import transformers; print(transformers.__version__)"
gh --version
```

---

## Usage 🚀

Run the main hub:

```bash
aghh
```

**Menu Options:**

| Option | Description                               |
| ------ | ----------------------------------------- |
| 1      | File Manager – Navigate project files     |
| 2      | Automation Scripts – Run automation tasks |
| 3      | Settings – Configure AGHH                 |
| 4      | Backup & Export – Manage backups          |
| 5      | Find All Git Repositories                 |
| 6      | Choose from Git Repositories              |
| 7      | Authenticate/Login via GitHub CLI         |
| 8      | Insights & Analysis                       |
| 9      | Conflict Helper                           |
| 10     | Exit AGHH                                 |

**GitHub Authentication:**

```bash
gh auth login
```

Follow prompts to authenticate your GitHub account.

---

## Screenshots 📸

**AGHH Main Menu:**

![AGHH Main Menu](path/to/screenshot_main_menu.png)

**File Manager:**

![File Manager](path/to/screenshot_file_manager.png)

**Git Status View:**

![Git Status](path/to/screenshot_git_status.png)

---

## Directory Structure 📂

```
Auto-Git-Handler-Hub/
├── Menu Options/
│   ├── FileManager/
│   ├── Automation/
│   ├── Settings/
│   ├── BackupExport/
├── listRepos.sh
├── findGitRepos.sh
├── install.sh
├── aghh.sh
├── globals.sh
└── README.md
```

---

## Contributing 🤝

We welcome contributions!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

---

## License 📄

MIT License. See [LICENSE](LICENSE) for details.

---

## Support 💬

Open an issue on [GitHub](https://github.com/yourusername/Auto-Git-Handler-Hub/issues) or contact the maintainer for help.

---

## Acknowledgments 🙏

* [dialog](https://invisible-island.net/dialog/) – Terminal UI menus
* [PyTorch](https://pytorch.org/) & [Transformers](https://huggingface.co/docs/transformers/index) – Python ML integrations
* [GitHub CLI](https://cli.github.com/) – GitHub authentication & management

---

**AGHH** – Streamlining Git management, one terminal at a time! ⚡
