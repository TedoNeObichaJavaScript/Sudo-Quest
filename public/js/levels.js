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

// ── Category Registry ───────────────────────────────────────

export const CATEGORIES = [
  { key: 'js',      name: 'JavaScript', levels: JS_LEVELS },
  { key: 'git',     name: 'Git',        levels: GIT_LEVELS },
  { key: 'cmd',     name: 'Terminal',    levels: CMD_LEVELS },
  { key: 'html',    name: 'HTML',        levels: HTML_LEVELS },
  { key: 'css',     name: 'CSS',         levels: CSS_LEVELS },
  { key: 'csharp',  name: 'C#',          levels: CSHARP_LEVELS },
];

// ── Exports ─────────────────────────────────────────────────

export function getCategoryByKey(key) {
  return CATEGORIES.find(c => c.key === key) || null;
}

export function getLevelsForCategory(key) {
  const cat = getCategoryByKey(key);
  return cat ? cat.levels : [];
}

