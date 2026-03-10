const EXECUTION_TIMEOUT = 2000;

const shadowLogs = [];
const originalConsoleLog = console.log;

console.log = function(...args) {
  shadowLogs.push(args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' '));
  originalConsoleLog.apply(console, args);
};


async function executeCode(userCode, timeout = EXECUTION_TIMEOUT) {

  shadowLogs.length = 0;

  const context = {

    console: console,
    Math: Math,
    Date: Date,
    JSON: JSON,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    Error: Error,
    TypeError: TypeError,
    ReferenceError: ReferenceError,



  };

  const sandboxedCode = `
    (function() {
      "use strict";
      ${userCode}
    })();
  `;

  const capturedState = {
    variables: {},
    functions: {},
    errors: []
  };

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      resolve({
        variables: capturedState.variables,
        functions: capturedState.functions,
        consoleLogs: [...shadowLogs],
        errors: ['Execution timeout: Code exceeded 2 second limit'],
        timeout: true
      });
    }, timeout);

    try {

      const result = (function() {
        'use strict';

        const variableProxy = new Proxy({}, {
          set(target, prop, value) {
            if (typeof value === 'function') {
              capturedState.functions[prop] = value.toString();
            } else {
              capturedState.variables[prop] = value;
            }
            target[prop] = value;
            return true;
          },
          get(target, prop) {
            return target[prop];
          }
        });

        const func = new Function(
          'console', 'Math', 'Date', 'JSON', 'Array', 'Object', 'String', 'Number', 'Boolean',
          userCode
        );
        
        func(
          console,
          Math,
          Date,
          JSON,
          Array,
          Object,
          String,
          Number,
          Boolean
        );



        
        return capturedState;
      })();

      clearTimeout(timeoutId);

      resolve({
        variables: result.variables || capturedState.variables,
        functions: result.functions || capturedState.functions,
        consoleLogs: [...shadowLogs],
        errors: capturedState.errors,
        timeout: false
      });
    } catch (error) {
      clearTimeout(timeoutId);
      resolve({
        variables: capturedState.variables,
        functions: capturedState.functions,
        consoleLogs: [...shadowLogs],
        errors: [error.message],
        timeout: false
      });
    }
  });
}


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