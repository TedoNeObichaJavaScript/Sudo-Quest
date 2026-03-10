export class GitValidator {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
  }

  
  async validate(userInput, rubric, worldState) {

    let gitState = worldState.get('gitState');
    if (!gitState) {
      gitState = this.createInitialGitState();
      worldState.set('gitState', gitState);
    }

    let commands = [];
    if (Array.isArray(userInput)) {
      commands = userInput;
    } else if (typeof userInput === 'string') {

      commands = userInput.split('\n')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0);
    }

    const errors = [];
    for (const command of commands) {
      try {
        const result = this.executeCommand(command, gitState, worldState);
        if (result.error) {
          errors.push(result.error);
        }
      } catch (error) {
        errors.push(`Command failed: ${error.message}`);
      }
    }

    worldState.set('gitState', gitState);

    const validationResult = this.checkRubric(gitState, worldState, rubric, errors);

    return {
      passed: validationResult.passed,
      feedback: validationResult.feedback,
      worldState: {
        gitState: gitState,
        fileSystem: this.extractFileSystem(worldState)
      },
      errors: errors,
      hints: validationResult.hints || []
    };
  }

  
  executeCommand(command, gitState, worldState) {
    const trimmed = command.trim();

    if (trimmed.startsWith('git ')) {
      const parts = trimmed.substring(4).split(/\s+/);
      const gitCommand = parts[0];
      const args = parts.slice(1);

      switch (gitCommand) {
        case 'init':
          return this.gitInit(gitState);
        case 'add':
          return this.gitAdd(args, gitState, worldState);
        case 'commit':
          return this.gitCommit(args, gitState, worldState);
        case 'branch':
          return this.gitBranch(args, gitState);
        case 'checkout':
          return this.gitCheckout(args, gitState);
        default:
          return { error: `Unknown git command: ${gitCommand}` };
      }
    }

    if (trimmed.includes('>') || trimmed.startsWith('echo ')) {
      return this.handleFileCreation(trimmed, worldState);
    }

    return { error: 'Not a recognized command' };
  }

  
  gitInit(gitState) {
    if (gitState.initialized) {
      return { message: 'Repository already initialized' };
    }

    gitState.initialized = true;
    gitState.HEAD = 'refs/heads/main';
    gitState.currentBranch = 'main';
    gitState.branches = {
      main: {
        name: 'main',
        commit: null,
        commits: []
      }
    };
    gitState.commits = [];
    gitState.index = {};
    gitState.workingDirectory = {};

    return { message: 'Initialized empty Git repository' };
  }

  
  gitAdd(args, gitState, worldState) {
    if (!gitState.initialized) {
      return { error: 'Not a git repository. Run git init first.' };
    }

    const file = args[0];
    if (!file) {
      return { error: 'No file specified' };
    }

    const fileContent = worldState.get(`file:${file}`);
    if (!fileContent) {
      return { error: `File '${file}' not found` };
    }

    gitState.index[file] = {
      path: file,
      staged: true,
      content: fileContent
    };

    return { message: `Staged '${file}'` };
  }

  
  gitCommit(args, gitState, worldState) {
    if (!gitState.initialized) {
      return { error: 'Not a git repository' };
    }

    let message = '';
    if (args[0] === '-m' && args[1]) {
      message = args[1].replace(/^["']|["']$/g, ''); // Remove quotes
    } else {
      return { error: 'Commit message required. Use: git commit -m "message"' };
    }

    const stagedFiles = Object.keys(gitState.index);
    if (stagedFiles.length === 0) {
      return { error: 'Nothing to commit. Stage files first with git add.' };
    }

    const commitHash = this.generateCommitHash();
    const currentBranch = gitState.currentBranch || 'main';
    
    const commit = {
      hash: commitHash,
      message: message,
      author: 'user',
      timestamp: Date.now(),
      files: [...stagedFiles],
      parent: gitState.branches[currentBranch]?.commit || null
    };

    gitState.commits.unshift(commit); // Add to front
    gitState.branches[currentBranch].commit = commitHash;
    gitState.branches[currentBranch].commits.push(commitHash);

    gitState.index = {};

    return { message: `[${currentBranch} ${commitHash.substring(0, 7)}] ${message}` };
  }

  
  gitBranch(args, gitState) {
    if (!gitState.initialized) {
      return { error: 'Not a git repository' };
    }

    const branchName = args[0];
    if (!branchName) {
      return { error: 'Branch name required' };
    }

    if (gitState.branches[branchName]) {
      return { error: `Branch '${branchName}' already exists` };
    }

    const currentBranch = gitState.currentBranch || 'main';
    const currentCommit = gitState.branches[currentBranch]?.commit;

    gitState.branches[branchName] = {
      name: branchName,
      commit: currentCommit,
      commits: currentCommit ? [currentCommit] : []
    };

    return { message: `Created branch '${branchName}'` };
  }

  
  gitCheckout(args, gitState) {
    if (!gitState.initialized) {
      return { error: 'Not a git repository' };
    }

    const target = args[0];
    if (!target) {
      return { error: 'Branch name required' };
    }

    if (target === '-b') {
      const branchName = args[1];
      if (!branchName) {
        return { error: 'Branch name required after -b' };
      }
      const branchResult = this.gitBranch([branchName], gitState);
      if (branchResult.error) {
        return branchResult;
      }
      gitState.HEAD = `refs/heads/${branchName}`;
      gitState.currentBranch = branchName;
      return { message: `Switched to new branch '${branchName}'` };
    }

    if (!gitState.branches[target]) {
      return { error: `Branch '${target}' does not exist` };
    }

    gitState.HEAD = `refs/heads/${target}`;
    gitState.currentBranch = target;

    return { message: `Switched to branch '${target}'` };
  }

  
  handleFileCreation(command, worldState) {

    const match = command.match(/echo\s+["']?([^"']+)["']?\s*>\s*(\S+)/);
    if (match) {
      const content = match[1];
      const filename = match[2];
      worldState.set(`file:${filename}`, content);
      return { message: `Created file '${filename}'` };
    }
    return { error: 'Invalid file creation syntax' };
  }

  
  checkRubric(gitState, worldState, rubric, errors) {
    if (!rubric || typeof rubric.check !== 'function') {
      return {
        passed: errors.length === 0,
        feedback: errors.length === 0 
          ? 'Git commands executed successfully!' 
          : errors.join('. '),
        hints: []
      };
    }

    const fileSystem = {};
    for (const [key, value] of worldState.entries()) {
      if (key.startsWith('file:')) {
        fileSystem[key.substring(5)] = value;
      }
    }

    const worldStateObj = {
      gitState: gitState,
      fileSystem: fileSystem
    };

    const rubricResult = rubric.check(gitState, worldStateObj);

    return {
      passed: rubricResult.passed && errors.length === 0,
      feedback: rubricResult.feedback || 'Validation complete',
      hints: rubricResult.hints || []
    };
  }

  
  createInitialGitState() {
    return {
      initialized: false,
      HEAD: null,
      currentBranch: null,
      branches: {},
      commits: [],
      index: {},
      workingDirectory: {}
    };
  }

  
  generateCommitHash() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  
  extractFileSystem(worldState) {
    const fileSystem = {};
    for (const [key, value] of worldState.entries()) {
      if (key.startsWith('file:')) {
        fileSystem[key.substring(5)] = value;
      }
    }
    return fileSystem;
  }
}