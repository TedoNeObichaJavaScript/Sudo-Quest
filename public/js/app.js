// ═══════════════════════════════════════════════════════════════
//  SUDO QUEST — Game Engine
// ═══════════════════════════════════════════════════════════════

import { CATEGORIES, getCategoryByKey, getLevelsForCategory } from './levels.js';

const THEMES = {
  green:  { name: 'Matrix Green',  key: 'green' },
  amber:  { name: 'Amber CRT',    key: 'amber' },
  cyan:   { name: 'Cyan Neon',    key: 'cyan' },
  purple: { name: 'Purple Haze',  key: 'purple' },
  red:    { name: 'Red Alert',    key: 'red' },
  pink:   { name: 'Hot Pink',     key: 'pink' },
  blue:   { name: 'Ocean Blue',   key: 'blue' },
  white:  { name: 'Monochrome',   key: 'white' },
};

class SudoQuest {
  constructor() {
    // Game state
    this.currentLevelIndex = 0;
    this.attempts = {};
    this.hintsRevealed = {};
    this.completedLevels = new Set();
    this.commandHistory = [];
    this.historyIndex = -1;
    this.isExecuting = false;

    // Category state
    this.currentCategory = null; // category key
    this.levels = [];            // levels for current category
    this.gameStarted = false;
    this.awaitingReady = false;
    this.awaitingCategory = false;

    // Timer state
    this.sessionStartTime = null;
    this.levelStartTime = null;
    this.levelTimes = {};
    this.timerInterval = null;
    this.timerRunning = false;

    // Git state (persists across commands within a git level)
    this.gitState = null;

    // CMD state (persists across commands within a cmd level)
    this.cmdState = null;

    // Score & achievements
    this.score = {};            // per-level score (100 base, -25 per hint)
    this.personalBests = {};    // per-category best total times
    this.achievements = new Set();
    this.firstTryStreak = 0;

    // Tab completion
    this.tabCommands = ['hint','clear','reset','restart','levels','categories','skip','next','theme','help','explain','save','load','achievements','score'];

    // DOM elements
    this.output = document.getElementById('output');
    this.input = document.getElementById('input');
    this.runBtn = document.getElementById('run-btn');
    this.levelIndicator = document.getElementById('level-indicator');
    this.progressFill = document.getElementById('progress-fill');
    this.categoryDisplay = document.getElementById('category-display');
    this.timerClock = document.getElementById('timer-clock');
    this.segmentTime = document.getElementById('segment-time');
    this.splitsList = document.getElementById('splits-list');
    this.timerSidebar = document.getElementById('timer-sidebar');
    this.toolbar = document.getElementById('action-toolbar');
    this.scoreDisplay = document.getElementById('score-display');
    this.achievementToast = document.getElementById('achievement-toast');
    this.kbOverlay = document.getElementById('kb-overlay');
    this.hamburger = document.getElementById('hamburger');
    this.mobileDrawer = document.getElementById('mobile-drawer');
    this.mobileOverlay = document.getElementById('mobile-overlay');

    if (!this.input || !this.output) {
      console.error('Required DOM elements not found');
      return;
    }

    this.init();
  }

  // ── Initialization ──────────────────────────────────────────

  init() {
    this.loadTheme();
    this.loadProgress();
    this.setupEventListeners();
    this.setupTimerDisplay();
    if (this.gameStarted && this.currentCategory) {
      this.levels = getLevelsForCategory(this.currentCategory);
      // Clamp index to valid range (guards against stale/corrupt localStorage)
      if (this.currentLevelIndex < 0 || this.currentLevelIndex >= this.levels.length) {
        this.currentLevelIndex = 0;
      }
      this.showTimerSidebar(true);
      this.startTimer();
      this.renderSplits();
      this.loadLevel(this.currentLevelIndex);
    } else {
      this.showTimerSidebar(false);
      this.showReadyScreen();
    }
  }

