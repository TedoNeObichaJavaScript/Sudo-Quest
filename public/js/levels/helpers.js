// ═══════════════════════════════════════════════════════════════
//  Shared validation helpers for all level categories
// ═══════════════════════════════════════════════════════════════

const P = { passed: true };
const F = (fb) => ({ passed: false, feedback: fb });

export function hasOutput(r, expected, cs = false) {
  return (r.consoleLogs || []).some(l =>
    cs ? l.includes(expected) : l.toLowerCase().includes(expected.toLowerCase())
  );
}

export function outputEquals(r, expected) {
  const logs = r.consoleLogs || [];
  if (logs.length !== expected.length) return false;
  return expected.every((v, i) => String(logs[i]).trim() === String(v));
}

export function hasVar(r, name, val) {
  if (!(name in r.variables)) return false;
  return val === undefined || r.variables[name] === val;
}

export function hasFunc(r, name) {
  return name in (r.functions || {});
}

export function noErrors(r) {
  return !r.errors || r.errors.length === 0;
}

export function codeHas(code, p) {
  return typeof p === 'string' ? code.includes(p) : p.test(code);
}

// ── Validation Factories ────────────────────────────────────

/** Check console output contains string */
export function vOut(expected) {
  return (code, r) => {
    if (r.errors?.length) return F(r.errors[0]);
    return hasOutput(r, expected) ? P : F(`Expected output containing "${expected}".`);
  };
}

/** Check exact output sequence */
export function vOuts(expected) {
  return (code, r) => {
    if (r.errors?.length) return F(r.errors[0]);
    if (outputEquals(r, expected)) return P;
    return F(`Expected: ${expected.join(', ')}. Got: ${(r.consoleLogs || []).join(', ')}`);
  };
}

/** Check variable has specific value */
export function vVar(name, val) {
  return (code, r) => {
    if (r.errors?.length) return F(r.errors[0]);
    if (hasVar(r, name, val)) return P;
    if (hasVar(r, name)) return F(`${name} should be ${JSON.stringify(val)}, got ${JSON.stringify(r.variables[name])}`);
    return F(`Create a variable called "${name}".`);
  };
}

/** Check code includes pattern AND optionally output */
export function vCode(pattern, outExpected, errMsg) {
  return (code, r) => {
    if (r.errors?.length) return F(r.errors[0]);
    if (!codeHas(code, pattern)) return F(errMsg || `Your code should use "${pattern}".`);
    if (outExpected && !hasOutput(r, outExpected)) return F(`Expected output: "${outExpected}".`);
    return P;
  };
}

/** Check code string contains all patterns (for html/css/csharp) */
export function vHas(patterns) {
  return (code) => {
    for (const p of patterns) {
      const [pattern, msg] = Array.isArray(p) ? p : [p, `Your code should include: ${p}`];
      const found = typeof pattern === 'string' ? code.includes(pattern) : pattern.test(code);
      if (!found) return F(msg);
    }
    return P;
  };
}

export { P, F };
