/**
 * Batch-applies dark mode Tailwind classes to all .tsx files.
 * Run: node scripts/apply-dark-mode.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const SRC = './src';

function findFiles(dir, ext = '.tsx') {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findFiles(full, ext));
    } else if (full.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

const rules = [];
function addRule(pattern, replacement) {
  rules.push([pattern, replacement]);
}

// ───── GRAY BACKGROUNDS ─────
addRule(/(?<![:\w-])bg-white\/(\d+)\b(?!\s+dark:)/g, 'bg-white/$1 dark:bg-gray-900/$1');
addRule(/(?<![:\w-])bg-white\b(?![/\d])(?!\s+dark:)/g, 'bg-white dark:bg-gray-900');
addRule(/(?<![:\w-])bg-gray-50\/(\d+)\b(?!\s+dark:)/g, 'bg-gray-50/$1 dark:bg-gray-800/$1');
addRule(/(?<![:\w-])bg-gray-50\b(?![/\d])(?!\s+dark:)/g, 'bg-gray-50 dark:bg-gray-800');
addRule(/(?<![:\w-])bg-gray-100\b(?!\s+dark:)/g, 'bg-gray-100 dark:bg-gray-700');
addRule(/(?<![:\w-])bg-gray-200\b(?!\s+dark:)/g, 'bg-gray-200 dark:bg-gray-600');

// ───── GRAY TEXT ─────
addRule(/(?<![:\w-])text-gray-900\b(?!\s+dark:)/g, 'text-gray-900 dark:text-gray-100');
addRule(/(?<![:\w-])text-gray-700\b(?!\s+dark:)/g, 'text-gray-700 dark:text-gray-300');
addRule(/(?<![:\w-])text-gray-600\b(?!\s+dark:)/g, 'text-gray-600 dark:text-gray-400');
addRule(/(?<![:\w-])text-gray-500\b(?!\s+dark:)/g, 'text-gray-500 dark:text-gray-400');
addRule(/(?<![:\w-])text-gray-400\b(?!\s+dark:)/g, 'text-gray-400 dark:text-gray-500');
addRule(/(?<![:\w-])text-gray-300\b(?!\s+dark:)/g, 'text-gray-300 dark:text-gray-500');

// ───── GRAY BORDERS ─────
addRule(/(?<![:\w-])border-gray-100\b(?!\s+dark:)/g, 'border-gray-100 dark:border-gray-800');
addRule(/(?<![:\w-])border-gray-200\/(\d+)\b(?!\s+dark:)/g, 'border-gray-200/$1 dark:border-gray-700');
addRule(/(?<![:\w-])border-gray-200\b(?![/\d])(?!\s+dark:)/g, 'border-gray-200 dark:border-gray-700');
addRule(/(?<![:\w-])border-gray-300\b(?!\s+dark:)/g, 'border-gray-300 dark:border-gray-600');

// ───── GRAY BORDER-DASHED ─────
addRule(/(?<![:\w-])border-dashed\b(?!\s+dark:)/g, 'border-dashed');

// ───── PLACEHOLDERS ─────
addRule(/(?<![:\w-])placeholder:text-gray-400\b(?!\s+dark:)/g, 'placeholder:text-gray-400 dark:placeholder:text-gray-500');
addRule(/(?<![:\w-])placeholder:text-gray-300\b(?!\s+dark:)/g, 'placeholder:text-gray-300 dark:placeholder:text-gray-500');

// ───── HOVER (gray) ─────
addRule(/(?<![:\w-])hover:bg-gray-50\b(?!\s+dark:)/g, 'hover:bg-gray-50 dark:hover:bg-gray-800');
addRule(/(?<![:\w-])hover:bg-gray-100\b(?!\s+dark:)/g, 'hover:bg-gray-100 dark:hover:bg-gray-700');
addRule(/(?<![:\w-])hover:text-gray-900\b(?!\s+dark:)/g, 'hover:text-gray-900 dark:hover:text-gray-100');
addRule(/(?<![:\w-])hover:text-gray-700\b(?!\s+dark:)/g, 'hover:text-gray-700 dark:hover:text-gray-300');
addRule(/(?<![:\w-])hover:text-gray-600\b(?!\s+dark:)/g, 'hover:text-gray-600 dark:hover:text-gray-400');
addRule(/(?<![:\w-])hover:text-gray-800\b(?!\s+dark:)/g, 'hover:text-gray-800 dark:hover:text-gray-200');

// ───── FOCUS ─────
addRule(/(?<![:\w-])focus:bg-white\b(?!\s+dark:)/g, 'focus:bg-white dark:focus:bg-gray-900');

// ───── DISABLED ─────
addRule(/(?<![:\w-])disabled:bg-gray-50\b(?!\s+dark:)/g, 'disabled:bg-gray-50 dark:disabled:bg-gray-800');
addRule(/(?<![:\w-])disabled:text-gray-400\b(?!\s+dark:)/g, 'disabled:text-gray-400 dark:disabled:text-gray-500');

// ───── RING (gray) ─────
addRule(/(?<![:\w-])ring-gray-200\b(?!\s+dark:)/g, 'ring-gray-200 dark:ring-gray-700');
addRule(/(?<![:\w-])ring-white\b(?!\s+dark:)/g, 'ring-white dark:ring-gray-900');

// ───── DIVIDE ─────
addRule(/(?<![:\w-])divide-gray-100\b(?!\s+dark:)/g, 'divide-gray-100 dark:divide-gray-800');
addRule(/(?<![:\w-])divide-gray-200\b(?!\s+dark:)/g, 'divide-gray-200 dark:divide-gray-700');

// ───── GRADIENT STOPS (gray/pastel) ─────
addRule(/(?<![:\w-])from-slate-50\b(?!\s+dark:)/g, 'from-slate-50 dark:from-gray-950');
addRule(/(?<![:\w-])via-blue-50\b(?!\s+dark:)/g, 'via-blue-50 dark:via-gray-900');
addRule(/(?<![:\w-])to-indigo-50\b(?!\s+dark:)/g, 'to-indigo-50 dark:to-indigo-950');
addRule(/(?<![:\w-])from-gray-200\b(?!\s+dark:)/g, 'from-gray-200 dark:from-gray-700');
addRule(/(?<![:\w-])via-gray-100\b(?!\s+dark:)/g, 'via-gray-100 dark:via-gray-800');
addRule(/(?<![:\w-])to-gray-200\b(?!\s+dark:)/g, 'to-gray-200 dark:to-gray-700');
addRule(/(?<![:\w-])from-blue-100\b(?!\s+dark:)/g, 'from-blue-100 dark:from-blue-900');
addRule(/(?<![:\w-])to-indigo-100\b(?!\s+dark:)/g, 'to-indigo-100 dark:to-indigo-900');

// ───── STATUS COLORS (dynamic) ─────
const statusColors = ['blue', 'red', 'green', 'amber', 'purple', 'indigo', 'emerald', 'orange', 'sky', 'rose', 'yellow'];

for (const c of statusColors) {
  // bg-{c}-50 with optional opacity
  addRule(
    new RegExp(`(?<![:\\w-])bg-${c}-50\\b(?:/(\\d+))?(?!\\s+dark:)`, 'g'),
    (match, opacity) => opacity
      ? `bg-${c}-50/${opacity} dark:bg-${c}-900/20`
      : `bg-${c}-50 dark:bg-${c}-900/30`
  );
  // bg-{c}-100
  addRule(new RegExp(`(?<![:\\w-])bg-${c}-100\\b(?!\\s+dark:)`, 'g'), `bg-${c}-100 dark:bg-${c}-900/40`);

  // text-{c}-800/700/600/500
  addRule(new RegExp(`(?<![:\\w-])text-${c}-800\\b(?!\\s+dark:)`, 'g'), `text-${c}-800 dark:text-${c}-300`);
  addRule(new RegExp(`(?<![:\\w-])text-${c}-700\\b(?!\\s+dark:)`, 'g'), `text-${c}-700 dark:text-${c}-400`);
  addRule(new RegExp(`(?<![:\\w-])text-${c}-600\\b(?!\\s+dark:)`, 'g'), `text-${c}-600 dark:text-${c}-400`);
  addRule(new RegExp(`(?<![:\\w-])text-${c}-500\\b(?!\\s+dark:)`, 'g'), `text-${c}-500 dark:text-${c}-400`);

  // border-{c}-100/200/300/400
  addRule(new RegExp(`(?<![:\\w-])border-${c}-100\\b(?!\\s+dark:)`, 'g'), `border-${c}-100 dark:border-${c}-900`);
  addRule(new RegExp(`(?<![:\\w-])border-${c}-200\\b(?!\\s+dark:)`, 'g'), `border-${c}-200 dark:border-${c}-800`);
  addRule(new RegExp(`(?<![:\\w-])border-${c}-300\\b(?!\\s+dark:)`, 'g'), `border-${c}-300 dark:border-${c}-700`);
  addRule(new RegExp(`(?<![:\\w-])border-${c}-400\\b(?!\\s+dark:)`, 'g'), `border-${c}-400 dark:border-${c}-600`);

  // ring-{c}-200
  addRule(new RegExp(`(?<![:\\w-])ring-${c}-200\\b(?!\\s+dark:)`, 'g'), `ring-${c}-200 dark:ring-${c}-800`);

  // hover on status bg/text
  addRule(new RegExp(`(?<![:\\w-])hover:bg-${c}-50\\b(?!\\s+dark:)`, 'g'), `hover:bg-${c}-50 dark:hover:bg-${c}-900/30`);
  addRule(new RegExp(`(?<![:\\w-])hover:bg-${c}-100\\b(?!\\s+dark:)`, 'g'), `hover:bg-${c}-100 dark:hover:bg-${c}-900/40`);
  addRule(new RegExp(`(?<![:\\w-])hover:text-${c}-600\\b(?!\\s+dark:)`, 'g'), `hover:text-${c}-600 dark:hover:text-${c}-400`);
  addRule(new RegExp(`(?<![:\\w-])hover:text-${c}-500\\b(?!\\s+dark:)`, 'g'), `hover:text-${c}-500 dark:hover:text-${c}-400`);
  addRule(new RegExp(`(?<![:\\w-])hover:text-${c}-800\\b(?!\\s+dark:)`, 'g'), `hover:text-${c}-800 dark:hover:text-${c}-200`);
  addRule(new RegExp(`(?<![:\\w-])hover:border-${c}-300\\b(?!\\s+dark:)`, 'g'), `hover:border-${c}-300 dark:hover:border-${c}-700`);
}

// ───── PROCESS FILES ─────
const files = findFiles(SRC);
let updated = 0;

for (const filePath of files) {
  // Skip DarkModeToggle — it already has manual dark: classes
  if (filePath.includes('DarkModeToggle')) continue;

  let content = readFileSync(filePath, 'utf-8');
  let modified = content;

  for (const [pattern, replacement] of rules) {
    // Reset lastIndex for global regexes
    if (pattern instanceof RegExp) pattern.lastIndex = 0;
    modified = modified.replace(pattern, replacement);
  }

  if (modified !== content) {
    writeFileSync(filePath, modified, 'utf-8');
    console.log(`UPDATED: ${relative(SRC, filePath)}`);
    updated++;
  }
}

console.log(`\nDone! Updated ${updated} files.`);