  setupEventListeners() {
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !this.isExecuting) {
        e.preventDefault();
        this.handleInput();
      }
      if (e.key === 'ArrowUp' && !e.shiftKey) {
        e.preventDefault();
        this.navigateHistory(-1);
      }
      if (e.key === 'ArrowDown' && !e.shiftKey) {
        e.preventDefault();
        this.navigateHistory(1);
      }
    });

    // Auto-resize textarea
    this.input.addEventListener('input', () => {
      this.input.style.height = 'auto';
      this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
    });

    this.runBtn.addEventListener('click', () => {
      if (!this.isExecuting) this.handleInput();
    });

    this.output.addEventListener('click', () => this.input.focus());

    if (this.toolbar) {
      this.toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('.toolbar-btn');
        if (!btn) return;
        const cmd = btn.dataset.cmd;
        if (cmd && !this.isExecuting) {
          this.addLine(`$ ${cmd}`, 'command');
          this.handleSpecialCommand(cmd);
        }
      });
    }

    // Tab completion
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.handleTabComplete();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        this.clearTerminal();
        if (this.gameStarted) this.loadLevel(this.currentLevelIndex, true);
      }
      // Ctrl+/ or ? for keyboard overlay
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        this.toggleKbOverlay();
      }
      if (e.key === 'Escape' && this.kbOverlay && !this.kbOverlay.hidden) {
        this.kbOverlay.hidden = true;
      }
      if (e.key === 'Escape' && this.mobileDrawer?.classList.contains('open')) {
        this.closeMobileDrawer();
      }
    });

    // Keyboard overlay click-to-close
    if (this.kbOverlay) {
      this.kbOverlay.addEventListener('click', (e) => {
        if (e.target === this.kbOverlay) this.kbOverlay.hidden = true;
      });
    }

    // Mobile hamburger
    if (this.hamburger) {
      this.hamburger.addEventListener('click', () => this.toggleMobileDrawer());
    }
    if (this.mobileOverlay) {
      this.mobileOverlay.addEventListener('click', () => this.closeMobileDrawer());
    }
    if (this.mobileDrawer) {
      this.mobileDrawer.addEventListener('click', (e) => {
        const btn = e.target.closest('.drawer-btn');
        if (!btn) return;
        const cmd = btn.dataset.cmd;
        if (cmd && !this.isExecuting) {
          this.closeMobileDrawer();
          this.addLine(`$ ${cmd}`, 'command');
          this.handleSpecialCommand(cmd);
        }
      });
    }
  }

  // ── Ready Screen ──────────────────────────────────────────

  showReadyScreen() {
    this.clearTerminal();
    const art = `
 ╔═╗ ╦ ╦ ╔╦╗ ╔═╗   ╔═╗ ╦ ╦ ╔═╗ ╔═╗ ╔╦╗
 ╚═╗ ║ ║  ║║ ║ ║   ║ ║ ║ ║ ║╣  ╚═╗  ║
 ╚═╝ ╚═╝ ═╩╝ ╚═╝   ╚═╝ ╚═╝ ╚═╝ ╚═╝  ╩`;

    this.addHTML(`<pre class="ascii-art">${art}</pre>`, 'system');
    this.addBlank();
    this.addLine('Welcome to sudo quest! Learn to code, one command at a time.', 'system');
    this.addBlank();
    this.addLine('Are you ready?  (y/n)', 'question');
    this.addBlank();
    this.awaitingReady = true;
  }

  showCategoryScreen() {
    this.clearTerminal();
    this.addLine('Choose a category:', 'question');
    this.addBlank();
    CATEGORIES.forEach((cat) => {
      const count = cat.levels.length;
      const completed = cat.levels.filter(l => this.completedLevels.has(l.id)).length;
      const status = completed === count ? ' [COMPLETE]' : completed > 0 ? ` [${completed}/${count}]` : '';
      this.addLine(`  ${cat.key.padEnd(8)} — ${cat.name} (${count} levels)${status}`, 'system');
    });
    this.addBlank();
    this.addLine('Type a category name to begin (e.g. "js", "git", "html"):', 'dim');
    this.addBlank();
    this.awaitingCategory = true;
  }

  handleReadyInput(input) {
    if (input === 'y' || input === 'yes') {
      this.awaitingReady = false;
      this.showCategoryScreen();
      return true;
    }
    if (input === 'n' || input === 'no') {
      this.addLine('Take your time. Type "y" when ready!', 'dim');
      return true;
    }
    return false;
  }

  handleCategoryInput(input) {
    const cat = getCategoryByKey(input);
    if (cat) {
      this.awaitingCategory = false;
      this.currentCategory = input;
      this.levels = cat.levels;
      this.currentLevelIndex = 0;
      this.gameStarted = true;

      // Reset timer for new category
      this.levelTimes = {};
      this.showTimerSidebar(true);
      this.startTimer();
      this.renderSplits();
      this.clearTerminal();
      this.addLine(`Starting ${cat.name}...`, 'system');
      this.addBlank();
      this.loadLevel(0);
      this.saveProgress();
      return true;
    }
    this.addLine(`Unknown category "${input}". Type one of: ${CATEGORIES.map(c => c.key).join(', ')}`, 'error');
    return true;
  }

  // ── Progress Persistence ────────────────────────────────────

  saveProgress() {
    const data = {
      currentLevelIndex: this.currentLevelIndex,
      completedLevels: [...this.completedLevels],
      attempts: this.attempts,
      hintsRevealed: this.hintsRevealed,
      levelTimes: this.levelTimes,
      currentCategory: this.currentCategory,
      gameStarted: this.gameStarted,
      score: this.score,
      personalBests: this.personalBests,
      achievements: [...this.achievements]
    };
    try {
      localStorage.setItem('sudoquest_progress', JSON.stringify(data));
    } catch (_) {}
  }

  loadProgress() {
    try {
      const data = JSON.parse(localStorage.getItem('sudoquest_progress'));
      if (data) {
        this.currentLevelIndex = data.currentLevelIndex || 0;
        this.completedLevels = new Set(data.completedLevels || []);
        this.attempts = data.attempts || {};
        this.hintsRevealed = data.hintsRevealed || {};
        this.levelTimes = data.levelTimes || {};
        this.currentCategory = data.currentCategory || null;
        this.gameStarted = data.gameStarted || false;
        this.score = data.score || {};
        this.personalBests = data.personalBests || {};
        this.achievements = new Set(data.achievements || []);
      }
    } catch (_) {}
  }

  // ── Command History ─────────────────────────────────────────

  navigateHistory(dir) {
    if (!this.commandHistory.length) return;
    this.historyIndex += dir;
    if (this.historyIndex < 0) { this.historyIndex = -1; this.input.value = ''; return; }
    if (this.historyIndex >= this.commandHistory.length) this.historyIndex = this.commandHistory.length - 1;
    this.input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex] || '';
  }

  // ── Terminal Output ─────────────────────────────────────────

  addLine(text, type = 'default') {
    const line = document.createElement('div');
    line.className = `line line-${type}`;
    line.textContent = text;
    this.output.appendChild(line);
    this.scrollToBottom();
  }

  addHTML(html, type = 'default') {
    const line = document.createElement('div');
    line.className = `line line-${type}`;
    line.innerHTML = html;
    this.output.appendChild(line);
    this.scrollToBottom();
  }

  addBlank() {
    const line = document.createElement('div');
    line.className = 'line';
    line.innerHTML = '&nbsp;';
    this.output.appendChild(line);
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.output.scrollTop = this.output.scrollHeight;
  }

  clearTerminal() {
    this.output.innerHTML = '';
  }

  // ── Level Display ───────────────────────────────────────────

  loadLevel(index, quiet = false) {
    const level = this.levels[index];
    if (!level) return;

    if (level.type === 'git') this.gitState = this.createInitialGitState();
    if (level.type === 'cmd') this.cmdState = this.createInitialCmdState();

    this.updateHeader(level);
    this.renderSplits();

    // Init score for this level
    if (!this.score[level.id]) this.score[level.id] = 100;
    this.updateScoreDisplay(level.id);

    if (!quiet) {
      const bar = '\u2550'.repeat(56);
      const stars = this.getDifficulty(index, this.levels.length);
      const diffLabel = ['Easy','Medium','Hard'][stars - 1];
      this.addLine(`\u2554${bar}\u2557`, 'level-header');
      const title = `  LEVEL ${index + 1}: ${level.title}`;
      const cat = `  Category: ${level.category}  |  ${'\u2605'.repeat(stars)} ${diffLabel}`;
      this.addLine(`\u2551${title.padEnd(56)}\u2551`, 'level-header');
      this.addLine(`\u2551${cat.padEnd(56)}\u2551`, 'level-header');
      this.addLine(`\u255A${bar}\u255D`, 'level-header');
      this.addBlank();
      this.addLine(`> ${level.question}`, 'question');
      this.addBlank();

      const id = level.id;
      const hintsUsed = this.hintsRevealed[id] || 0;
      this.addLine(hintsUsed > 0
        ? `Type 'hint' for help (${hintsUsed}/3 hints revealed).`
        : "Type 'hint' if you need help (0/3 hints used).", 'dim');

      // Show multi-line tip for questions that might need it
      if (level.type === 'js' || level.type === 'csharp') {
        this.addLine("Shift+Enter for new line.", 'dim');
      }
      this.addLine('\u2500'.repeat(58), 'dim');
    }

    this.input.focus();
  }

  updateHeader(level) {
    const total = this.levels.length;
    const levelNum = this.currentLevelIndex + 1;
    if (this.levelIndicator) this.levelIndicator.textContent = `Level ${levelNum}/${total}`;
    if (this.progressFill) {
      const completed = this.levels.filter(l => this.completedLevels.has(l.id)).length;
      this.progressFill.style.width = `${(completed / total) * 100}%`;
    }
    if (this.categoryDisplay) this.categoryDisplay.textContent = level.category;
  }

  // ── Input Handling ──────────────────────────────────────────

  async handleInput() {
    const raw = this.input.value;
    const trimmed = raw.trim();
    this.input.value = '';
    this.input.style.height = 'auto';

    if (!trimmed) return;

    // Save to history
    if (this.commandHistory[this.commandHistory.length - 1] !== trimmed) {
      this.commandHistory.push(trimmed);
      if (this.commandHistory.length > 100) this.commandHistory.shift();
    }
    this.historyIndex = -1;

    // Show command (truncate display for multi-line)
    const display = trimmed.includes('\n') ? trimmed.split('\n')[0] + ' ...' : trimmed;
    this.addLine(`$ ${display}`, 'command');

    // Ready/Category screens
    const lower = trimmed.toLowerCase();
    if (this.awaitingReady) { this.handleReadyInput(lower); return; }
    if (this.awaitingCategory) { this.handleCategoryInput(lower); return; }

    // Special commands
    if (this.handleSpecialCommand(lower)) return;

    // Execute
    this.isExecuting = true;
    this.runBtn.textContent = '...';
    this.runBtn.disabled = true;

    try {
      const level = this.levels[this.currentLevelIndex];
      if (!level) return;

      switch (level.type) {
        case 'git':
          await this.executeGit(trimmed, level);
          break;
        case 'cmd':
          await this.executeCmd(trimmed, level);
          break;
        case 'html':
        case 'css':
        case 'csharp':
          await this.executeText(trimmed, level);
          break;
        default: // js
          await this.executeJS(trimmed, level);
      }
    } catch (err) {
      this.addLine(`Error: ${err.message}`, 'error');
    } finally {
      this.isExecuting = false;
      this.runBtn.textContent = 'RUN';
      this.runBtn.disabled = false;
      this.input.focus();
    }
  }

  handleSpecialCommand(cmd) {
    if (this.isExecuting) return false;
    const commands = {
      help: () => this.showHelp(),
      hint: () => this.revealHint(),
      clear: () => { this.clearTerminal(); this.loadLevel(this.currentLevelIndex, true); },
      reset: () => this.resetLevel(),
      restart: () => this.restartGame(),
      levels: () => this.showLevels(),
      categories: () => { this.gameStarted = false; this.showTimerSidebar(false); this.showCategoryScreen(); },
      skip: () => this.skipLevel(),
      next: () => this.skipLevel(),
      explain: () => this.showExplain(),
      save: () => this.exportProgress(),
      achievements: () => this.showAchievements(),
      score: () => this.showScore(),
      '?': () => this.toggleKbOverlay(),
    };

    const run = (fn) => {
      this.isExecuting = true;
      try { fn(); } finally { this.isExecuting = false; }
      return true;
    };

    if (commands[cmd]) return run(commands[cmd]);

    if (cmd.startsWith('level ')) {
      const num = parseInt(cmd.split(' ')[1]);
      if (!isNaN(num)) return run(() => this.jumpToLevel(num));
    }
    if (cmd === 'theme' || cmd.startsWith('theme ')) {
      return run(() => this.handleThemeCommand(cmd.slice(5).trim()));
    }
    if (cmd.startsWith('load ')) {
      return run(() => this.importProgress(cmd.slice(5).trim()));
    }
    return false;
  }

  // ── Special Commands ────────────────────────────────────────

  showHelp() {
    this.addBlank();
    this.addLine('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', 'system');
    this.addLine('\u2551          AVAILABLE COMMANDS          \u2551', 'system');
    this.addLine('\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563', 'system');
    const cmds = [
      ['hint',         'Reveal next hint (-25 pts)'],
      ['explain',      'Concept deep-dive'],
      ['clear',        'Clear terminal'],
      ['reset',        'Reset current level'],
      ['restart',      'Restart everything'],
      ['levels',       'Show all levels'],
      ['categories',   'Pick a new category'],
      ['level N',      'Jump to level N'],
      ['skip',         'Skip to next level'],
      ['theme',        'Change color theme'],
      ['save',         'Export progress'],
      ['load <data>',  'Import progress'],
      ['achievements', 'View badges'],
      ['score',        'Score summary'],
      ['?',            'Keyboard shortcuts'],
      ['help',         'Show this help'],
    ];
    cmds.forEach(([c, d]) => {
      this.addLine(`\u2551  ${c.padEnd(12)}\u2014 ${d.padEnd(22)}\u2551`, 'system');
    });
    this.addLine('\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D', 'system');
    this.addLine('Shift+Enter for multi-line input.', 'dim');
    this.addBlank();
  }

  // ── Theme System ────────────────────────────────────────────

  loadTheme() {
    try {
      const saved = localStorage.getItem('sudoquest_theme');
      if (saved && THEMES[saved]) this.applyTheme(saved);
    } catch (_) {}
  }

  applyTheme(key) {
    if (key === 'green') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', key);
    }
    try { localStorage.setItem('sudoquest_theme', key); } catch (_) {}
  }

  handleThemeCommand(args) {
    const name = args.trim().toLowerCase();
    if (!name) {
      this.addBlank();
      this.addLine('Available themes:', 'system');
      Object.values(THEMES).forEach(t => {
        this.addLine(`  ${t.key.padEnd(10)} — ${t.name}`, 'system');
      });
      this.addBlank();
      this.addLine('Usage: theme <name>  (e.g. "theme cyan")', 'dim');
      this.addBlank();
      return;
    }
    if (THEMES[name]) {
      this.applyTheme(name);
      this.addLine(`Theme set to ${THEMES[name].name}.`, 'success');
    } else {
      this.addLine(`Unknown theme "${name}". Type "theme" to see options.`, 'error');
    }
  }

  revealHint() {
    const level = this.levels[this.currentLevelIndex];
    if (!level) return;
    const id = level.id;
    const revealed = this.hintsRevealed[id] || 0;

    if (revealed >= 3) {
      this.addLine('All hints revealed:', 'dim');
      level.hints.forEach((h, i) => this.addLine(`  ${i === 2 ? 'ANSWER' : `Hint ${i + 1}`}: ${h}`, 'hint'));
      return;
    }

    if ((this.attempts[id] || 0) < 1 && revealed === 0) {
      this.addLine('Try at least once before asking for a hint!', 'dim');
      return;
    }

    this.hintsRevealed[id] = revealed + 1;
    // Deduct score for hint
    if (!this.score[id]) this.score[id] = 100;
    this.score[id] = Math.max(0, this.score[id] - 25);
    this.updateScoreDisplay(id);

    const prefix = revealed === 2 ? 'ANSWER' : `Hint ${revealed + 1}`;
    this.addBlank();
    this.addLine(`\uD83D\uDCA1 ${prefix}: ${level.hints[revealed]}`, 'hint');
    this.addLine(`  Score: ${this.score[id]} pts (-25 for hint)`, 'dim');
    this.addBlank();
    this.saveProgress();
  }

  resetLevel() {
    const level = this.levels[this.currentLevelIndex];
    if (!level) return;
    this.attempts[level.id] = 0;
    this.hintsRevealed[level.id] = 0;
    if (level.type === 'git') this.gitState = this.createInitialGitState();
    if (level.type === 'cmd') this.cmdState = this.createInitialCmdState();
    this.clearTerminal();
    this.addLine('[SYSTEM] Level reset.', 'dim');
    this.addBlank();
    this.loadLevel(this.currentLevelIndex);
    this.saveProgress();
  }

  restartGame() {
    // Stop timer
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerRunning = false;

    // Reset all state
    this.currentLevelIndex = 0;
    this.attempts = {};
    this.hintsRevealed = {};
    this.completedLevels = new Set();
    this.levelTimes = {};
    this.currentCategory = null;
    this.levels = [];
    this.gameStarted = false;
    this.sessionStartTime = null;
    this.levelStartTime = null;
    this.score = {};
    this.firstTryStreak = 0;

    // Reset display
    if (this.timerClock) this.timerClock.textContent = '0:00.00';
    if (this.segmentTime) this.segmentTime.textContent = '0:00.00';
    if (this.splitsList) this.splitsList.innerHTML = '';
    if (this.progressFill) this.progressFill.style.width = '0%';

    this.showTimerSidebar(false);
    this.saveProgress();
    this.showReadyScreen();
  }

  showLevels() {
    this.addBlank();
    let lastCat = '';
    this.levels.forEach((l, i) => {
      if (l.category !== lastCat) {
        lastCat = l.category;
        this.addLine(`  \u2500\u2500 ${l.category} \u2500\u2500`, 'level-header');
      }
      const done = this.completedLevels.has(l.id);
      const current = i === this.currentLevelIndex;
      const marker = done ? '\u2713' : current ? '>' : ' ';
      const status = done ? 'success' : current ? 'question' : 'dim';
      const time = this.levelTimes[l.id] ? ` (${this.formatTime(this.levelTimes[l.id])})` : '';
      this.addLine(`  ${marker} Level ${i + 1}: ${l.title}${time}`, status);
    });
    this.addBlank();
    this.addLine('Type "level N" to jump to a level (1-' + this.levels.length + ').', 'dim');
    this.addBlank();
  }

  skipLevel() {
    if (this.currentLevelIndex < this.levels.length - 1) {
      this.currentLevelIndex++;
      this.levelStartTime = Date.now();
      this.addBlank();
      this.addLine('[SYSTEM] Skipping to next level...', 'dim');
      this.addBlank();
      this.loadLevel(this.currentLevelIndex);
      this.saveProgress();
    } else {
      this.addLine("You're on the last level!", 'dim');
    }
  }

  jumpToLevel(num) {
    // Accept 1-based level number within category
    const idx = num - 1;
    if (idx < 0 || idx >= this.levels.length) {
      this.addLine(`Level ${num} not found. Valid range: 1-${this.levels.length}. Type 'levels' to see all.`, 'error');
      return;
    }
    this.currentLevelIndex = idx;
    this.levelStartTime = Date.now();
    this.clearTerminal();
    this.loadLevel(this.currentLevelIndex);
    this.saveProgress();
  }

  // ── JavaScript Execution ────────────────────────────────────

  async executeJS(code, level) {
    const result = await this.runInSandbox(code);

    if (result.consoleLogs?.length) {
      result.consoleLogs.forEach(log => this.addLine(log, 'output'));
    }

    if (result.errors?.length) {
      result.errors.forEach(err => this.addLine(`Error: ${err}`, 'error'));
    }

    const validation = level.validate(code, result);
    validation.passed ? this.onLevelPassed(level) : this.onLevelFailed(level, validation.feedback);
  }

  async runInSandbox(code, timeout = 3000) {
    return new Promise((resolve) => {
      let worker;
      try {
        worker = new Worker('/workers/sandbox-worker.js');
      } catch (_) {
        resolve(this.executeInline(code));
        return;
      }

      const timer = setTimeout(() => {
        worker.terminate();
        resolve({ variables: {}, functions: {}, consoleLogs: [], errors: ['Code timed out \u2014 possible infinite loop.'], timeout: true });
      }, timeout);

      worker.onmessage = (e) => { clearTimeout(timer); worker.terminate(); resolve(e.data); };
      worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); resolve({ variables: {}, functions: {}, consoleLogs: [], errors: [e.message || 'Execution error'], timeout: false }); };
      worker.postMessage({ code, requestId: Date.now().toString() });
    });
  }

  executeInline(code) {
    const logs = [];
    const mockConsole = {
      log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
    };
    try {
      const names = new Set();
      for (const m of code.matchAll(/(?:var|let|const)\s+([a-zA-Z_$]\w*)/g)) names.add(m[1]);
      for (const m of code.matchAll(/function\s+([a-zA-Z_$]\w*)/g)) names.add(m[1]);

      const captures = [...names].map(n => `try{__v["${n}"]=${n};__t["${n}"]=typeof ${n}}catch(_){}`).join(';');
      const wrapped = `var console=arguments[0];${code};var __v={},__t={};${captures};return{v:__v,t:__t}`;
      const fn = new Function(wrapped);
      const r = fn(mockConsole);

      const variables = {}, functions = {};
      for (const k in r.v) {
        if (r.t[k] === 'function') functions[k] = true;
        else variables[k] = r.v[k];
      }
      return { variables, functions, consoleLogs: logs, errors: [], timeout: false };
    } catch (e) {
      return { variables: {}, functions: {}, consoleLogs: logs, errors: [e.message], timeout: false };
    }
  }

  // ── Text Execution (HTML/CSS/C#) ────────────────────────────

  async executeText(code, level) {
    // Show the user's code
    code.split('\n').forEach(line => this.addLine(line, 'output'));

    const validation = level.validate(code);
    validation.passed ? this.onLevelPassed(level) : this.onLevelFailed(level, validation.feedback);
  }

  // ── CMD Execution ──────────────────────────────────────────

  createInitialCmdState() {
    return {
      cwd: '~',
      files: {},
      dirs: new Set(['~', '~/Documents', '~/Downloads']),
      env: { USER: 'coder', HOME: '~', PATH: '/usr/bin:/bin' },
      output: [],
      history: []
    };
  }

  async executeCmd(input, level) {
    if (!this.cmdState) this.cmdState = this.createInitialCmdState();
    this.cmdState.history.push(input);

    const result = this.executeCmdCommand(input);
    if (result.error) {
      this.addLine(result.error, 'error');
    } else if (result.output) {
      result.output.split('\n').forEach(line => this.addLine(line, 'output'));
    }

    const validation = level.validate(input, this.cmdState);
    if (validation.passed) {
      this.onLevelPassed(level);
    } else if (!result.error) {
      this.addLine(validation.feedback, 'dim');
    }
  }

  executeCmdCommand(input) {
    const trimmed = input.trim();
    const s = this.cmdState;

    // Handle pipes (basic)
    if (trimmed.includes(' | ')) {
      const parts = trimmed.split(' | ').map(p => p.trim());
      let lastOutput = '';
      for (const part of parts) {
        const r = this.executeSingleCmd(part, lastOutput);
        if (r.error) return r;
        lastOutput = r.output || '';
      }
      return { output: lastOutput };
    }

    // Handle redirect > and >>
    const appendMatch = trimmed.match(/^(.+?)\s*>>\s*(\S+)$/);
    if (appendMatch) {
      const r = this.executeSingleCmd(appendMatch[1].trim());
      if (r.error) return r;
      const path = this.resolvePath(appendMatch[2]);
      s.files[path] = (s.files[path] || '') + (r.output || '') + '\n';
      return { output: '' };
    }

    const redirectMatch = trimmed.match(/^(.+?)\s*>\s*(\S+)$/);
    if (redirectMatch) {
      const r = this.executeSingleCmd(redirectMatch[1].trim());
      if (r.error) return r;
      const path = this.resolvePath(redirectMatch[2]);
      s.files[path] = (r.output || '') + '\n';
      return { output: '' };
    }

    return this.executeSingleCmd(trimmed);
  }

  executeSingleCmd(input, pipeInput) {
    const parts = this.parseShellArgs(input);
    const cmd = parts[0];
    const args = parts.slice(1);
    const s = this.cmdState;

    switch (cmd) {
      case 'echo': {
        // Check for env var
        if (args[0]?.startsWith('$')) {
          const varName = args[0].substring(1);
          return { output: s.env[varName] || '' };
        }
        return { output: args.join(' ') };
      }
      case 'pwd':
        return { output: s.cwd };
      case 'whoami':
        return { output: s.env.USER || 'coder' };
      case 'ls': {
        const target = args[0] ? this.resolvePath(args[0]) : s.cwd;
        const items = [];
        // List dirs
        for (const d of s.dirs) {
          const parent = d.substring(0, d.lastIndexOf('/')) || '~';
          if (parent === target && d !== target) items.push(d.split('/').pop() + '/');
        }
        // List files
        for (const f in s.files) {
          const parent = f.substring(0, f.lastIndexOf('/')) || '~';
          if (parent === target) items.push(f.split('/').pop());
        }
        return { output: items.length ? items.join('  ') : '' };
      }
      case 'cd': {
        if (!args[0] || args[0] === '~') { s.cwd = '~'; return { output: '' }; }
        if (args[0] === '..') {
          s.cwd = s.cwd.substring(0, s.cwd.lastIndexOf('/')) || '~';
          return { output: '' };
        }
        const target = this.resolvePath(args[0]);
        if (s.dirs.has(target)) { s.cwd = target; return { output: '' }; }
        return { error: `cd: no such directory: ${args[0]}` };
      }
      case 'mkdir': {
        const recursive = args[0] === '-p';
        const dirName = recursive ? args[1] : args[0];
        if (!dirName) return { error: 'mkdir: missing operand' };
        if (recursive) {
          const parts = dirName.split('/');
          let current = s.cwd;
          for (const part of parts) {
            current = current === '~' ? `~/${part}` : `${current}/${part}`;
            s.dirs.add(current);
          }
        } else {
          s.dirs.add(this.resolvePath(dirName));
        }
        return { output: '' };
      }
      case 'touch': {
        if (!args[0]) return { error: 'touch: missing operand' };
        const path = this.resolvePath(args[0]);
        if (!(path in s.files)) s.files[path] = '';
        return { output: '' };
      }
      case 'cat': {
        if (!args[0]) return { output: pipeInput || '' };
        const path = this.resolvePath(args[0]);
        if (path in s.files) return { output: s.files[path] };
        return { error: `cat: ${args[0]}: No such file or directory` };
      }
      case 'cp': {
        if (args.length < 2) return { error: 'cp: missing operand' };
        const src = this.resolvePath(args[0]);
        const dest = this.resolvePath(args[1]);
        if (!(src in s.files)) return { error: `cp: cannot stat '${args[0]}': No such file` };
        // If dest is a directory, put file inside it
        const destPath = s.dirs.has(dest) ? `${dest}/${args[0].split('/').pop()}` : dest;
        s.files[destPath] = s.files[src];
        return { output: '' };
      }
      case 'mv': {
        if (args.length < 2) return { error: 'mv: missing operand' };
        const src = this.resolvePath(args[0]);
        const dest = this.resolvePath(args[1]);
        if (!(src in s.files)) return { error: `mv: cannot stat '${args[0]}': No such file` };
        const destPath = s.dirs.has(dest) ? `${dest}/${args[0].split('/').pop()}` : dest;
        s.files[destPath] = s.files[src];
        delete s.files[src];
        return { output: '' };
      }
      case 'rm': {
        if (!args[0]) return { error: 'rm: missing operand' };
        const path = this.resolvePath(args[0]);
        if (path in s.files) { delete s.files[path]; return { output: '' }; }
        return { error: `rm: cannot remove '${args[0]}': No such file` };
      }
      case 'rmdir': {
        if (!args[0]) return { error: 'rmdir: missing operand' };
        const path = this.resolvePath(args[0]);
        if (!s.dirs.has(path)) return { error: `rmdir: '${args[0]}': No such directory` };
        // Check if empty
        const hasFiles = Object.keys(s.files).some(f => f.startsWith(path + '/'));
        const hasSubdirs = [...s.dirs].some(d => d !== path && d.startsWith(path + '/'));
        if (hasFiles || hasSubdirs) return { error: `rmdir: '${args[0]}': Directory not empty` };
        s.dirs.delete(path);
        return { output: '' };
      }
      case 'head': {
        const content = pipeInput || '';
        const n = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10;
        return { output: content.split('\n').slice(0, n).join('\n') };
      }
      case 'tail': {
        const content = pipeInput || '';
        const n = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10;
        return { output: content.split('\n').slice(-n).join('\n') };
      }
      case 'wc': {
        const content = pipeInput || '';
        const lines = content.split('\n').length;
        const words = content.split(/\s+/).filter(Boolean).length;
        const chars = content.length;
        return { output: `  ${lines}  ${words}  ${chars}` };
      }
      case 'sort': {
        const content = pipeInput || '';
        return { output: content.split('\n').sort().join('\n') };
      }
      case 'grep': {
        const pattern = args[0] || '';
        const content = pipeInput || '';
        const matches = content.split('\n').filter(l => l.includes(pattern));
        return { output: matches.join('\n') };
      }
      case 'export': {
        const match = args[0]?.match(/^(\w+)=(.*)$/);
        if (match) { s.env[match[1]] = match[2]; return { output: '' }; }
        return { error: 'export: invalid syntax. Use: export VAR=value' };
      }
      case 'env':
      case 'printenv': {
        return { output: Object.entries(s.env).map(([k, v]) => `${k}=${v}`).join('\n') };
      }
      case 'history':
        return { output: s.history.map((h, i) => `  ${i + 1}  ${h}`).join('\n') };
      case 'clear':
        return { output: '' };
      default:
        return { error: `${cmd}: command not found` };
    }
  }

  resolvePath(p) {
    if (p.startsWith('~/') || p === '~') return p;
    if (p.startsWith('/')) return p;
    return this.cmdState.cwd === '~' ? `~/${p}` : `${this.cmdState.cwd}/${p}`;
  }

  parseShellArgs(input) {
    const parts = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';
    for (const char of input) {
      if ((char === '"' || char === "'") && !inQuote) { inQuote = true; quoteChar = char; }
      else if (char === quoteChar && inQuote) { inQuote = false; }
      else if (char === ' ' && !inQuote) { if (current) parts.push(current); current = ''; }
      else { current += char; }
    }
    if (current) parts.push(current);
    return parts;
  }

  // ── Git Execution ──────────────────────────────────────────

  createInitialGitState() {
    return {
      initialized: false, HEAD: null, currentBranch: null,
      branches: {}, commits: [], index: {}, workingDirectory: {},
      stash: [], merged: [],
      _fileCreated: false, _fileStaged: false, _committed: false
    };
  }

  async executeGit(command, level) {
    if (!this.gitState) this.gitState = this.createInitialGitState();

    const result = this.executeGitCommand(command);
    if (result.error) {
      this.addLine(`error: ${result.error}`, 'error');
    } else if (result.message) {
      this.addLine(result.message, 'output');
    }

    const validation = level.validate(this.gitState);
    if (validation.passed) {
      this.onLevelPassed(level);
    } else if (!result.error) {
      this.addLine(validation.feedback, 'dim');
    }
  }

  executeGitCommand(input) {
    const trimmed = input.trim();
    const parts = this.parseShellArgs(trimmed);

    if (trimmed.startsWith('echo ') || trimmed.includes('>')) {
      return this.handleGitFileCreation(trimmed);
    }

    if (!trimmed.startsWith('git ')) {
      return { error: 'Not a recognized command. Use git commands or echo to create files.' };
    }

    const gitCmd = parts[1];
    const args = parts.slice(2);

    switch (gitCmd) {
      case 'init': return this.gitInit();
      case 'add': return this.gitAdd(args);
      case 'commit': return this.gitCommit(args);
      case 'branch': return this.gitBranch(args);
      case 'checkout': return this.gitCheckout(args);
      case 'switch': return this.gitSwitch(args);
      case 'merge': return this.gitMerge(args);
      case 'stash': return this.gitStash(args);
      case 'status': return this.gitStatus();
      case 'log': return this.gitLog();
      default: return { error: `Unknown git command: ${gitCmd}` };
    }
  }

  gitInit() {
    if (this.gitState.initialized) return { message: 'Reinitialized existing Git repository' };
    this.gitState.initialized = true;
    this.gitState.HEAD = 'refs/heads/main';
    this.gitState.currentBranch = 'main';
    this.gitState.branches = { main: { name: 'main', commit: null, commits: [] } };
    this.gitState.commits = [];
    this.gitState.index = {};
    return { message: 'Initialized empty Git repository in .git/' };
  }

  gitAdd(args) {
    if (!this.gitState.initialized) return { error: 'Not a git repository. Run "git init" first.' };
    const file = args[0];
    if (!file) return { error: 'No file specified. Usage: git add <filename>' };
    if (file === '.') {
      const files = Object.keys(this.gitState.workingDirectory);
      if (!files.length) return { error: 'Nothing to add.' };
      files.forEach(f => { this.gitState.index[f] = this.gitState.workingDirectory[f]; });
      this.gitState._fileStaged = true;
      return { message: `Staged ${files.length} file(s)` };
    }
    if (!(file in this.gitState.workingDirectory)) return { error: `fatal: pathspec '${file}' did not match any files` };
    this.gitState.index[file] = this.gitState.workingDirectory[file];
    this.gitState._fileStaged = true;
    return { message: `Staged '${file}'` };
  }

  gitCommit(args) {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    const mIdx = args.indexOf('-m');
    if (mIdx === -1 || !args[mIdx + 1]) return { error: 'Commit message required. Usage: git commit -m "message"' };

    const message = args[mIdx + 1];
    const staged = Object.keys(this.gitState.index);
    if (!staged.length) return { error: 'Nothing to commit. Stage files with git add first.' };

    const hash = Math.random().toString(36).substring(2, 9);
    const branch = this.gitState.currentBranch || 'main';
    this.gitState.commits.unshift({
      hash, message, files: [...staged], timestamp: Date.now(),
      parent: this.gitState.branches[branch]?.commit || null
    });
    this.gitState.branches[branch].commit = hash;
    this.gitState.branches[branch].commits.push(hash);
    this.gitState.index = {};
    this.gitState._committed = true;
    return { message: `[${branch} ${hash}] ${message}\n ${staged.length} file(s) changed` };
  }

  gitBranch(args) {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    if (!args[0]) {
      const lines = Object.keys(this.gitState.branches).map(b =>
        `${b === this.gitState.currentBranch ? '* ' : '  '}${b}`
      );
      return { message: lines.join('\n') };
    }
    const name = args[0];
    if (this.gitState.branches[name]) return { error: `Branch '${name}' already exists.` };
    if (!this.gitState.commits.length) return { error: 'Cannot create branch: no commits yet.' };
    const currentCommit = this.gitState.branches[this.gitState.currentBranch]?.commit;
    this.gitState.branches[name] = { name, commit: currentCommit, commits: currentCommit ? [currentCommit] : [] };
    return { message: `Created branch '${name}'` };
  }

  gitCheckout(args) {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    if (!args[0]) return { error: 'Branch name required.' };
    if (args[0] === '-b') {
      const name = args[1];
      if (!name) return { error: 'Branch name required after -b.' };
      if (!this.gitState.commits.length) return { error: 'Cannot create branch: no commits yet.' };
      const r = this.gitBranch([name]);
      if (r.error) return r;
      this.gitState.HEAD = `refs/heads/${name}`;
      this.gitState.currentBranch = name;
      return { message: `Switched to a new branch '${name}'` };
    }
    if (!this.gitState.branches[args[0]]) return { error: `error: pathspec '${args[0]}' did not match any branch.` };
    this.gitState.HEAD = `refs/heads/${args[0]}`;
    this.gitState.currentBranch = args[0];
    return { message: `Switched to branch '${args[0]}'` };
  }

  gitSwitch(args) {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    if (!args[0]) return { error: 'Branch name required.' };
    if (args[0] === '-c') {
      const name = args[1];
      if (!name) return { error: 'Branch name required after -c.' };
      if (!this.gitState.commits.length) return { error: 'Cannot create branch: no commits yet.' };
      const r = this.gitBranch([name]);
      if (r.error) return r;
      this.gitState.HEAD = `refs/heads/${name}`;
      this.gitState.currentBranch = name;
      return { message: `Switched to a new branch '${name}'` };
    }
    if (!this.gitState.branches[args[0]]) return { error: `error: pathspec '${args[0]}' did not match any branch.` };
    this.gitState.HEAD = `refs/heads/${args[0]}`;
    this.gitState.currentBranch = args[0];
    return { message: `Switched to branch '${args[0]}'` };
  }

  gitMerge(args) {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    const source = args[0];
    if (!source) return { error: 'Branch name required. Usage: git merge <branch>' };
    if (!this.gitState.branches[source]) return { error: `merge: ${source} - not something we can merge.` };
    if (source === this.gitState.currentBranch) return { error: 'Cannot merge a branch into itself.' };
    const hash = Math.random().toString(36).substring(2, 9);
    const branch = this.gitState.currentBranch;
    this.gitState.commits.unshift({
      hash, message: `Merge branch '${source}' into ${branch}`,
      files: [], timestamp: Date.now(),
      parent: this.gitState.branches[branch]?.commit || null
    });
    this.gitState.branches[branch].commit = hash;
    this.gitState.branches[branch].commits.push(hash);
    this.gitState.merged.push(source);
    return { message: `Merge made by the 'ort' strategy.\nMerged '${source}' into '${branch}'.` };
  }

  gitStash(args) {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    const sub = args[0] || 'push';
    if (sub === 'push' || sub === undefined) {
      const files = { ...this.gitState.workingDirectory };
      const staged = { ...this.gitState.index };
      if (!Object.keys(files).length && !Object.keys(staged).length) return { error: 'No local changes to save.' };
      this.gitState.stash.push({ files, staged });
      this.gitState.workingDirectory = {};
      this.gitState.index = {};
      return { message: `Saved working directory and index state WIP on ${this.gitState.currentBranch}` };
    }
    if (sub === 'pop') {
      if (!this.gitState.stash.length) return { error: 'No stash entries found.' };
      const entry = this.gitState.stash.pop();
      Object.assign(this.gitState.workingDirectory, entry.files);
      Object.assign(this.gitState.index, entry.staged);
      return { message: 'Dropped refs/stash@{0}. Applied stashed changes.' };
    }
    if (sub === 'list') {
      if (!this.gitState.stash.length) return { message: 'No stash entries.' };
      return { message: this.gitState.stash.map((_, i) => `stash@{${i}}: WIP`).join('\n') };
    }
    return { error: `Unknown stash command. Use: git stash, git stash pop, git stash list` };
  }

  gitStatus() {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    const staged = Object.keys(this.gitState.index);
    const unstaged = Object.keys(this.gitState.workingDirectory).filter(f => !(f in this.gitState.index));
    let msg = `On branch ${this.gitState.currentBranch}\n`;
    if (staged.length) { msg += '\nChanges to be committed:\n'; staged.forEach(f => { msg += `  new file: ${f}\n`; }); }
    if (unstaged.length) { msg += '\nUntracked files:\n'; unstaged.forEach(f => { msg += `  ${f}\n`; }); }
    if (!staged.length && !unstaged.length) msg += '\nNothing to commit, working tree clean';
    return { message: msg };
  }

  gitLog() {
    if (!this.gitState.initialized) return { error: 'Not a git repository.' };
    if (!this.gitState.commits.length) return { message: 'No commits yet.' };
    return { message: this.gitState.commits.map(c => `commit ${c.hash}\n  ${c.message}`).join('\n\n') };
  }

  handleGitFileCreation(command) {
    const match = command.match(/echo\s+["']?([^"'>]+)["']?\s*>\s*(\S+)/);
    if (match) {
      this.gitState.workingDirectory[match[2]] = match[1].trim();
      this.gitState._fileCreated = true;
      return { message: `Created file '${match[2]}'` };
    }
    return { error: 'Invalid syntax. Use: echo "content" > filename' };
  }

  // ── Level Pass/Fail ─────────────────────────────────────────

  onLevelPassed(level) {
    const id = level.id;

    // Finalize score
    if (!this.score[id]) this.score[id] = 100;
    const pts = this.score[id];

    // Track first-try streak
    if ((this.attempts[id] || 0) === 0 && (this.hintsRevealed[id] || 0) === 0) {
      this.firstTryStreak++;
    } else {
      this.firstTryStreak = 0;
    }

    this.addBlank();
    this.addLine('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557', 'success');
    this.addLine(`\u2551    \u2713  LEVEL COMPLETE!  (${pts} pts)     \u2551`, 'success');
    this.addLine('\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D', 'success');
    this.addBlank();
    if (level.successMessage) this.addLine(level.successMessage, 'success-message');
    this.addLine('Type "explain" for a deeper dive on this concept.', 'dim');
    this.addBlank();

    // Record time
    this.onLevelCompleteTimer(level.id);

    // Mark completed
    this.completedLevels.add(level.id);
    this.saveProgress();

    // Check achievements
    this.checkAchievements();

    // Check category complete
    const allDone = this.levels.every(l => this.completedLevels.has(l.id));
    if (allDone) {
      this.updatePersonalBest();
      this.showCategoryComplete();
      return;
    }

    // Advance
    if (this.currentLevelIndex < this.levels.length - 1) {
      this.currentLevelIndex++;
      this.saveProgress();
      this.addLine('Loading next level...', 'dim');
      this.addBlank();
      setTimeout(() => this.loadLevel(this.currentLevelIndex), 1500);
    }
  }

  onLevelFailed(level, feedback) {
    const id = level.id;
    this.attempts[id] = (this.attempts[id] || 0) + 1;
    this.saveProgress();
    this.addLine(`\u2717 ${feedback}`, 'error');
    const hintsUsed = this.hintsRevealed[id] || 0;
    if (hintsUsed < 3) this.addLine(`Type 'hint' for help (${hintsUsed}/3 hints revealed).`, 'dim');
  }

  // ── Timer System ───────────────────────────────────────────

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.sessionStartTime = Date.now();
    this.levelStartTime = Date.now();
    this.timerRunning = true;
    this.timerInterval = setInterval(() => this.updateTimerDisplay(), 50);
  }

  setupTimerDisplay() {
    if (this.timerClock) this.timerClock.textContent = '0:00.00';
    if (this.segmentTime) this.segmentTime.textContent = '0:00.00';
  }

  updateTimerDisplay() {
    if (!this.sessionStartTime || !this.timerRunning) return;
    const now = Date.now();
    if (this.timerClock) this.timerClock.textContent = this.formatTime(now - this.sessionStartTime);
    if (this.levelStartTime && this.segmentTime) this.segmentTime.textContent = this.formatTime(now - this.levelStartTime);
  }

  formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const cs = Math.floor((ms % 1000) / 10);
    if (m >= 60) {
      return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    return `${m}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  onLevelCompleteTimer(levelId) {
    if (!this.levelStartTime) return;
    this.levelTimes[levelId] = Date.now() - this.levelStartTime;
    this.levelStartTime = Date.now();
    this.renderSplits();
    this.saveProgress();
  }

  renderSplits() {
    if (!this.splitsList) return;
    const frag = document.createDocumentFragment();

    this.levels.forEach((level, i) => {
      const done = this.completedLevels.has(level.id);
      const active = i === this.currentLevelIndex;

      const row = document.createElement('div');
      row.className = `split-row${done ? ' completed' : active ? ' active' : ' pending'}`;

      const icon = document.createElement('span');
      icon.className = `split-icon${done ? ' completed' : active ? ' active' : ' pending'}`;
      icon.textContent = done ? '\u2713' : active ? '\u25B6' : '\u25CB';

      const name = document.createElement('span');
      name.className = 'split-name';
      name.textContent = level.title;
      name.title = `Level ${i + 1}: ${level.title}`;

      const diff = document.createElement('span');
      diff.className = 'split-difficulty';
      const stars = this.getDifficulty(i, this.levels.length);
      diff.textContent = '\u2605'.repeat(stars);
      diff.title = ['Easy','Medium','Hard'][stars - 1];

      const time = document.createElement('span');
      time.className = `split-time${done ? ' completed' : active ? ' active' : ' pending'}`;
      time.textContent = done && this.levelTimes[level.id]
        ? this.formatTime(this.levelTimes[level.id])
        : active ? '--:--.--' : '';

      row.append(icon, name, diff, time);
      frag.appendChild(row);
    });

    this.splitsList.innerHTML = '';
    this.splitsList.appendChild(frag);

    const activeRow = this.splitsList.querySelector('.split-row.active');
    if (activeRow) activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ── Difficulty ─────────────────────────────────────────────

  getDifficulty(levelIndex, totalLevels) {
    const third = totalLevels / 3;
    if (levelIndex < third) return 1;
    if (levelIndex < third * 2) return 2;
    return 3;
  }

  // ── Score Display ─────────────────────────────────────────

  updateScoreDisplay(levelId) {
    if (this.scoreDisplay) {
      const pts = this.score[levelId] ?? 100;
      this.scoreDisplay.textContent = `${pts}pts`;
    }
  }

  showScore() {
    this.addBlank();
    this.addLine('Score Summary:', 'system');
    let total = 0, count = 0;
    for (const l of this.levels) {
      if (this.completedLevels.has(l.id)) {
        const pts = this.score[l.id] ?? 100;
        total += pts;
        count++;
      }
    }
    this.addLine(`  Levels completed: ${count}/${this.levels.length}`, 'system');
    this.addLine(`  Total score: ${total} pts`, 'system');
    if (count > 0) this.addLine(`  Average: ${Math.round(total / count)} pts/level`, 'system');
    const pb = this.personalBests[this.currentCategory];
    if (pb) this.addLine(`  Personal best: ${this.formatTime(pb)}`, 'system');
    this.addBlank();
  }

  // ── Explain Command ───────────────────────────────────────

  showExplain() {
    // Show explanation for the most recently completed level or current level
    const idx = this.currentLevelIndex;
    // Check previous level (just completed) first
    const prevLevel = idx > 0 ? this.levels[idx - 1] : null;
    const level = (prevLevel && this.completedLevels.has(prevLevel.id)) ? prevLevel : this.levels[idx];
    if (!level) return;

    this.addBlank();
    this.addLine(`\u2550\u2550 ${level.title} \u2550\u2550`, 'system');
    this.addBlank();
    if (level.successMessage) {
      this.addLine(level.successMessage, 'success-message');
    } else {
      this.addLine('No additional explanation available for this level.', 'dim');
    }
    this.addBlank();
  }

  // ── Tab Completion ────────────────────────────────────────

  handleTabComplete() {
    const val = this.input.value.trim().toLowerCase();
    if (!val) return;
    const matches = this.tabCommands.filter(c => c.startsWith(val));
    if (matches.length === 1) {
      this.input.value = matches[0];
    } else if (matches.length > 1) {
      this.addLine(`$ ${val}`, 'command');
      this.addLine(matches.join('  '), 'dim');
    }
  }

  // ── Timer Sidebar Visibility ─────────────────────────────

  showTimerSidebar(visible) {
    if (this.timerSidebar) this.timerSidebar.style.display = visible ? '' : 'none';
  }

  // ── Keyboard Overlay ──────────────────────────────────────

  toggleKbOverlay() {
    if (this.kbOverlay) {
      this.kbOverlay.hidden = !this.kbOverlay.hidden;
    }
  }

  // ── Mobile Drawer ─────────────────────────────────────────

  toggleMobileDrawer() {
    if (!this.mobileDrawer) return;
    const open = this.mobileDrawer.classList.contains('open');
    if (open) this.closeMobileDrawer();
    else this.openMobileDrawer();
  }

  openMobileDrawer() {
    if (this.mobileDrawer) {
      this.mobileDrawer.hidden = false;
      if (this.mobileOverlay) this.mobileOverlay.hidden = false;
      requestAnimationFrame(() => this.mobileDrawer.classList.add('open'));
    }
  }

  closeMobileDrawer() {
    if (this.mobileDrawer) {
      this.mobileDrawer.classList.remove('open');
      setTimeout(() => {
        this.mobileDrawer.hidden = true;
        if (this.mobileOverlay) this.mobileOverlay.hidden = true;
      }, 250);
    }
  }

  // ── Export/Import Progress ────────────────────────────────

  exportProgress() {
    try {
      const raw = localStorage.getItem('sudoquest_progress');
      if (!raw) { this.addLine('No progress to export.', 'dim'); return; }
      const encoded = btoa(raw);
      navigator.clipboard.writeText(encoded).then(() => {
        this.addLine('Progress copied to clipboard!', 'success');
        this.addLine('Use "load <data>" to import on another device.', 'dim');
      }).catch(() => {
        this.addLine('Progress string (copy manually):', 'system');
        this.addLine(encoded, 'output');
      });
    } catch (_) {
      this.addLine('Failed to export progress.', 'error');
    }
  }

  importProgress(data) {
    try {
      const raw = atob(data);
      const parsed = JSON.parse(raw);
      if (!parsed.completedLevels) throw new Error('Invalid data');
      localStorage.setItem('sudoquest_progress', raw);
      this.loadProgress();
      if (this.currentCategory) {
        this.levels = getLevelsForCategory(this.currentCategory);
        this.renderSplits();
      }
      this.addLine('Progress imported successfully! Reload to apply fully.', 'success');
    } catch (_) {
      this.addLine('Invalid progress data. Make sure you pasted the full string.', 'error');
    }
  }

  // ── Personal Best ─────────────────────────────────────────

  updatePersonalBest() {
    if (!this.currentCategory || !this.sessionStartTime) return;
    const totalTime = Date.now() - this.sessionStartTime;
    const prev = this.personalBests[this.currentCategory];
    if (!prev || totalTime < prev) {
      this.personalBests[this.currentCategory] = totalTime;
      this.saveProgress();
      if (prev) {
        this.addLine(`NEW PERSONAL BEST! ${this.formatTime(totalTime)} (was ${this.formatTime(prev)})`, 'success');
      }
    }
  }

  // ── Achievement System ────────────────────────────────────

  checkAchievements() {
    const defs = [
      { key: 'js_master', title: 'JS Master', desc: 'Complete all JavaScript levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('js') },
      { key: 'git_master', title: 'Git Guru', desc: 'Complete all Git levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('git') },
      { key: 'cmd_master', title: 'Terminal Pro', desc: 'Complete all Terminal levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('cmd') },
      { key: 'html_master', title: 'HTML Hero', desc: 'Complete all HTML levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('html') },
      { key: 'css_master', title: 'CSS Wizard', desc: 'Complete all CSS levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('css') },
      { key: 'csharp_master', title: 'C# Champion', desc: 'Complete all C# levels', icon: '\uD83C\uDFC6',
        check: () => this.isCategoryDone('csharp') },
      { key: 'speed_demon', title: 'Speed Demon', desc: 'Complete a category under 10 min', icon: '\u26A1',
        check: () => Object.values(this.personalBests).some(t => t < 600000) },
      { key: 'no_hints', title: 'Solo Solver', desc: 'Complete a category without hints', icon: '\uD83E\uDDE0',
        check: () => this.levels.every(l => this.completedLevels.has(l.id)) && this.levels.every(l => !(this.hintsRevealed[l.id])) },
      { key: 'streak_5', title: 'On Fire!', desc: '5 levels in a row on first try', icon: '\uD83D\uDD25',
        check: () => this.firstTryStreak >= 5 },
      { key: 'perfectionist', title: 'Perfectionist', desc: 'Score 100 on 10 levels', icon: '\uD83D\uDCAF',
        check: () => Object.values(this.score).filter(s => s === 100).length >= 10 },
      { key: 'completionist', title: 'Completionist', desc: 'Complete all 210 levels', icon: '\uD83C\uDF1F',
        check: () => this.completedLevels.size >= 210 },
    ];

    for (const def of defs) {
      if (this.achievements.has(def.key)) continue;
      if (def.check()) {
        this.achievements.add(def.key);
        this.saveProgress();
        this.showAchievementToast(def);
      }
    }
  }

  isCategoryDone(key) {
    const cat = getCategoryByKey(key);
    return cat && cat.levels.every(l => this.completedLevels.has(l.id));
  }

  showAchievementToast(def) {
    if (!this.achievementToast) return;
    const el = document.createElement('div');
    el.className = 'achievement-badge';
    el.innerHTML = `<span class="badge-icon">${def.icon}</span><div class="badge-text"><span class="badge-title">${def.title}</span><span class="badge-desc">${def.desc}</span></div>`;
    this.achievementToast.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  showAchievements() {
    this.addBlank();
    this.addLine('\u2550\u2550 Achievements \u2550\u2550', 'system');
    this.addBlank();
    const allDefs = [
      { key: 'js_master', title: 'JS Master', desc: 'Complete all JavaScript levels', icon: '\uD83C\uDFC6' },
      { key: 'git_master', title: 'Git Guru', desc: 'Complete all Git levels', icon: '\uD83C\uDFC6' },
      { key: 'cmd_master', title: 'Terminal Pro', desc: 'Complete all Terminal levels', icon: '\uD83C\uDFC6' },
      { key: 'html_master', title: 'HTML Hero', desc: 'Complete all HTML levels', icon: '\uD83C\uDFC6' },
      { key: 'css_master', title: 'CSS Wizard', desc: 'Complete all CSS levels', icon: '\uD83C\uDFC6' },
      { key: 'csharp_master', title: 'C# Champion', desc: 'Complete all C# levels', icon: '\uD83C\uDFC6' },
      { key: 'speed_demon', title: 'Speed Demon', desc: 'Complete a category under 10 min', icon: '\u26A1' },
      { key: 'no_hints', title: 'Solo Solver', desc: 'Complete a category without hints', icon: '\uD83E\uDDE0' },
      { key: 'streak_5', title: 'On Fire!', desc: '5 levels in a row on first try', icon: '\uD83D\uDD25' },
      { key: 'perfectionist', title: 'Perfectionist', desc: 'Score 100 on 10 levels', icon: '\uD83D\uDCAF' },
      { key: 'completionist', title: 'Completionist', desc: 'Complete all 210 levels', icon: '\uD83C\uDF1F' },
    ];
    for (const d of allDefs) {
      const earned = this.achievements.has(d.key);
      const mark = earned ? '\u2713' : '\u25CB';
      const type = earned ? 'success' : 'dim';
      this.addLine(`  ${mark} ${d.icon} ${d.title} \u2014 ${d.desc}`, type);
    }
    this.addBlank();
    this.addLine(`  ${this.achievements.size}/${allDefs.length} unlocked`, 'system');
    this.addBlank();
  }

  // ── Category Complete ──────────────────────────────────────

  showCategoryComplete() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerRunning = false;

    const totalTime = this.sessionStartTime ? Date.now() - this.sessionStartTime : 0;
    let totalScore = 0;
    for (const l of this.levels) totalScore += (this.score[l.id] ?? 100);
    const pb = this.personalBests[this.currentCategory];
    const pbLine = pb ? `     Personal best: ${this.formatTime(pb).padEnd(28)}\u2551` : `${''.padEnd(51)}\u2551`;

    this.addBlank();
    const art = `
  \u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
  \u2551                                                   \u2551
  \u2551     CATEGORY COMPLETE!                            \u2551
  \u2551     Total time: ${this.formatTime(totalTime).padEnd(33)}\u2551
  \u2551     Score: ${String(totalScore).padEnd(38)}\u2551
  \u2551${pbLine}
  \u2551                                                   \u2551
  \u2551     Type "categories" to try another track.       \u2551
  \u2551     Type "restart" to reset everything.           \u2551
  \u2551                                                   \u2551
  \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D`;
    this.addHTML(`<pre class="completion-art">${art}</pre>`, 'success');
    this.addBlank();
  }
}

// ── Bootstrap ─────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SudoQuest());
} else {
  new SudoQuest();
}
