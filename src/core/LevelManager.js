import { IndexedDBManager } from '../storage/IndexedDBManager.js';
import { GitValidator } from '../validators/GitValidator.js';
import { LogicValidator } from '../validators/LogicValidator.js';
import { LoopValidator } from '../validators/LoopValidator.js';
import { levelConfigs } from '../config/levelConfigs.js';

export class LevelManager {
  constructor() {
    this.storage = new IndexedDBManager();
    this.currentLevel = 1;
    this.worldState = new Map();
    this.validationModules = {
      git: new GitValidator(),
      logic: new LogicValidator(),
      loop: new LoopValidator()
    };
    this.levelConfigs = levelConfigs;
    this.executionTimeout = 2000;
    this.initialized = false;
  }

  
  async initialize() {
    if (this.initialized) return;

    const progress = await this.storage.getUserProgress();
    this.currentLevel = progress.currentLevel || 1;

    await Promise.all([
      this.validationModules.git.initialize(),
      this.validationModules.logic.initialize(),
      this.validationModules.loop.initialize()
    ]);

    this.resetWorldState(this.currentLevel);

    this.initialized = true;
  }

  
  async validateLevel(levelId, userInput) {
    const config = this.getLevelConfig(levelId);
    if (!config) {
      return {
        passed: false,
        feedback: 'Invalid level ID',
        worldState: this.getWorldState(),
        errors: ['Level configuration not found'],
        hints: []
      };
    }

    const startTime = performance.now();
    let validationResult;

    try {

      switch (config.type) {
        case 'git':
          validationResult = await this.validationModules.git.validate(
            userInput,
            config.rubric,
            this.worldState
          );
          break;
        case 'logic':
          validationResult = await this.validationModules.logic.validate(
            userInput,
            config.rubric,
            this.worldState,
            this.executionTimeout
          );
          break;
        case 'loop':
          validationResult = await this.validationModules.loop.validate(
            userInput,
            config.rubric,
            this.worldState,
            this.executionTimeout
          );
          break;
        default:
          validationResult = {
            passed: false,
            feedback: 'Unknown level type',
            worldState: this.getWorldState(),
            errors: ['Unsupported level type'],
            hints: []
          };
      }

      if (validationResult.worldState) {
        this.mergeWorldState(validationResult.worldState);
      }

      validationResult.executionTime = performance.now() - startTime;
      return validationResult;
    } catch (error) {
      return {
        passed: false,
        feedback: `Validation error: ${error.message}`,
        worldState: this.getWorldState(),
        errors: [error.message],
        hints: config.hints || [],
        executionTime: performance.now() - startTime,
        timeout: false
      };
    }
  }

  
  async completeLevel(levelId) {
    const progress = await this.storage.getUserProgress();
    
    if (!progress.completedLevels.includes(levelId)) {
      progress.completedLevels.push(levelId);
    }

    const config = this.getLevelConfig(levelId);
    if (config.unlocks && config.unlocks.length > 0) {

      this.currentLevel = Math.max(this.currentLevel, levelId + 1);
    } else {
      this.currentLevel = Math.max(this.currentLevel, levelId + 1);
    }

    progress.currentLevel = this.currentLevel;

    await this.storage.saveUserProgress(progress);

    await this.storage.saveWorldStateSnapshot(levelId, this.getWorldState());

    this.updateSessionCookie();

    window.dispatchEvent(new CustomEvent('levelCompleted', {
      detail: { levelId, nextLevel: this.currentLevel }
    }));

    return {
      levelId,
      nextLevel: this.currentLevel,
      completedLevels: progress.completedLevels.length,
      timestamp: Date.now()
    };
  }

  
  getLevelConfig(levelId) {
    return this.levelConfigs.get(levelId) || null;
  }

  
  getWorldState() {
    return {
      variables: Object.fromEntries(
        Array.from(this.worldState.entries())
          .filter(([key]) => key.startsWith('var:'))
          .map(([key, value]) => [key.substring(4), value])
      ),
      functions: Object.fromEntries(
        Array.from(this.worldState.entries())
          .filter(([key]) => key.startsWith('func:'))
          .map(([key, value]) => [key.substring(5), value])
      ),
      consoleLogs: this.worldState.get('consoleLogs') || [],
      gitState: this.worldState.get('gitState') || {},
      fileSystem: Object.fromEntries(
        Array.from(this.worldState.entries())
          .filter(([key]) => key.startsWith('file:'))
          .map(([key, value]) => [key.substring(5), value])
      )
    };
  }

  
  resetWorldState(levelId) {
    const config = this.getLevelConfig(levelId);
    this.worldState.clear();

    if (config.initialState) {
      Object.entries(config.initialState.variables || {}).forEach(([key, value]) => {
        this.worldState.set(`var:${key}`, value);
      });

      if (config.initialState.gitState) {
        this.worldState.set('gitState', JSON.parse(JSON.stringify(config.initialState.gitState)));
      }
    }

    this.worldState.set('consoleLogs', []);
    this.worldState.set('fileSystem', new Map());
  }

  
  mergeWorldState(newState) {
    if (newState.variables) {
      Object.entries(newState.variables).forEach(([key, value]) => {
        this.worldState.set(`var:${key}`, value);
      });
    }

    if (newState.functions) {
      Object.entries(newState.functions).forEach(([key, value]) => {
        this.worldState.set(`func:${key}`, value);
      });
    }

    if (newState.consoleLogs) {
      const existingLogs = this.worldState.get('consoleLogs') || [];
      this.worldState.set('consoleLogs', [...existingLogs, ...newState.consoleLogs]);
    }

    if (newState.gitState) {
      this.worldState.set('gitState', newState.gitState);
    }
  }

  
  updateSessionCookie() {
    const cookieData = {
      currentLevel: this.currentLevel,
      sessionStart: Date.now()
    };
    document.cookie = `sudosolve_session=${JSON.stringify(cookieData)}; path=/; max-age=86400`;
  }
}