const level1Rubric = {
  type: 'logic',
  check: (executionResult, worldState) => {
    const logs = executionResult.consoleLogs || [];
    const hasHello = logs.some(log => 
      String(log).toLowerCase().includes('hello')
    );
    const noErrors = executionResult.errors.length === 0;
    const noTimeout = !executionResult.timeout;

    return {
      passed: hasHello && noErrors && noTimeout,
      feedback: hasHello && noErrors && noTimeout
        ? "Great! You've printed 'Hello' to the console!"
        : "Try using console.log('Hello') to print a message.",
      hints: hasHello ? [] : ["Use: console.log('Hello')"]
    };
  }
};

const level2Rubric = {
  type: 'logic',
  check: (executionResult, worldState) => {
    const vars = executionResult.variables || {};
    const hasX = 'x' in vars && vars.x === 10;
    const noErrors = executionResult.errors.length === 0;
    const noTimeout = !executionResult.timeout;

    return {
      passed: hasX && noErrors && noTimeout,
      feedback: hasX && noErrors && noTimeout
        ? "Perfect! Variable x is set to 10."
        : "Create a variable x and set it to 10.",
      hints: hasX ? [] : ["Use: let x = 10; or const x = 10;"]
    };
  }
};

const level3Rubric = {
  type: 'logic',
  check: (executionResult, worldState) => {
    const vars = executionResult.variables || {};
    const hasResult = 'result' in vars && vars.result === 15;
    const noErrors = executionResult.errors.length === 0;
    const noTimeout = !executionResult.timeout;

    return {
      passed: hasResult && noErrors && noTimeout,
      feedback: hasResult && noErrors && noTimeout
        ? "Excellent! Result is 15 (5 + 10)."
        : "Calculate 5 + 10 and store it in a variable called 'result'.",
      hints: hasResult ? [] : ["Use: let result = 5 + 10;"]
    };
  }
};

const level4Rubric = {
  type: 'logic',
  check: (executionResult, worldState) => {
    const logs = executionResult.consoleLogs || [];
    const hasCorrect = logs.some(log => 
      String(log).toLowerCase().includes('greater')
    );
    const noErrors = executionResult.errors.length === 0;
    const noTimeout = !executionResult.timeout;

    return {
      passed: hasCorrect && noErrors && noTimeout,
      feedback: hasCorrect && noErrors && noTimeout
        ? "Well done! You used an if statement correctly."
        : "Use an if statement to check if 10 > 5 and print 'Greater'.",
      hints: hasCorrect ? [] : ["Use: if (10 > 5) { console.log('Greater'); }"]
    };
  }
};

const level5Rubric = {
  type: 'loop',
  requiresLoop: true,
  expectedLogCount: 5,
  expectedLogs: ['1', '2', '3', '4', '5'],
  check: (executionResult, worldState) => {
    const logs = executionResult.consoleLogs || [];
    const logCount = logs.length === 5;
    const logContent = logs[0] === '1' && 
                       logs[1] === '2' && 
                       logs[2] === '3' && 
                       logs[3] === '4' && 
                       logs[4] === '5';
    const noErrors = executionResult.errors.length === 0;
    const noTimeout = !executionResult.timeout;

    const passed = logCount && logContent && noErrors && noTimeout;

    return {
      passed,
      feedback: passed
        ? "Perfect! You've mastered for loops. The numbers 1-5 were printed correctly."
        : generateLevel5Feedback(logCount, logContent, noErrors, noTimeout),
      hints: generateLevel5Hints(logCount, logContent)
    };
  }
};

function generateLevel5Feedback(logCount, logContent, noErrors, noTimeout) {
  if (!noTimeout) return "Your code took too long to execute. Check for infinite loops.";
  if (!noErrors) return "Your code has errors. Check the syntax.";
  if (!logCount) return "Your loop didn't print exactly 5 numbers. Check your loop condition.";
  if (!logContent) return "The numbers printed don't match 1-5. Verify your loop starts at 1 and ends at 5.";
  return "Something went wrong. Review your code and try again.";
}

function generateLevel5Hints(logCount, logContent) {
  const hints = [];
  if (!logCount) hints.push("Make sure your loop runs exactly 5 times: for (let i = 1; i <= 5; i++)");
  if (!logContent) hints.push("Start your loop variable at 1, not 0.");
  return hints;
}

const level6Rubric = {
  type: 'loop',
  requiresLoop: true,
  check: (executionResult, worldState) => {
    const logs = executionResult.consoleLogs || [];
    const hasCount = logs.length >= 3 && logs.length <= 5;
    const noErrors = executionResult.errors.length === 0;
    const noTimeout = !executionResult.timeout;

    return {
      passed: hasCount && noErrors && noTimeout,
      feedback: hasCount && noErrors && noTimeout
        ? "Great! You used a while loop correctly."
        : "Use a while loop to print numbers. Count from 1 to at least 3.",
      hints: hasCount ? [] : ["Use: let i = 1; while (i <= 3) { console.log(i); i++; }"]
    };
  }
};

