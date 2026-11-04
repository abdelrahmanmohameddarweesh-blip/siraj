const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const site = args.find(arg => !arg.startsWith('--'));
const dryRun = args.includes('--dry-run');
if (!site || !/^[a-z0-9][a-z0-9-]{4,28}[a-z0-9]$/.test(site)) {
  console.error('Usage: npm run hosting:configure -- <available-firebase-site-id> [--dry-run]\nUse a 6–30 character lowercase site ID. Create it in your existing Firebase project first.');
  process.exit(1);
}
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const rc = read('.firebaserc'), config = read('firebase.json'), release = read('release.config.json');
const project = rc.projects?.default;
if (project !== 'batal-moslem') throw new Error('Unexpected Firebase project. Refusing to change project or user-data configuration.');
if (!config.hosting || Array.isArray(config.hosting)) throw new Error('Expected the single-site Hosting configuration.');
const target = 'siraj';
rc.targets ??= {};
rc.targets[project] ??= {};
rc.targets[project].hosting ??= {};
rc.targets[project].hosting[target] = [site];
config.hosting.target = target;
const oldBase = release.website.replace(/\/$/, ''), base = `https://${site}.web.app`;
release.website = base;
const changes = new Map([
 ['.firebaserc', JSON.stringify(rc, null, 2) + '\n'],
 ['firebase.json', JSON.stringify(config, null, 2) + '\n'],
 ['release.config.json', JSON.stringify(release, null, 2) + '\n'],
]);
for (const file of ['store-listing/listing-en.txt', 'store-listing/listing-ar.txt']) {
 const p = path.join(root, file);
 if (fs.existsSync(p)) changes.set(file, fs.readFileSync(p, 'utf8').split(oldBase).join(base));
}
console.log(`${dryRun ? 'PREVIEW' : 'Configure'} Hosting site ${site} in existing project ${project}.`);
for (const [file, contents] of changes) {
 if (!dryRun) fs.writeFileSync(path.join(root, file), contents);
 console.log(`${dryRun ? 'Would update' : 'Updated'} ${file}`);
}
console.log(`Privacy: ${base}/privacy\nDeletion: ${base}/delete-account\nSupport: ${base}/support`);
console.log('This does not create or deploy the site. Existing Firebase Auth/Firestore configuration and user data are unchanged.');
console.log(`Next: npx firebase-tools deploy --only hosting:${target} --project ${project}`);
