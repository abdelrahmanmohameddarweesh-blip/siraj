import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.tsx$/.test(e.name))files.push(p);}}
walk(root);
let issues=[];
for(const file of files){const s=fs.readFileSync(file,'utf8');const tall=[...s.matchAll(/minHeight\s*:\s*(\d+)/g)].filter(m=>Number(m[1])>180);if(tall.length)issues.push(`${file}: ${tall.length} minHeight declarations above 180`);}
console.log(`Layout audit: scanned ${files.length} TSX files.`);
console.log(issues.length?issues.join('\n'):'No hard-coded minHeight above 180 found.');
console.log('Manual review remains necessary for nested headers, RTL wrapping, and device safe areas.');
