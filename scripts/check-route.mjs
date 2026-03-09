import { readFileSync } from 'fs';
const content = readFileSync('.next/server/app/api/auth/login/route.js', 'utf8');

// The dev build uses eval() - let's look for dependency issues instead
// Find all requires/imports
const requires = [...content.matchAll(/require\(['"](.*?)['"]\)/g)].map(m => m[1]);
console.log('Dependencies required:', [...new Set(requires)]);

// Check for any obvious errors in the source
const lines = content.split('\n');
console.log(`\nTotal lines: ${lines.length}`);
console.log('File size:', content.length, 'bytes');

// Look for the actual source code snippet around the cookies call
const idx = content.indexOf('cookieStore');
if (idx >= 0) {
  console.log('\nCode around cookieStore:');
  console.log(content.slice(Math.max(0, idx - 100), idx + 300));
}