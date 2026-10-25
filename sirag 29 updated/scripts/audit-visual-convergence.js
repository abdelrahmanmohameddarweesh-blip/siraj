const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'src/App.tsx'),'utf8');
const routes=['QuranJourney','QuranReader','SirahStory','HadithInAction','HabitGarden','PrayerTracker'];
let errors=0;
for(const route of routes){
 const registered=new RegExp('name="'+route+'"').test(app);
 const file=path.join(root,'src/screens',route+'Screen.tsx');
 const present=fs.existsSync(file);
 console.log(`${route}: ${registered&&present?'OK':'MISSING'} (route=${registered}, screen=${present})`);
 if(!registered||!present)errors++;
}
for(const file of ['src/components/CinematicPortal.tsx','src/screens/HomeScreen.tsx','src/screens/LearningScreen.tsx','src/screens/ArenaHubScreen.tsx','src/screens/ProfileScreen.tsx']){
 if(!fs.existsSync(path.join(root,file))){console.error('Missing',file);errors++;}
}
console.log(`Audit: ${errors} missing source/route checks. This does not replace device testing.`);
process.exitCode=errors?1:0;
