// ═══════════════════════════════════════════════════════════════
//  SUDO QUEST — Level Orchestrator
//  Imports all categories and exports unified level system
// ═══════════════════════════════════════════════════════════════

import { JS_LEVELS } from './levels/js.js';
import { GIT_LEVELS } from './levels/git.js';
import { CMD_LEVELS } from './levels/cmd.js';
import { HTML_LEVELS } from './levels/html.js';
import { CSS_LEVELS } from './levels/css.js';
import { CSHARP_LEVELS } from './levels/csharp.js';
import { PYTHON_LEVELS } from './levels/python.js';
import { C_LEVELS } from './levels/c.js';
import { JAVA_LEVELS } from './levels/java.js';
import { CPP_LEVELS } from './levels/cpp.js';
import { TYPESCRIPT_LEVELS } from './levels/typescript.js';
import { REACT_LEVELS } from './levels/react.js';
import { SQL_LEVELS } from './levels/sql.js';
import { RUST_LEVELS } from './levels/rust.js';

// ── Category Registry ───────────────────────────────────────

export const CATEGORIES = [
  { key: 'js',         name: 'JavaScript',  levels: JS_LEVELS },
  { key: 'git',        name: 'Git',         levels: GIT_LEVELS },
  { key: 'cmd',        name: 'Terminal',     levels: CMD_LEVELS },
  { key: 'html',       name: 'HTML',         levels: HTML_LEVELS },
  { key: 'css',        name: 'CSS',          levels: CSS_LEVELS },
  { key: 'csharp',     name: 'C#',           levels: CSHARP_LEVELS },
  { key: 'python',     name: 'Python',       levels: PYTHON_LEVELS },
  { key: 'c',          name: 'C',            levels: C_LEVELS },
  { key: 'java',       name: 'Java',         levels: JAVA_LEVELS },
  { key: 'cpp',        name: 'C++',          levels: CPP_LEVELS },
  { key: 'typescript', name: 'TypeScript',   levels: TYPESCRIPT_LEVELS },
  { key: 'react',      name: 'React',        levels: REACT_LEVELS },
  { key: 'sql',        name: 'SQL',          levels: SQL_LEVELS },
  { key: 'rust',       name: 'Rust',         levels: RUST_LEVELS },
];

// ── Exports ─────────────────────────────────────────────────

export function getCategoryByKey(key) {
  return CATEGORIES.find(c => c.key === key) || null;
}

export function getLevelsForCategory(key) {
  const cat = getCategoryByKey(key);
  return cat ? cat.levels : [];
}