const level7Rubric = {
  type: 'logic',
  check: (executionResult, worldState) => {
    const vars = executionResult.variables || {};
    const hasArray = 'arr' in vars && Array.isArray(vars.arr) && vars.arr.length === 3;
    const noErrors = executionResult.errors.length === 0;
    const noTimeout = !executionResult.timeout;

    return {
      passed: hasArray && noErrors && noTimeout,
      feedback: hasArray && noErrors && noTimeout
        ? "Perfect! You created an array with 3 elements."
        : "Create an array called 'arr' with 3 elements.",
      hints: hasArray ? [] : ["Use: let arr = [1, 2, 3];"]
    };
  }
};

const level8Rubric = {
  type: 'logic',
  check: (executionResult, worldState) => {
    const funcs = executionResult.functions || {};
    const hasFunction = 'greet' in funcs || 'greet' in (executionResult.variables || {});
    const noErrors = executionResult.errors.length === 0;
    const noTimeout = !executionResult.timeout;

    return {
      passed: hasFunction && noErrors && noTimeout,
      feedback: hasFunction && noErrors && noTimeout
        ? "Excellent! You've created a function."
        : "Create a function called 'greet' that takes no parameters.",
      hints: hasFunction ? [] : ["Use: function greet() { } or const greet = () => { }"]
    };
  }
};

const level9Rubric = {
  type: 'git',
  check: (gitState, worldState) => {
    return {
      passed: gitState.initialized === true,
      feedback: gitState.initialized
        ? "Perfect! Repository initialized successfully."
        : "Initialize a git repository using 'git init'.",
      hints: gitState.initialized ? [] : ["Use: git init"]
    };
  }
};

const level10Rubric = {
  type: 'git',
  check: (gitState, worldState) => {
    const fileSystem = worldState.fileSystem || {};
    
    const checks = {
      repoInitialized: gitState.initialized === true,
      hasBranches: gitState.branches && Object.keys(gitState.branches).length > 0,
      featureFileExists: 'feature.js' in fileSystem,
      featureFileInIndex: gitState.index && 'feature.js' in gitState.index,
      hasCommits: gitState.commits && gitState.commits.length >= 1,
      correctCommitMessage: 
        gitState.commits && 
        gitState.commits.length > 0 &&
        gitState.commits[0].message.toLowerCase() === 'add feature',
      commitIncludesFeature: 
        gitState.commits &&
        gitState.commits.length > 0 &&
        gitState.commits[0].files &&
        gitState.commits[0].files.includes('feature.js'),
      developBranchExists: 
        gitState.branches && 
        'develop' in gitState.branches,
      onDevelopBranch: 
        gitState.HEAD === 'develop' || 
        gitState.HEAD === 'refs/heads/develop' ||
        (gitState.currentBranch === 'develop')
    };

    const passed = Object.values(checks).every(check => check === true);

    return {
      passed,
      feedback: passed
        ? "Excellent! You've successfully created a branch and switched to it. Git branching mastered!"
        : generateLevel10Feedback(checks),
      hints: generateLevel10Hints(checks)
    };
  }
};

function generateLevel10Feedback(checks) {
  const issues = [];
  if (!checks.repoInitialized) issues.push("Repository not initialized. Run 'git init' first.");
  if (!checks.featureFileExists) issues.push("File 'feature.js' not found. Create it first.");
  if (!checks.featureFileInIndex) issues.push("File not staged. Use 'git add feature.js'.");
  if (!checks.hasCommits) issues.push("No commits found. Use 'git commit' to create a commit.");
  if (!checks.correctCommitMessage) issues.push("Commit message should be 'Add feature'.");
  if (!checks.developBranchExists) issues.push("Branch 'develop' not created. Use 'git branch develop'.");
  if (!checks.onDevelopBranch) issues.push("Not on 'develop' branch. Use 'git checkout develop'.");
  return issues.join(" ");
}

function generateLevel10Hints(checks) {
  const hints = [];
  if (!checks.repoInitialized) hints.push("Start with: git init");
  if (!checks.featureFileExists) hints.push("Create file: echo 'code' > feature.js");
  if (!checks.featureFileInIndex) hints.push("Stage file: git add feature.js");
  if (!checks.hasCommits) hints.push("Commit: git commit -m 'Add feature'");
  if (!checks.developBranchExists) hints.push("Create branch: git branch develop");
  if (!checks.onDevelopBranch) hints.push("Switch branch: git checkout develop");
  return hints;
}


