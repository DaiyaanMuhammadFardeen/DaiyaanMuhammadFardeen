<p align="center">
  <img src="https://img.shields.io/badge/python-3.10%2B-blue?style=flat-square" alt="Python 3.10+"/>
  <img src="https://img.shields.io/github/license/DaiyaanMuhammadFardeen/vibecost?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/github/stars/DaiyaanMuhammadFardeen/vibecost?style=flat-square&label=stars" alt="Stars"/>
  <img src="https://img.shields.io/github/last-commit/DaiyaanMuhammadFardeen/vibecost?style=flat-square" alt="Last Commit"/>
  <img src="https://img.shields.io/badge/models-15-blueviolet?style=flat-square" alt="15 Models"/>
  <img src="https://img.shields.io/badge/tests-400%20passing-brightgreen?style=flat-square" alt="400 Tests"/>
</p>

<h1 align="center">🧠 vibecost</h1>
<p align="center"><strong>Prompt-Based Token Estimation & LLM Cost Simulator</strong></p>

<p align="center">
  Simulate how an AI agent would interact with your codebase — predicting which files it would read, what tools it would call, and exactly how much it would cost — all <strong>without making a single API call</strong>.
  <br/>
  Budget AI coding sessions, compare model pricing, and understand token costs before you commit to a workflow.
</p>

<br/>

<p align="center">
  <a href="repo-assets/screenshot-splash.png">
    <img src="repo-assets/screenshot-splash.png" alt="vibecost splash screen" width="700"/>
  </a>
</p>

<br/>

---

