import { LevelManager } from '/src/core/LevelManager.js';
import { getAllLevelIds, getCategories } from '/src/config/levelConfigs.js';

class SudoSolveApp {
  constructor() {
    this.levelManager = new LevelManager();
    this.currentLevel = 1;
    this.isExecuting = false;
    this.commandHistory = [];
    this.historyIndex = -1;

    this.terminalInput = document.getElementById('terminal-input');
    this.terminalOutput = document.getElementById('terminal-output');
    this.executeBtn = document.getElementById('execute-btn');
    this.feedbackArea = document.getElementById('feedback-area');
    this.consoleOutput = document.getElementById('console-output');
    this.levelTitle = document.getElementById('level-title');
    this.levelDescription = document.getElementById('level-description');
    this.levelObjective = document.getElementById('level-objective');
    this.levelHints = document.getElementById('level-hints');
    this.currentLevelDisplay = document.getElementById('current-level');
    this.completedCount = document.getElementById('completed-count');
    this.progressBar = document.getElementById('progress-bar');
    this.levelSelector = document.getElementById('level-selector');

    if (!this.terminalInput) {
      console.error('Terminal input not found!');
      return;
    }
    
    this.init();
  }

  async init() {
    try {

      await this.levelManager.initialize();

      const progress = await this.levelManager.storage.getUserProgress();
      this.currentLevel = progress.currentLevel || 1;

      this.populateLevelSelector();

      this.setupEventListeners();

      await this.loadLevelInfo(this.currentLevel);

      this.updateProgressDisplay(progress);

      this.addOutput('System initialized. Ready to code.', 'system');

      setTimeout(() => {
        this.terminalInput?.focus();
      }, 100);
      
    } catch (error) {
      console.error('Initialization error:', error);
      this.addOutput(`Error: ${error.message}`, 'error');
      this.displayFeedback({
        passed: false,
        feedback: `Initialization failed: ${error.message}`,
        errors: [error.message],
        hints: ['Check browser console for details']
      });
    }
  }

  populateLevelSelector() {
    if (!this.levelSelector) return;
    
    const levelIds = getAllLevelIds();
    const progress = this.levelManager.storage.getUserProgress?.() || { completedLevels: [] };
    const completedLevels = progress.completedLevels || [];

    this.levelSelector.innerHTML = '';
    
    levelIds.forEach(levelId => {
      const config = this.levelManager.getLevelConfig(levelId);
      if (!config) return;
      
      const option = document.createElement('option');
      option.value = levelId;
      option.textContent = `Level ${levelId}: ${config.title}`;

      if (completedLevels.includes(levelId)) {
        option.textContent += ' ✓';
      }




      
      this.levelSelector.appendChild(option);
    });

    this.levelSelector.value = this.currentLevel;
  }

