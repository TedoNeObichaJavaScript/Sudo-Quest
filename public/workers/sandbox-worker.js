const EXECUTION_TIMEOUT = 2000;

const shadowLogs = [];
const originalConsoleLog = console.log;

console.log = function(...args) {
  shadowLogs.push(args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' '));
  originalConsoleLog.apply(console, args);
};


async function executeCodeEnhanced(userCode, timeout = EXECUTION_TIMEOUT) {
  shadowLogs.length = 0;
  
  const worldState = {
    variables: {},
    functions: {},
    consoleLogs: [],
    errors: []
  };

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({
        ...worldState,
        consoleLogs: [...shadowLogs],
        errors: [...worldState.errors, 'Execution timeout: Code exceeded 2 second limit'],
        timeout: true
      });
    }, timeout);

    try {

      const isolatedScope = {
        console: {
          log: function(...args) {
            const logEntry = args.map(arg => {
              if (typeof arg === 'object') {
                try {
                  return JSON.stringify(arg);
                } catch {
                  return '[Object]';
                }
              }
              return String(arg);
            }).join(' ');
            shadowLogs.push(logEntry);
          }
        },
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        Error,
        TypeError,
        ReferenceError
      };

      const wrappedCode = `
        (function(scope) {
          with(scope) {
            ${userCode}
          }
          return scope;
        })({});
      `;

      const result = eval(wrappedCode);

      Object.keys(result).forEach(key => {
        if (typeof result[key] === 'function') {
          worldState.functions[key] = result[key].toString();
        } else if (!['console', 'Math', 'Date', 'JSON', 'Array', 'Object', 'String', 'Number', 'Boolean', 'RegExp', 'Error', 'TypeError', 'ReferenceError'].includes(key)) {
          worldState.variables[key] = result[key];
        }
      });

      clearTimeout(timeoutId);

      resolve({
        variables: worldState.variables,
        functions: worldState.functions,
        consoleLogs: [...shadowLogs],
        errors: worldState.errors,
        timeout: false
      });
    } catch (error) {
      clearTimeout(timeoutId);
      resolve({
        variables: worldState.variables,
        functions: worldState.functions,
        consoleLogs: [...shadowLogs],
        errors: [error.message],
        timeout: false
      });
    }
  });
}

self.addEventListener('message', async (event) => {
  const { code, timeout, requestId } = event.data;

  if (!code) {
    self.postMessage({
      requestId,
      error: 'No code provided'
    });
    return;
  }

  try {
    const result = await executeCodeEnhanced(code, timeout || EXECUTION_TIMEOUT);
    self.postMessage({
      requestId,
      ...result
    });
  } catch (error) {
    self.postMessage({
      requestId,
      variables: {},
      functions: {},
      consoleLogs: [],
      errors: [error.message],
      timeout: false
    });
  }
});