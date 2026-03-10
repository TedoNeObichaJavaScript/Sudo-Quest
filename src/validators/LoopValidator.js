import { LogicValidator } from './LogicValidator.js';

export class LoopValidator extends LogicValidator {
  constructor() {
    super();
  }

  
  async validate(userCode, rubric, worldState, timeout = 2000) {

    const executionResult = await this.executeInSandbox(userCode, timeout);

    this.mergeExecutionResult(worldState, executionResult);

    const loopValidation = this.validateLoopStructure(userCode, executionResult, rubric);

    const rubricResult = this.checkRubric(executionResult, worldState, rubric);

    const passed = loopValidation.passed && rubricResult.passed && 
                   executionResult.errors.length === 0 && !executionResult.timeout;

    return {
      passed,
      feedback: passed 
        ? rubricResult.feedback || 'Loop executed correctly!'
        : loopValidation.feedback || rubricResult.feedback || 'Loop validation failed',
      worldState: {
        variables: executionResult.variables || {},
        functions: executionResult.functions || {},
        consoleLogs: executionResult.consoleLogs || [],
        errors: executionResult.errors || []
      },
      errors: executionResult.errors || [],
      hints: [...(loopValidation.hints || []), ...(rubricResult.hints || [])],
      timeout: executionResult.timeout || false
    };
  }

  
  validateLoopStructure(userCode, executionResult, rubric) {
    const consoleLogs = executionResult.consoleLogs || [];
    const errors = [];

    const hasForLoop = /for\s*\(/.test(userCode);
    const hasWhileLoop = /while\s*\(/.test(userCode);
    const hasLoop = hasForLoop || hasWhileLoop;

    if (!hasLoop && rubric.requiresLoop) {
      errors.push('Code must use a loop (for or while)');
    }

    if (rubric.expectedLogCount !== undefined) {
      if (consoleLogs.length !== rubric.expectedLogCount) {
        errors.push(`Expected ${rubric.expectedLogCount} console.log calls, got ${consoleLogs.length}`);
      }
    }

    if (rubric.expectedLogs) {
      const matches = rubric.expectedLogs.every((expected, index) => {
        return consoleLogs[index] === String(expected);
      });

      if (!matches) {
        errors.push(`Console output doesn't match expected sequence`);
      }
    }

    return {
      passed: errors.length === 0,
      feedback: errors.length > 0 ? errors.join('. ') : 'Loop structure valid',
      hints: this.generateHints(errors, rubric)
    };
  }

  
  generateHints(errors, rubric) {
    const hints = [];

    if (errors.some(e => e.includes('loop'))) {
      hints.push('Try using: for (let i = 1; i <= 5; i++) { console.log(i); }');
    }

    if (errors.some(e => e.includes('console.log'))) {
      hints.push('Make sure you call console.log() inside your loop');
    }

    if (errors.some(e => e.includes('sequence'))) {
      hints.push('Check that your loop prints numbers in the correct order');
    }

    return hints;
  }
}