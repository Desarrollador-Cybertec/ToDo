import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'src');

function walkTsx(dir) {
  let files = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walkTsx(p));
    else if (e.name.endsWith('.tsx')) files.push(p);
  }
  return files;
}

let totalFiles = 0;

for (const f of walkTsx(srcDir)) {
  const c = fs.readFileSync(f, 'utf-8');
  let fileChanged = false;

  // Process the full file content (not line by line) to handle multi-line elements
  let n = c;

  // Scope to className strings that look like form field patterns
  // (rounded + border border-gray with dark variant, OR bg-white/gray dark bg)
  n = n.replace(/className="([^"]*(?:rounded-[a-z]+\s+border|border\s+border-gray-|dark:border-gray-)(?!.*dark:bg-)[^"]*)"/g, (match, cls) => {
    if (cls.includes('dark:bg-')) return match;
    const fixed = cls.replace(/\bborder\b/, 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border');
    if (fixed !== cls) fileChanged = true;
    return `className="${fixed}"`;
  });

  // Has dark:bg-gray-900 but no dark:text- → add text (form fields only)
  n = n.replace(/className="([^"]*rounded-[a-z]+[^"]*dark:bg-gray-900(?!.*dark:text-)[^"]*)"/g, (match, cls) => {
    if (cls.includes('dark:text-')) return match;
    fileChanged = true;
    return `className="${cls} text-gray-900 dark:text-gray-100"`;
  });

  // Has dark:bg-gray-800 (filter inputs) but no dark:text-
  n = n.replace(/className="([^"]*rounded-[a-z]+[^"]*dark:bg-gray-800(?!.*dark:text-)[^"]*)"/g, (match, cls) => {
    if (cls.includes('dark:text-') || cls.includes('dark:bg-gray-800/')) return match;
    fileChanged = true;
    return `className="${cls} text-gray-700 dark:text-gray-300"`;
  });

  // placeholder:text-gray-X without dark
  n = n.replace(/className="([^"]*placeholder:text-gray-[^"]*)"/g, (match, cls) => {
    if (cls.includes('dark:placeholder:')) return match;
    const fixed = cls.replace(/placeholder:text-gray-(\d+)/g, 'placeholder:text-gray-$1 dark:placeholder:text-gray-500');
    if (fixed !== cls) { fileChanged = true; return `className="${fixed}"`; }
    return match;
  });

  if (fileChanged) {
    fs.writeFileSync(f, n);
    totalFiles++;
    console.log('FIXED:', path.relative(srcDir, f));
  }
}

console.log('\nTotal files fixed:', totalFiles);
