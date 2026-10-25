const fs = require('fs');
const path = require('path');
const folder = path.join(__dirname, '..', 'src', 'screens');
let flagged = 0;
for (const filename of fs.readdirSync(folder).filter(n => n.endsWith('.tsx'))) {
  const content = fs.readFileSync(path.join(folder, filename), 'utf8');
  for (const match of content.matchAll(/paddingTop:\s*(\d+)/g)) {
    if (Number(match[1]) >= 40) { console.log(`${filename}: large fixed top padding (${match[1]}) — review safe area`); flagged++; }
  }
}
console.log(`Audit finished: ${flagged} possible fixed top paddings to review.`);