export const levelConfigs = new Map([

  [1, {
    id: 1,
    title: 'Hello World',
    category: 'JavaScript Basics',
    type: 'logic',
    description: 'Print "Hello" to the console using console.log()',
    rubric: level1Rubric,
    hints: [
      'Use console.log() to print text',
      'Example: console.log("Hello")'
    ],
    initialState: { variables: {}, gitState: null },
    unlocks: [2]
  }],
  [2, {
    id: 2,
    title: 'Variables',
    category: 'JavaScript Basics',
    type: 'logic',
    description: 'Create a variable named x and set it to 10',
    rubric: level2Rubric,
    hints: [
      'Use let or const to declare a variable',
      'Example: let x = 10;'
    ],
    initialState: { variables: {}, gitState: null },
    unlocks: [3]
  }],
  [3, {
    id: 3,
    title: 'Arithmetic',
    category: 'JavaScript Basics',
    type: 'logic',
    description: 'Calculate 5 + 10 and store the result in a variable called "result"',
    rubric: level3Rubric,
    hints: [
      'Use the + operator for addition',
      'Example: let result = 5 + 10;'
    ],
    initialState: { variables: {}, gitState: null },
    unlocks: [4]
  }],
  [4, {
    id: 4,
    title: 'Conditionals',
    category: 'JavaScript Basics',
    type: 'logic',
    description: 'Use an if statement to check if 10 > 5 and print "Greater"',
    rubric: level4Rubric,
    hints: [
      'Use if (condition) { ... }',
      'Example: if (10 > 5) { console.log("Greater"); }'
    ],
    initialState: { variables: {}, gitState: null },
    unlocks: [5]
  }],

  [5, {
    id: 5,
    title: 'For Loops',
    category: 'Loops',
    type: 'loop',
    description: 'Write a for loop that prints numbers from 1 to 5 using console.log()',
    rubric: level5Rubric,
    hints: [
      'Use: for (let i = 1; i <= 5; i++) { ... }',
      'Call console.log(i) inside the loop body',
      'Make sure your loop condition includes 5 (use <= not <)'
    ],
    initialState: { variables: {}, gitState: null },
    unlocks: [6]
  }],
  [6, {
    id: 6,
    title: 'While Loops',
    category: 'Loops',
    type: 'loop',
    description: 'Use a while loop to print numbers from 1 to 3',
    rubric: level6Rubric,
    hints: [
      'Use: let i = 1; while (i <= 3) { ... }',
      'Don\'t forget to increment i inside the loop'
    ],
    initialState: { variables: {}, gitState: null },
    unlocks: [7]
  }],

  [7, {
    id: 7,
    title: 'Arrays',
    category: 'Data Structures',
    type: 'logic',
    description: 'Create an array called "arr" with 3 elements',
    rubric: level7Rubric,
    hints: [
      'Use square brackets to create an array',
      'Example: let arr = [1, 2, 3];'
    ],
    initialState: { variables: {}, gitState: null },
    unlocks: [8]
  }],

  [8, {
    id: 8,
    title: 'Functions',
    category: 'Functions',
    type: 'logic',
    description: 'Create a function called "greet" that takes no parameters',
    rubric: level8Rubric,
    hints: [
      'Use: function greet() { }',
      'Or: const greet = () => { }'
    ],
    initialState: { variables: {}, gitState: null },
    unlocks: [9]
  }],

  [9, {
    id: 9,
    title: 'Git Init',
    category: 'Git',
    type: 'git',
    description: 'Initialize a git repository',
    rubric: level9Rubric,
    hints: [
      'Use: git init'
    ],
    initialState: {
      variables: {},
      gitState: {
        initialized: false,
        HEAD: null,
        currentBranch: null,
        branches: {},
        commits: [],
        index: {},
        workingDirectory: {}
      }
    },
    unlocks: [10]
  }],
  [10, {
    id: 10,
    title: 'Git Branching',
    category: 'Git',
    type: 'git',
    description: 'Initialize a repo, create feature.js, commit it, create a develop branch, and switch to it',
    rubric: level10Rubric,
    hints: [
      'Start with: git init',
      'Create file: echo "code" > feature.js',
      'Stage: git add feature.js',
      'Commit: git commit -m "Add feature"',
      'Create branch: git branch develop',
      'Switch: git checkout develop'
    ],
    initialState: {
      variables: {},
      gitState: {
        initialized: false,
        HEAD: null,
        currentBranch: null,
        branches: {},
        commits: [],
        index: {},
        workingDirectory: {}
      }
    },
    unlocks: []
  }]
]);

export function getAllLevelIds() {
  return Array.from(levelConfigs.keys()).sort((a, b) => a - b);
}

export function getLevelsByCategory() {
  const categories = {};
  levelConfigs.forEach((config, id) => {
    const category = config.category || 'Uncategorized';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({ id, ...config });
  });
  return categories;
}

export function getCategories() {
  const categories = new Set();
  levelConfigs.forEach(config => {
    if (config.category) {
      categories.add(config.category);
    }
  });
  return Array.from(categories).sort();
}