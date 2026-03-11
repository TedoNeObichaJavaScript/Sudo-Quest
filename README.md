<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=40&duration=3000&pause=1000&color=00FF41&center=true&vCenter=true&repeat=true&width=600&height=80&lines=%24+sudo+solve;%3E+Access+Granted+%E2%9C%93;%3E+Level+Up+%F0%9F%9A%80" alt="sudo solve animation" />
</p>

<p align="center">
  <strong>Learn to code, one command at a time.</strong>
</p>

<p align="center">
  <a href="#-features"><img src="https://img.shields.io/badge/levels-210-00ff41?style=for-the-badge&labelColor=0d1117" alt="210 Levels"></a>
  <a href="#-categories"><img src="https://img.shields.io/badge/categories-6-00ff41?style=for-the-badge&labelColor=0d1117" alt="6 Categories"></a>
  <a href="#-getting-started"><img src="https://img.shields.io/badge/framework-none-00ff41?style=for-the-badge&labelColor=0d1117" alt="No Framework"></a>
  <img src="https://img.shields.io/badge/license-MIT-00ff41?style=for-the-badge&labelColor=0d1117" alt="MIT License">
</p>

<br>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&size=14&duration=2000&pause=500&color=00FF41&center=true&vCenter=true&repeat=true&width=500&lines=%24+console.log(%22Hello%2C+World!%22);+%E2%9C%93+PASSED;%24+let+hero+%3D+%22Ada%22;+%E2%9C%93+PASSED;%24+for+(let+i%3D1;+i%3C%3D5;+i%2B%2B)+%7B...%7D;+%E2%9C%93+PASSED;%24+git+init;+%E2%9C%93+Repository+initialized" alt="gameplay demo" />
</p>

---

## What is sudo solve?

**sudo solve** is an interactive browser-based coding game that teaches programming through a terminal interface. Type real code, get instant feedback, and progress through 210 levels covering JavaScript, HTML, CSS, Git, Terminal commands, and C#.

No accounts. No installs. No setup. Just open and start typing.

```
 +======================================================+
 |  user@sudoquest:~$                                   |
 |                                                      |
 |  Level 1: Hello, World!                              |
 |  Use console.log() to print "Hello, World!"          |
 |                                                      |
 |  $ console.log("Hello, World!")                      |
 |                                                      |
 |  > PASSED -- You just printed your first message!    |
 |                                                      |
 +======================================================+
```

---

## Features

- **Real Code Execution** — JavaScript runs in a sandboxed Web Worker. No simulation, no faking it
- **Git & Terminal Simulation** — Simulated environments with persistent state for Git and shell commands
- **6 Categories** — JavaScript, HTML, CSS, Git, Terminal, and C# — 35 levels each
- **Category Selection** — Pick any category from the selection screen and learn at your own pace
- **3-Tier Hint System** — Stuck? Reveal hints progressively — from concept to syntax to full answer
- **Session Timer** — Track your total time and per-level splits as you play
- **8 Themes** — Green (default), amber, cyan, purple, red, pink, blue, and white — saved to localStorage
- **Progress Persistence** — Your progress saves to `localStorage`. Close the tab, come back later
- **Terminal UI** — Authentic dark terminal aesthetic with system monospace fonts and a blinking cursor
- **Keyboard-First** — Type commands and press Enter. Shift+Enter for multi-line. Arrow keys for history
- **Zero Dependencies** — Pure HTML, CSS, and vanilla JS on the frontend. Just Express for serving

---

## Categories

| # | Category | Levels | What You'll Learn |
|---|----------|--------|-------------------|
| 1 | **JavaScript** | 35 | Variables, types, control flow, loops, arrays, objects, functions, arrow functions, destructuring, spread, classes, closures |
| 2 | **Git** | 35 | init, add, commit, status, log, branching, checkout, switch, stash, merge, feature branch workflows |
| 3 | **Terminal** | 35 | pwd, ls, cd, mkdir, touch, echo, cat, cp, mv, rm, pipes, grep, sort, head, tail, environment variables |
| 4 | **HTML** | 35 | Boilerplate, headings, links, images, lists, forms, inputs, tables, semantic elements, meta tags, data attributes |
| 5 | **CSS** | 35 | Selectors, box model, flexbox, grid, positioning, transitions, hover states, media queries, CSS variables, pseudo-elements |
| 6 | **C#** | 35 | Types, variables, control flow, arrays, lists, methods, classes, inheritance, interfaces, LINQ, async/await, enums |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)

### Run Locally

```bash
# Clone the repository
git clone https://github.com/TedoNeObichaJavaScript/SUDO-Solve.git
cd SUDO-Solve

# Install dependencies
npm install

# Start the server
npm start
```

Open [http://localhost:3000](http://localhost:3000) and start solving.

---

## Project Structure

```
sudo-solve/
├── public/
│   ├── index.html                  # Single page app shell
│   ├── css/
│   │   └── styles.css              # Terminal theme (pure CSS, 8 themes)
│   ├── js/
│   │   ├── app.js                  # Game engine (SudoQuest class)
│   │   ├── levels.js               # Level orchestrator, imports all categories
│   │   └── levels/                 # Per-category level definitions
│   │       ├── helpers.js          # Shared validation helpers
│   │       ├── js.js               # JavaScript levels (35)
│   │       ├── git.js              # Git levels (35)
│   │       ├── cmd.js              # Terminal levels (35)
│   │       ├── html.js             # HTML levels (35)
│   │       ├── css.js              # CSS levels (35)
│   │       └── csharp.js           # C# levels (35)
│   └── workers/
│       └── sandbox-worker.js       # Web Worker for safe code execution
├── server/
│   └── index.js                    # Express static server
├── package.json
└── LICENSE
```

---

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  User types  │────>│  Game Engine  │────>│  Sandbox Worker │
│  code in     │     │  (app.js)    │     │  (Web Worker)   │
│  terminal    │     │              │     │                 │
│              │<────│  Validates   │<────│  Executes code  │
│  Gets result │     │  output      │     │  safely         │
└─────────────┘     └──────────────┘     └─────────────────┘
```

1. **User input** is captured from the terminal-styled input field
2. **JavaScript levels** send code to a Web Worker sandbox that executes it safely and returns variables, console output, and errors
3. **Git & Terminal levels** process commands through simulated state machines with persistent state
4. **HTML, CSS, and C# levels** validate code as text against expected patterns
5. **Validation functions** (defined per-level) check if the output matches expected results
6. **Progress** is saved to `localStorage` after each completed level

---

## Commands

| Command | Description |
|---------|-------------|
| `help` | Show available commands |
| `hint` | Reveal the next hint (3 per level) |
| `skip` | Skip to the next level |
| `reset` | Reset the current level |
| `categories` | Return to category selection |
| `theme` | Cycle through 8 terminal themes |
| `clear` | Clear the terminal screen |
| `Shift+Enter` | New line in input |
| `↑` / `↓` | Navigate command history |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS (ES modules), CSS, HTML |
| Fonts | System monospace stack |
| Code Execution | Web Workers (sandboxed) |
| Server | Express.js |
| Storage | localStorage |

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&size=16&duration=4000&pause=2000&color=00FF41&center=true&vCenter=true&repeat=true&width=400&height=30&lines=%24+sudo+solve+--all;Happy+hacking!+%F0%9F%92%BB" alt="footer" />
</p>
