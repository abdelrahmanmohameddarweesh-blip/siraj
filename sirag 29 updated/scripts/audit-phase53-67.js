const fs = require('fs');
const path = require('path');
const base = path.resolve(__dirname, '..');
const names = ['PrayerTracker','QuranAssessment','ReadingChallenge','FinishAyah','FinishAyahCamera','ArenaHub','LiveDuel','Trivia','HadithChallenge','Mutashabihat','SirahQuest','HabitGarden','Qibla','Fasting','GroupQuizLobby'];
let missing = 0;
for (const name of names) {
  const file = path.join(base,'src','screens',name+'Screen.tsx');
  if (!fs.existsSync(file)) { console.log('MISSING:',name); missing++; continue; }
  const source = fs.readFileSync(file,'utf8');
  const flags = [];
  if (/paddingTop:\s*Platform\.OS\s*===\s*['"]ios['"]/.test(source)) flags.push('hard-coded platform top padding');
  if (/minHeight:\s*(?:2\d\d|[3-9]\d\d)/.test(source)) flags.push('large minimum height');
  console.log(name+': '+(flags.join('; ') || 'source present'));
}
console.log('Checked 15 representative flows; missing='+missing);
process.exitCode = missing ? 1 : 0;
