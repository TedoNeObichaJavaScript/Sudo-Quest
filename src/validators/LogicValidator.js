export class LogicValidator {
  constructor() {
    this.worker = null;
    this.initialized = false;
  }

  async initialize() {

    this.initialized = true;
  }

  
  async validate(userCode, rubric, worldState, timeout = 2000) {
    if (!this.initialized) {
      await this.initialize();
    }

    const executionResult = await this.executeInSandbox(userCode, timeout);

    this.mergeExecutionResult(worldState, executionResult);

    const validationResult = this.checkRubric(executionResult, worldState, rubric);

    return {
      passed: validationResult.passed,
      feedback: validationResult.feedback,
      worldState: {
        variables: executionResult.variables || {},
        functions: executionResult.functions || {},
        consoleLogs: executionResult.consoleLogs || [],
        errors: executionResult.errors || []
      },
      errors: executionResult.errors || [],
      hints: validationResult.hints || [],
      timeout: executionResult.timeout || false
    };
  }

  
  async executeInSandbox(code, timeout) {
    return new Promise((resolve) => {

      if (!this.worker) {

        this.worker = new Worker('/workers/sandbox-worker.js', { type: 'module' });
      }

      const requestId = `req_${Date.now()}_${Math.random()}`;

      const messageHandler = (event) => {
        if (event.data.requestId === requestId) {
          this.worker.removeEventListener('message', messageHandler);
          resolve(event.data);
        }
      };

      this.worker.addEventListener('message', messageHandler);

      this.worker.postMessage({
        code,
        timeout,
        requestId
      });

      setTimeout(() => {
        this.worker.removeEventListener('message', messageHandler);
        resolve({
          variables: {},
          functions: {},
          consoleLogs: [],
          errors: ['Execution timeout'],
          timeout: true
        });
      }, timeout + 500);
    });
  }

  
  mergeExecutionResult(worldState, executionResult) {

    if (executionResult.variables) {
      Object.entries(executionResult.variables).forEach(([key, value]) => {
        worldState.set(`var:${key}`, value);
      });
    }

    if (executionResult.functions) {
      Object.entries(executionResult.functions).forEach(([key, value]) => {
        worldState.set(`func:${key}`, value);
      });
    }

    const existingLogs = worldState.get('consoleLogs') || [];
    const newLogs = executionResult.consoleLogs || [];
    worldState.set('consoleLogs', [...existingLogs, ...newLogs]);
  }

  
  checkRubric(executionResult, worldState, rubric) {
    if (!rubric || typeof rubric.check !== 'function') {
      return {
        passed: executionResult.errors.length === 0 && !executionResult.timeout,
        feedback: 'Code executed successfully',
        hints: []
      };
    }

    const rubricResult = rubric.check(executionResult, worldState);

    return {
      passed: rubricResult.passed,
      feedback: rubricResult.feedback || 'Validation complete',
      hints: rubricResult.hints || []
    };
  }

  
  cleanup() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}