  setupEventListeners() {
    if (!this.terminalInput) return;

    this.terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !this.isExecuting) {
        e.preventDefault();
        this.executeCode();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateHistory(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateHistory(1);
      }
    });

    this.executeBtn?.addEventListener('click', () => {
      if (!this.isExecuting) {
        this.executeCode();
      }
    });

    this.levelSelector?.addEventListener('change', async (e) => {
      const newLevel = parseInt(e.target.value);
      if (newLevel !== this.currentLevel) {
        await this.switchLevel(newLevel);
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target !== this.terminalInput && !e.target.closest('#terminal-input')) {

        if (!e.target.closest('button') && !e.target.closest('select')) {
          setTimeout(() => this.terminalInput?.focus(), 100);
        }
      }
    });

    const toggleFeedbackBtn = document.getElementById('toggle-feedback');
    const showFeedbackBtn = document.getElementById('show-feedback-mobile');
    const feedbackPanel = document.getElementById('feedback-panel');
    
    if (showFeedbackBtn && feedbackPanel) {
      showFeedbackBtn.addEventListener('click', () => {
        feedbackPanel.classList.remove('hidden');
        feedbackPanel.classList.add('fixed', 'inset-0', 'z-40');
        showFeedbackBtn.classList.add('hidden');
      });
    }
    
    if (toggleFeedbackBtn && feedbackPanel) {
      toggleFeedbackBtn.addEventListener('click', () => {
        feedbackPanel.classList.add('hidden');
        feedbackPanel.classList.remove('fixed', 'inset-0', 'z-40');
        if (showFeedbackBtn) showFeedbackBtn.classList.remove('hidden');
      });
    }

    window.addEventListener('levelCompleted', (e) => {
      this.handleLevelCompleted(e.detail);
    });
  }

  navigateHistory(direction) {
    if (this.commandHistory.length === 0) return;
    
    this.historyIndex += direction;
    
    if (this.historyIndex < 0) {
      this.historyIndex = -1;
      this.terminalInput.value = '';
      return;
    }
    
    if (this.historyIndex >= this.commandHistory.length) {
      this.historyIndex = this.commandHistory.length - 1;
    }
    
    this.terminalInput.value = this.commandHistory[this.historyIndex] || '';
  }

  async switchLevel(levelId) {
    try {
      this.currentLevel = levelId;
      await this.loadLevelInfo(levelId);
      this.addOutput(`Switched to Level ${levelId}`, 'system');
      this.terminalInput?.focus();
    } catch (error) {
      console.error('Error switching level:', error);
      this.addOutput(`Error switching level: ${error.message}`, 'error');
    }
  }

  async executeCode() {
    const userInput = this.terminalInput?.value.trim();
    
    if (!userInput) {
      return;
    }

    if (this.isExecuting) {
      return;
    }

    if (userInput && this.commandHistory[this.commandHistory.length - 1] !== userInput) {
      this.commandHistory.push(userInput);
      if (this.commandHistory.length > 50) {
        this.commandHistory.shift();
      }
    }
    this.historyIndex = -1;

    this.isExecuting = true;
    this.executeBtn.disabled = true;
    this.executeBtn.textContent = 'EXECUTING...';
    this.executeBtn.classList.add('loading');

    this.addOutput(`$ ${userInput}`, 'command');

    this.terminalInput.value = '';

    try {

      const result = await this.levelManager.validateLevel(this.currentLevel, userInput);

      if (result.worldState && result.worldState.consoleLogs) {
        this.displayConsoleOutput(result.worldState.consoleLogs);
      }

      this.displayFeedback(result);

      if (result.passed) {
        await this.handleLevelPassed();
      } else {
        this.addOutput(result.feedback, 'error');
        if (result.hints && result.hints.length > 0) {
          this.addOutput(`Hints: ${result.hints.join(', ')}`, 'hint');
        }
      }

    } catch (error) {
      console.error('Execution error:', error);
      this.addOutput(`Error: ${error.message}`, 'error');
      this.displayFeedback({
        passed: false,
        feedback: `Execution failed: ${error.message}`,
        errors: [error.message],
        hints: ['Check your code syntax', 'Make sure you\'re using valid JavaScript']
      });
    } finally {
      this.isExecuting = false;
      this.executeBtn.disabled = false;
      this.executeBtn.textContent = 'EXECUTE';
      this.executeBtn.classList.remove('loading');

      setTimeout(() => {
        this.terminalInput?.focus();
      }, 50);
    }
  }

  displayFeedback(result) {
    if (!this.feedbackArea) return;
    
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = `p-4 border rounded ${
      result.passed 
        ? 'bg-terminal-green/10 border-terminal-green/50' 
        : 'bg-red-500/10 border-red-500/50'
    }`;

    const statusIcon = result.passed ? '✓' : '✗';
    const statusColor = result.passed ? 'text-terminal-green' : 'text-red-400';

    feedbackDiv.innerHTML = `
      <div class="flex items-start space-x-3">
        <span class="text-2xl ${statusColor}">${statusIcon}</span>
        <div class="flex-1">
          <p class="text-sm ${result.passed ? 'text-terminal-green' : 'text-red-400'} font-semibold mb-1">
            ${result.passed ? 'Success!' : 'Failed'}
          </p>
          <p class="text-sm text-terminal-green/80 mb-2">${this.escapeHtml(result.feedback || 'No feedback')}</p>
          ${result.errors && result.errors.length > 0 ? `
            <div class="mt-2 space-y-1">
              ${result.errors.map(err => `<p class="text-xs text-red-400">• ${this.escapeHtml(err)}</p>`).join('')}
            </div>
          ` : ''}
          ${result.hints && result.hints.length > 0 ? `
            <div class="mt-2 pt-2 border-t border-terminal-border">
              <p class="text-xs text-terminal-green/60 mb-1">Hints:</p>
              ${result.hints.map(hint => `<p class="text-xs text-terminal-green/70">• ${this.escapeHtml(hint)}</p>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    this.feedbackArea.innerHTML = '';
    this.feedbackArea.appendChild(feedbackDiv);

    this.feedbackArea.scrollTop = 0;
  }

  displayConsoleOutput(logs) {
    if (!this.consoleOutput) return;
    
    if (!logs || logs.length === 0) {
      this.consoleOutput.innerHTML = '<div class="text-terminal-green/50">No output</div>';
      return;
    }

    this.consoleOutput.innerHTML = logs
      .map(log => `<div class="text-terminal-green/90">${this.escapeHtml(String(log))}</div>`)
      .join('');

    this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
  }

  async handleLevelPassed() {
    this.addOutput('✓ Level completed!', 'success');
    
    try {

      const completionData = await this.levelManager.completeLevel(this.currentLevel);

      const progress = await this.levelManager.storage.getUserProgress();
      this.updateProgressDisplay(progress);

      this.populateLevelSelector();

      const config = this.levelManager.getLevelConfig(this.currentLevel);
      if (config && config.unlocks && config.unlocks.length > 0) {
        const nextLevel = config.unlocks[0];
        if (nextLevel > this.currentLevel) {
          this.currentLevel = nextLevel;
          await this.loadLevelInfo(this.currentLevel);
          this.levelSelector.value = this.currentLevel;
          this.addOutput(`Level ${nextLevel} unlocked!`, 'system');
        }
      }
    } catch (error) {
      console.error('Error completing level:', error);
      this.addOutput(`Error: ${error.message}`, 'error');
    }
  }

  handleLevelCompleted(eventData) {

    this.addOutput(`Level ${eventData.levelId} completed!`, 'success');
  }

  async loadLevelInfo(levelId) {
    const config = this.levelManager.getLevelConfig(levelId);
    
    if (!config) {
      if (this.levelTitle) this.levelTitle.textContent = `Level ${levelId}`;
      if (this.levelDescription) this.levelDescription.textContent = 'Level configuration not found.';
      if (this.levelObjective) this.levelObjective.textContent = 'N/A';
      if (this.levelHints) this.levelHints.innerHTML = '<li>No hints available</li>';
      return;
    }

    if (this.levelTitle) {
      this.levelTitle.textContent = config.title || `Level ${levelId}`;
      if (config.category) {
        this.levelTitle.textContent += ` (${config.category})`;
      }
    }
    if (this.levelDescription) {
      this.levelDescription.textContent = config.description || 'Complete the challenge.';
    }
    if (this.levelObjective) {
      this.levelObjective.textContent = config.description || 'Complete the challenge.';
    }
    if (this.currentLevelDisplay) {
      this.currentLevelDisplay.textContent = levelId;
    }

    if (this.levelHints) {
      if (config.hints && config.hints.length > 0) {
        this.levelHints.innerHTML = config.hints
          .map(hint => `<li class="text-terminal-green/70">${this.escapeHtml(hint)}</li>`)
          .join('');
      } else {
        this.levelHints.innerHTML = '<li class="text-terminal-green/50">No hints available</li>';
      }
    }

    this.levelManager.resetWorldState(levelId);

    if (this.consoleOutput) {
      this.consoleOutput.innerHTML = '<div class="text-terminal-green/50">No output yet...</div>';
    }
  }

  updateProgressDisplay(progress) {
    if (!progress) return;
    
    if (this.completedCount) {
      this.completedCount.textContent = progress.completedLevels?.length || 0;
    }

    const totalLevels = 10; // Update this as you add more levels
    const completed = progress.completedLevels?.length || 0;
    const percentage = Math.min((completed / totalLevels) * 100, 100);
    
    if (this.progressBar) {
      this.progressBar.style.width = `${percentage}%`;
    }
  }

  addOutput(message, type = 'info') {
    if (!this.terminalOutput) return;
    
    const outputDiv = document.createElement('div');
    outputDiv.className = 'font-mono text-sm';
    
    let colorClass = 'text-terminal-green/80';
    let prefix = '';
    
    switch (type) {
      case 'command':
        colorClass = 'text-terminal-green';
        prefix = '';
        break;
      case 'success':
        colorClass = 'text-terminal-green';
        prefix = '✓ ';
        break;
      case 'error':
        colorClass = 'text-red-400';
        prefix = '✗ ';
        break;
      case 'hint':
        colorClass = 'text-yellow-400';
        prefix = '💡 ';
        break;
      case 'system':
        colorClass = 'text-terminal-green/60';
        prefix = '[SYSTEM] ';
        break;
    }
    
    outputDiv.className = `font-mono text-sm ${colorClass}`;
    outputDiv.textContent = `${prefix}${message}`;
    
    this.terminalOutput.appendChild(outputDiv);

    this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SudoSolveApp();
  });
} else {
  new SudoSolveApp();
}