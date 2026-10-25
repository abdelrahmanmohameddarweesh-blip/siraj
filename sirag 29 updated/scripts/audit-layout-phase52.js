const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'src');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.tsx$/.test(entry.name)) files.push(full);
  }
}
walk(root);
let findings=0;
for (const file of files) {
  const text=fs.readFileSync(file,'utf8');
  const topPads=[...text.matchAll(/paddingTop\s*:\s*(\d+)/g)].map(m=>Number(m[1]));
  const fixedHeights=[...text.matchAll(/minHeight\s*:\s*(\d+)/g)].map(m=>Number(m[1]));
  if (topPads.some(n=>n>=48) || fixedHeights.some(n=>n>=180)) {
    findings++;
    console.log(path.relative(root,file)+': review large top padding or minimum card height');
  }
}
console.log(`Scanned ${files.length} TSX files; ${findings} candidates for device review.`);