## 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start & Screenshots](#quick-start)
- [Command Reference](#command-reference)
- [Supported Models](#supported-models-15)
- [Output Formats](#output-formats)
- [Architecture](#architecture)
- [Prompt Prediction Engine](#prompt-prediction-engine)
- [Configuration](#configuration)
- [Development](#development)
- [Example Workflows](#example-workflows)
- [License](#license)

---

## Features

- **🔮 Prompt Prediction** — `vibecost prompt` predicts which files and MCP tools an AI agent would use for a given query, with estimated token cost
- **💰 Cost Simulation** — `vibecost scan` calculates full token breakdown and pricing for any model, including multi-turn agent loops
- **⚖️ Model Comparison** — `vibecost compare` ranks all 15 models by cost with visual cost bars and savings recommendations
- **🧠 Reasoning Token Support** — Accurately estimates hidden thinking tokens for o1, o3-mini, DeepSeek-R1
- **📦 Prompt Caching** — Models cache savings across multi-turn conversations
- **🌊 Context Pressure Bar** — Gradient Unicode bar (green → red) showing context window utilization
- **🔌 Real Tokenizers** — Uses HuggingFace `AutoTokenizer` + OpenAI `tiktoken` for accurate counts; falls back to provider-specific heuristics
- **🔧 7 Built-in MCP Tools** — `read_file`, `edit_file`, `write_file`, `grep_search`, `glob_search`, `think`, `bash_command`
- **🎨 Polished Terminal UI** — Provider emoji icons, color-coded pricing tiers, phase indicators, model suggestions, tool emojis in predictions
- **⚙️ Configurable** — Per-project config via `vibecost init` interactive wizard with step indicators and summary confirmation
- **📤 JSON Output** — Machine-readable output for all commands (`-f json`)

---

## Installation

### Prerequisites

- Python 3.10+
- pip

### Install from source

```bash
git clone https://github.com/DaiyaanMuhammadFardeen/vibecost.git
cd vibecost
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

#### Optional: HuggingFace model support

Most models (GPT, Claude, Gemini, DeepSeek V3, Cohere) work out of the box with zero extra setup.  
Five models require the HuggingFace `transformers` tokenizer for accurate counts:

| Model | HF Repo |
|---|---|
| `deepseek-r1` | `deepseek-ai/DeepSeek-R1` |
| `llama-3-3-70b` | `meta-llama/Llama-3.3-70B-Instruct` |
| `qwen-2-5-72b` | `Qwen/Qwen2.5-72B-Instruct` |
| `mistral-large` | `mistralai/Mistral-Large-Instruct-2407` |
| `glm-4` | `THUDM/glm-4-9b-chat` |

If you plan to use any of these models, install the `transformers` extra:

```bash
pip install -e ".[transformers]"
```

This pulls in `transformers` and `torch` (~3 GB). Without it, these models fall back gracefully to tiktoken-based estimation — you'll still get a reasonable token count, just not model-specific accuracy.

Verify it works:

```bash
vibecost --version
vibecost --help
```

> **Note**: The first scan with the `transformers` engine will download tokenizer files from HuggingFace (~500 MB). This happens once and is cached.

---

## Quick Start

### 1. Scan a project to estimate token usage

```bash
vibecost scan src/vibecost
```

<p align="center">
  <a href="repo-assets/screenshot-scan.png">
    <img src="repo-assets/screenshot-scan.png" alt="vibecost scan output" width="700"/>
  </a>
</p>

For a detailed view including the top 5 largest files and phase-level logging:

```bash
vibecost scan src/vibecost --verbose
```

<p align="center">
  <a href="repo-assets/screenshot-scan-verbose.png">
    <img src="repo-assets/screenshot-scan-verbose.png" alt="vibecost scan verbose" width="700"/>
  </a>
</p>

This runs the full pipeline:
1. Walks all files (respecting `.gitignore`)
2. Detects binary files by extension + magic bytes
3. Profiles content (English, code, CJK, JSON ratios)
4. Counts tokens per file using model-specific tokenizers
5. Assembles the full context (system prompt + file blocks + overhead)
6. Simulates one agent loop
7. Computes complete cost breakdown

### 2. Compare pricing across all models

```bash
vibecost compare src/vibecost
```

<p align="center">
  <a href="repo-assets/screenshot-compare.png">
    <img src="repo-assets/screenshot-compare.png" alt="vibecost compare output" width="700"/>
  </a>
</p>

Output ranked by total cost:

```
# ┃ Model              ┃ ┃  Input ┃ Output ┃ Thinking ┃ Ctx% ┃ Pressure ┃   Cost ┃ Cost Bar
━╇━━━━━━━━━━━━━━━━━━━━━╇╇━━━━━━━━╇━━━━━━━━╇━━━━━━━━━━╇━━━━━━╇━━━━━━━━━━╇━━━━━━━━╇━━━━━━━━━━
1 │ 🏆 GPT-4o Mini     │🤖│ 75,073 │  2,000 │        - │ 60.6%│ SAFE     │ $0.0125│ ██░░░░░░
2 │  Gemini 2.0 Flash  │🌐│ 75,073 │  2,000 │        - │ 7.8% │ SAFE     │ $0.0083│ █░░░░░░░
3 │  Claude Haiku 3.5  │🌀│ 75,073 │  2,000 │        - │ 60.6%│ SAFE     │ $0.0480│ ████░░░░
...
```

The 🏇 marks the best value model with a green `[BEST]` tag. Visual cost bars and provider emoji make comparisons instant. A recommendation line at the bottom shows potential savings against the most expensive model.

### 3. Predict what an AI agent would do with a query

```bash
vibecost prompt "add dark mode support to the renderer" --dir src/vibecost
```

<p align="center">
  <a href="repo-assets/screenshot-prompt.png">
    <img src="repo-assets/screenshot-prompt.png" alt="vibecost prompt output" width="700"/>
  </a>
</p>

```
╭──────────────────────────────────────────────────────────────────────────────╮
│ 🔮 Prompt Prediction                                                         │
│ Model: gpt-4o  |  Reasoning: standard                                        │
│ Query: add dark mode support to the renderer                                 │
│ Files scanned: 58  |  Tokens scanned: 97,418                                 │
╰──────────────────────────────────────────────────────────────────────────────╯

Selected 5/58 files (8.6%)

                                Predicted Files
  # ┃ File                      ┃ Relevance ┃ Relevance Bar ┃ Tokens ┃ Reason
  ───╇───────────────────────────╇───────────╇───────────────╇────────╇─────────
  1 │ renderer/comparison.py    │       19% │ ██░░░░░░░░░░ │  1,500 │ Keyword…
  2 │ renderer/summary.py       │       16% │ █░░░░░░░░░░░ │  3,634 │ Keyword…
  3 │ costs/calculator.py       │       16% │ █░░░░░░░░░░░ │  2,071 │ 4 match…
  4 │ renderer/overflow.py      │       13% │ █░░░░░░░░░░░ │    880 │ Keyword…
  5 │ renderer/progress_bar.py  │       13% │ █░░░░░░░░░░░ │    436 │ Keyword…

                     Predicted Tool Calls
╭───┬──────────────────┬────────────────────────┬───────────────╮
│ # │ Tool             │ Arguments              │ Result Tokens │
├───┼──────────────────┼────────────────────────┼───────────────┤
│ 1 │ 🧠  think        │ thought=reasoning step │         1,024 │
│ 2 │ 📁  edit_file    │ -                      │         2,048 │
╰───┴──────────────────┴────────────────────────┴───────────────╯

╭───────────────────────────── 💰 Estimated Usage ─────────────────────────────╮
│   Total input tokens      15,284                                             │
│   Total output tokens      4,628                                             │
│   Estimated cost          $0.0845                                            │
╰──────────────────────────────────────────────────────────────────────────────╯
```

The predictor scores files by path keyword matching, content relevance, and file type. Tool calls are predicted from the query keywords.

### 4. Multi-turn agent loop simulation

```bash
vibecost scan src/vibecost --loops 5 --model claude-sonnet-4-5
```

Simulates 5 turns of an agent: each loop appends the previous output to the context, modeling quadratic token growth. Includes thinking tokens for reasoning models.

### 5. Configure defaults

```bash
vibecost init
```

Interactive wizard that saves to `~/.config/vibecost/config.json`:
- Default model, loops, output estimate
- Default thinking profile (light/standard/deep/maximum)
- Default ignore patterns
- Default system prompt file path
- Cost limit (exits with code 1 if exceeded)

---

## Command Reference

### `vibecost scan [DIRECTORY]`

Scan a directory and estimate token usage and cost for a single model.

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--model` | `-m` | `gpt-4o` | Model ID to simulate |
| `--loops` | `-l` | `1` | Number of agent loops |
| `--output-estimate` | `-o` | `2000` | Estimated output tokens per loop |
| `--thinking` | `-t` | — | Reasoning profile: `light`, `standard`, `deep`, `maximum`, or numeric budget |
| `--system-prompt` | `-s` | — | Path to system prompt file |
| `--max-files` | — | all | Maximum files to include |
| `--max-kb` | — | `512` | Maximum file size in KB |
| `--verbose` | — | — | Show per-file token breakdown |
| `--format` | `-f` | `terminal` | Output format: `terminal` or `json` |
| `--cost-limit` | — | — | Exit with code 1 if cost exceeds this |
| `--ignore` | `-i` | — | Extra ignore patterns (comma-separated) |

### `vibecost compare [DIRECTORY]`

Compare costs across multiple models.

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--loops` | `-l` | `1` | Number of agent loops |
| `--output-estimate` | `-o` | `2000` | Estimated output tokens per loop |
| `--providers` | `-p` | all | Filter by providers (comma-separated: `openai,anthropic,google`) |
| `--max-kb` | — | `512` | Maximum file size in KB |
| `--format` | `-f` | `terminal` | Output format: `terminal` or `json` |
| `--ignore` | `-i` | — | Extra ignore patterns (comma-separated) |

### `vibecost prompt [QUERY]`

Predict what files and tools an AI agent would use for a given query.

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--dir` | `-d` | `.` | Directory to scan |
| `--model` | `-m` | `gpt-4o` | Model ID for cost estimation |
| `--max-files` | — | `10` | Maximum predicted files to show |
| `--tool-dirs` | — | — | Directories to load custom MCP tool definitions |

### `vibecost profile list`

List all available models and their pricing, grouped by provider.

<p align="center">
  <a href="repo-assets/screenshot-profile.png">
    <img src="repo-assets/screenshot-profile.png" alt="vibecost profile list" width="700"/>
  </a>
</p>

### `vibecost init`

Interactive configuration wizard. Saves to `~/.config/vibecost/config.json`.

---

## Supported Models (15)

| Model ID | Provider | Context | Input/M | Output/M | Engine |
|----------|----------|---------|---------|----------|--------|
| `gpt-4o` | OpenAI | 128K | $2.50 | $10.00 | tiktoken |
| `gpt-4o-mini` | OpenAI | 128K | $0.15 | $0.60 | tiktoken |
| `o1` ⚡ | OpenAI | 200K | $15.00 | $60.00 | tiktoken |
| `o3-mini` ⚡ | OpenAI | 200K | $1.10 | $4.40 | tiktoken |
| `claude-sonnet-4-5` | Anthropic | 200K | $3.00 | $15.00 | tiktoken |
| `claude-haiku-3-5` | Anthropic | 200K | $0.80 | $4.00 | tiktoken |
| `gemini-2-0-flash` | Google | **1M** | $0.10 | $0.40 | heuristic |
| `gemini-2-5-pro` | Google | **1M** | $1.25 | $10.00 | heuristic |
| `deepseek-v3` | DeepSeek | 128K | $0.27 | $1.10 | tiktoken |
| `deepseek-r1` ⚡ | DeepSeek | 128K | $0.55 | $2.19 | transformers |
| `llama-3-3-70b` | Meta | 128K | $0.59 | $0.79 | transformers |
| `qwen-2-5-72b` | Alibaba | 128K | $0.90 | $0.90 | transformers |
| `mistral-large` | Mistral | 128K | $2.00 | $6.00 | transformers |
| `command-r-plus` | Cohere | 128K | $3.00 | $15.00 | heuristic |
| `glm-4` | Zhipu | 128K | $0.50 | $2.00 | transformers |

> ⚡ = Reasoning model with hidden thinking tokens
> 🔧 = Requires `pip install vibecost[transformers]` — see [Installation](#optional-huggingface-model-support).
> Pricing reflects provider-published rates. Cache pricing not shown — use `vibecost profile list` for full table.

Adding a new model is a data-only change: just add an entry to `data/models.json`.

---

## Output Formats

### Terminal (default)

Rich, color-coded terminal output with:
- Provider emoji icons in headers (🤖 OpenAI, 🌀 Anthropic, 🌐 Google, 🧠 DeepSeek...)
- Phase progress indicators (`▶` / `✓`) for pipeline stages
- Token breakdown table (scan → context → simulation)
- Gradient pressure bar with Unicode blocks (▓/░) colored green → yellow → orange → red
- Color-coded costs (green < $0.01, yellow < $0.10, red ≥ $0.10)
- Cost forecast with input/output/cache breakdown
- Cache savings vs no-cache baseline
- Top 5 heaviest files in verbose mode
- Visual cost bar charts in model comparison
- Relevance bars (█████░░░) in prompt predictions
- Provider emoji + pricing tier colors in profile list
- Per-file verbose breakdown (sorted descending)

### JSON (`-f json`)

Machine-readable output with three top-level keys:

```json
{
  "scan": {
    "directory": "...",
    "total_files": 52,
    "total_tokens": 73801,
    "skipped_binary": 0,
    "skipped_ignored": 5,
    "file_map": { "entries": { ... } }
  },
  "simulation": {
    "model_id": "gpt-4o",
    "loops": 1,
    "base_context_tokens": 75073,
    "total_input_tokens": 75073,
    "total_output_tokens": 2000,
    "thinking_tokens": 0,
    "loop_breakdown": [...],
    "max_safe_loops": 15
  },
  "cost": {
    "model_id": "gpt-4o",
    "total_cost": 0.2077,
    "cache_savings": 0.0,
    "pressure_level": "SAFE",
    "pressure_ratio": 0.606,
    "context_window": 128000,
    "max_safe_loops": 15
  }
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI (click)                          │
│  ┌──────┐  ┌─────────┐  ┌────────┐  ┌──────────┐           │
│  │ scan │  │ compare │  │ prompt │  │ init     │           │
│  │      │  │         │  │        │  │ profile  │           │
│  └──┬───┘  └────┬────┘  └────┬───┘  └──────────┘           │
└─────┼───────────┼─────────────┼─────────────────────────────┘
      │           │             │
┌─────▼───────────▼─────────────▼─────────────────────────────┐
│                      Pipeline Layer                         │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Scanner  │  │ Context      │  │ Agent Loop             │ │
│  │ walker   │──│ Assembler    │──│ Simulator              │ │
│  │ file_map │  │ (XML wrap,   │  │ (quadratic growth,     │ │
│  │ gitignore│  │  overhead)   │  │  max_safe_loops)       │ │
│  └──────────┘  └──────────────┘  └───────────┬────────────┘ │
│                                               │              │
│  ┌──────────┐  ┌──────────────┐  ┌───────────▼────────────┐ │
│  │ Prompt   │  │ Reasoning    │  │ Cost Calculator        │ │
│  │ Predictor│  │ Estimator    │  │ pricing, cache,        │ │
│  │ (files,  │  │ (thinking    │  │ pressure model,        │ │
│  │  tools)  │  │  profiles)   │  │ breakdown)             │ │
│  └──────────┘  └──────────────┘  └───────────┬────────────┘ │
└───────────────────────────────────────────────┼─────────────┘
                                                │
┌───────────────────────────────────────────────▼─────────────┐
│                     Renderer Layer                          │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐  │
│  │ summary  │  │ comparison │  │ overflow │  │ progress │  │
│  │ (rich)   │  │ (table)    │  │ (warn)   │  │ (bar)    │  │
│  └──────────┘  └────────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘

┌────────────────────── Tokenizer Engine ────────────────────┐
│  dispatch() → tiktoken  OR  transformers  OR  heuristic    │
│                                    ↓                       │
│               calibration (content-type weighting)         │
└────────────────────────────────────────────────────────────┘
```

### Token Counting Flow

1. **File Discovery** — `walker.py` walks the directory using `pathspec`, respecting `.gitignore` and user ignore patterns. Skips binary files, oversized files, and empty files.

2. **Content Profiling** — `content_profiler.py` classifies each file into English/code/CJK/JSON ratios using line-level heuristics (semicolons, braces, unicode ranges).

3. **Token Counting** — `dispatch.py` routes to the best engine:
   - **tiktoken** — OpenAI models (o200k_base, cl100k_base, p50k_base)
   - **transformers** — Llama, Qwen, Mistral, GLM, DeepSeek-R1 (HuggingFace `AutoTokenizer`)
   - **heuristic** — Gemini (4 chars/token), Qwen (CJK bigram), Cohere (15% fewer), GLM (CJK-aware), universal fallback

4. **Calibration** — Raw token counts are adjusted by content profile via calibration factors (e.g., Gemini content is ~1.18× more token-dense for English).

5. **Context Assembly** — Files are wrapped in `<file path="...">` XML tags with provider-specific overhead (OpenAI: 8 tok/file, Anthropic: 12 tok/file).

6. **Agent Loop Simulation** — Multi-turn growth follows: `total = N × base + N(N-1)/2 × (output + tool_result) + N × overhead`

7. **Cost Calculation** — Per-million pricing applied with prompt cache partitioning (loop 0 = write, loops N>0 = read).

8. **Pressure Model** — 5-tier: SAFE (<65%), ELEVATED (<80%), WARNING (<90%), CRITICAL (<100%), OVERFLOW (≥100%).

---

## Prompt Prediction Engine

The `vibecost prompt` command predicts AI agent behavior without calling any LLM:

### File Prediction
- **Keyword scoring** — path tokens matched against query keywords (with order bonus)
- **Content relevance** — file content checked for query keyword matches
- **File type bonus** — code files score higher for implementation queries
- **Normalization** — scores are normalized to percentages across all files

### MCP Tool Prediction
- **7 built-in tools**: `read_file`, `edit_file`, `write_file`, `grep_search`, `glob_search`, `think`, `bash_command`
- **Keyword routing** — query keywords matched against tool descriptions and parameter names
- **Custom tools** — load from JSON or Python files via `--tool-dirs`

---

## Configuration

### User Config (`~/.config/vibecost/config.json`)

Created by `vibecost init`. Example:

```json
{
  "default_model": "gpt-4o",
  "default_loops": 3,
  "output_estimate": 2000,
  "thinking_profile": "standard",
  "max_kb": 512,
  "ignore_patterns": ["*.lock", "*.snap"],
  "providers": ["openai", "anthropic", "google"],
  "system_prompt_path": "~/.vibecost/system.md",
  "cost_limit": 5.00
}
```

### Custom MCP Tools

Place JSON files in `~/.config/vibecost/tools/` or a project directory:

```json
{
  "tools": [
    {
      "name": "search_docs",
      "description": "Search internal documentation",
      "parameters": ["query"],
      "result_tokens": 3000
    }
  ]
}
```

---

## Development

### Project Structure

```
vibecost/
├── pyproject.toml            # Build config, deps, entry point
├── requirements.txt          # Pinned dependencies
├── data/
│   └── models.json           # 15 model definitions with pricing
├── src/
│   └── vibecost/
│       ├── __init__.py
│       ├── __main__.py       # Entry point: vibecost()
│       ├── cli/              # Click commands
│       │   ├── app.py        # CLI group + command registration
│       │   ├── flags.py      # 13 shared click options
│       │   └── commands/
│       │       ├── scan.py   # Full scan pipeline (11 steps)
│       │       ├── compare.py
│       │       ├── init.py   # Interactive wizard (questionary)
│       │       ├── profile.py
│       │       └── prompt.py
│       ├── config/
│       │   ├── models.py     # Load + parse data/models.json
│       │   └── user_config.py
│       ├── types/            # Dataclass definitions
│       │   ├── model.py      # Model, Pricing, CalibrationFactor
│       │   ├── scan.py       # ContentProfile, FileEntry, FileMap
│       │   ├── simulation.py # AssembledContext, LoopResult, SimParams
│       │   └── cost.py       # CostBreakdown, PressureLevel
│       ├── scanner/
│       │   ├── walker.py
│       │   ├── file_map.py
│       │   ├── content_profiler.py
│       │   ├── binary_detector.py
│       │   └── gitignore.py
│       ├── tokenizers/
│       │   ├── dispatch.py
│       │   ├── calibration.py
│       │   ├── overhead.py
│       │   └── engines/
│       │       ├── tiktoken_engine.py
│       │       ├── transformers_engine.py
│       │       └── heuristic_engine.py
│       ├── simulation/
│       │   ├── context_assembler.py
│       │   ├── agent_loop.py
│       │   ├── reasoning_estimator.py
│       │   └── cache_calculator.py
│       ├── costs/
│       │   ├── calculator.py
│       │   ├── pressure_model.py
│       │   └── breakdown.py
│       ├── renderer/
│       │   ├── summary.py
│       │   ├── comparison.py
│       │   ├── overflow.py
│       │   └── progress_bar.py
│       └── prompt/
│           ├── predictor.py
│           ├── file_predictor.py
│           └── mcp_tools.py
└── tests/
    ├── conftest.py
    ├── test_tiktoken.py      # 25 tests
    ├── test_heuristic.py     # 32 tests
    ├── test_dispatch.py      # 13 tests
    ├── test_calibration.py   # 13 tests
    ├── test_gitignore.py     # 18 tests
    ├── test_binary_detector.py # 26 tests
    ├── test_content_profiler.py # 40 tests
    ├── test_context_assembler.py
    ├── test_agent_loop.py    # 20 tests
    ├── test_reasoning_estimator.py
    ├── test_cache_calculator.py
    ├── test_calculator.py
    ├── test_pressure_model.py
    ├── test_breakdown.py
    ├── test_file_predictor.py
    ├── test_mcp_tools.py
    ├── test_predictor.py
    └── test_renderer.py
```

### Running Tests

```bash
pip install -e .           # Install in dev mode
python -m pytest tests/ -v  # 400 tests
```

### Adding a Model

Add an entry to `data/models.json`:

```json
{
  "gpt-5": {
    "provider": "openai",
    "display_name": "GPT-5",
    "context_window": 262144,
    "max_output": 32768,
    "tokenizer": "o200k_base",
    "tokenizer_engine": "tiktoken",
    "pricing": {
      "input_per_million": 5.00,
      "output_per_million": 20.00,
      "cache_read_per_million": 2.50,
      "cache_write_per_million": 5.00
    }
  }
}
```

No code changes needed — the model loads dynamically from the data file.

---

## Example Workflows

### Budget an AI coding session

```bash
# What will it cost to have GPT-4o write 3 features in my project?
vibecost scan . --loops 3 --output-estimate 4000

# Is Claude Sonnet cheaper for this task?
vibecost scan . --model claude-sonnet-4-5 --loops 3 --output-estimate 4000

# What about with extended reasoning?
vibecost scan . --model o3-mini --thinking deep
```

### Pick the cheapest model for your codebase

```bash
vibecost compare . --providers openai,google,deepseek
```

### Predict agent behavior before coding

```bash
# What files will the AI need to change for this feature?
vibecost prompt "migrate from REST to GraphQL" --dir src/api

# Will it need to search the codebase first?
vibecost prompt "find all deprecated API endpoints" --dir src
```

### Enforce cost budgets in CI

```json
{
  "cost_limit": 1.00,
  "default_model": "gpt-4o-mini",
  "default_loops": 3
}
```

```bash
vibecost scan . --cost-limit 1.00  # exits 1 if exceeded
```

---

## License

MIT
