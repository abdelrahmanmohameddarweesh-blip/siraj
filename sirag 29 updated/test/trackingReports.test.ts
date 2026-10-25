import test from 'node:test';
import assert from 'node:assert/strict';
import { playbackCredit, splitPlayback, prayerCount } from '../src/tracking/activityModel';
import { profileError } from '../src/profile/profileModel';
import { buildReport, reportTotals, ReportSources, datesFor } from '../src/reports/reportModel';
import { completeToday, newState, startToday } from '../src/quran/hifz/hifzEngine';
import { buildSchedule, DEFAULT_FOLLOW_UP, PRAYER_IDS, PrayerSettings, routeFor } from '../src/notifications/schedulePlan';

const date = '2026-10-25';
const time = (h: number) => new Date(date + `T${String(h).padStart(2,'0')}:00:00`);
const prayers = { dateStr: date, fajr: time(5), sunrise: time(6), dhuhr: time(12), asr: time(15), maghrib: time(18), isha: time(20) };
const settings: PrayerSettings = { enabled: true, perPrayer: Object.fromEntries(PRAYER_IDS.map(p => [p,{enabled:true,sound:true}])) as PrayerSettings['perPrayer'], preAlertMin: 0, followUp:true, followUpMin:{...DEFAULT_FOLLOW_UP},quietEnabled:true,quietStart:'23:00',quietEnd:'04:30' };
const empty = (): ReportSources => ({checkins:{},restDays:[],athkar:{},readDays:{},listening:{},hifz:null,plans:[],logs:{}});

test('Listening credits actual playback and excludes pause, buffering and forward/backward seeks', () => {
 const previous={position:10,at:10000,playing:true};
 assert.equal(playbackCredit(previous,{position:15,at:15000}),5);
 assert.equal(playbackCredit({...previous,playing:false},{position:15,at:15000}),0);
 assert.equal(playbackCredit(previous,{position:10,at:15000}),0);
 assert.equal(playbackCredit(previous,{position:25,at:11000}),0);
 assert.equal(playbackCredit(previous,{position:0,at:15000}),0);
 assert.equal(playbackCredit(previous,{position:15,at:15000},true),0);
 assert.equal(playbackCredit(previous,{position:610,at:610000}),600,'background playback reconciles position against wall time');
});
test('Listening splits correctly at local midnight', () => {
 const result=splitPlayback(10,new Date('2026-10-26T00:00:05'));
 assert.equal(result['2026-10-25'],5);assert.equal(result['2026-10-26'],5);
});
test('Prayer counts exclude rest and none; duplicates remain a single canonical record', () => {
 const records:any={[`fajr_${date}`]:{status:'on_time'},[`dhuhr_${date}`]:{status:'rest'},[`asr_${date}`]:{status:'none'},[`isha_${date}`]:{status:'qada'}};
 assert.equal(prayerCount(records,date),2);assert.equal(prayerCount(records,date,true),1);
});
test('Reports use canonical data, unique pages and real listening even without habits', () => {
 const input=empty();
 input.checkins[`fajr_${date}`]={prayer:'fajr',dateStr:date,status:'on_time',mode:'jamaa',checkedInAt:time(5).toISOString(),pointsAwarded:10,xpAwarded:15};
 input.readDays[date]=[1,1,2];input.listening[date]=121;
 input.athkar[date]={morning:{counts:{},done:true,seconds:100}};
 const h=newState({start:{s:114,a:1},order:'juzAmma',perDay:1});h.items['114:1']={box:0,due:date,lapses:0,learnedOn:date};h.reviewed={[date]:2};input.hifz=h;
 const totals=reportTotals(buildReport(input,[date],time(13),prayers));
 assert.equal(totals.prayers,1);assert.equal(totals.due,2);assert.equal(totals.pages,2);assert.equal(totals.listenSeconds,121);assert.equal(totals.morning,1);assert.equal(totals.learned,1);assert.equal(totals.reviewed,2);assert.equal(totals.habitsTotal,0);
});
test('Reports exclude rest days from prayer denominator and never fabricate empty activity', () => {
 const data=empty();data.restDays=[date];
 const rows=buildReport(data,[date],time(23),prayers);
 assert.equal(rows[0].due,0);assert.equal(rows[0].active,false);assert.equal(reportTotals(rows).activeDays,0);
 assert.deepEqual(datesFor('2026-03-01',2),['2026-02-28','2026-03-01']);
});
test('Reports respect habit creation date, weekly due date and avoid counting prayer habits twice', () => {
 const data=empty();const base:any={target:1,gradual:false,frequency:'daily',createdAt:'2026-10-25T09:00:00',unit:'مرة',category:'الخير',title:'خير'};
 data.plans=[{...base,id:'prayer',kind:'prayers'},{...base,id:'custom'}];
 data.logs[date]={custom:1,prayer:5};
 const rows=buildReport(data,['2026-10-24',date],time(23),prayers);
 assert.equal(rows[0].habitsTotal,0);assert.equal(rows[1].habitsTotal,1);assert.equal(rows[1].habitsDone,1);
});
test('Prayer reminder phases can be configured independently for each prayer', () => {
 const config={...settings,perPrayer:{...settings.perPrayer,fajr:{enabled:true,sound:true,athanEnabled:false}},preAlertByPrayer:{fajr:10},followUpMin:{...DEFAULT_FOLLOW_UP,fajr:45,maghrib:0}};
 const plan=buildSchedule({now:time(0),days:[prayers],prayer:config,plans:[],logs:{},checkins:{},restDays:[]});
 assert.equal(plan.find(n=>n.id===`pre:${date}:fajr`)?.at.getTime(),time(5).getTime()-600000);
 assert.equal(plan.some(n=>n.id===`athan:${date}:fajr`),false);
 assert.equal(plan.find(n=>n.id===`pfu:${date}:fajr`)?.at.getTime(),time(5).getTime()+45*60000);
 assert.equal(plan.some(n=>n.id===`pfu:${date}:maghrib`),false);
 assert.deepEqual(routeFor({type:'habit',planId:'quran_listen',kind:'count'}),{screen:'QuranReader'});
});
test('Completed prayer suppresses follow-up but keeps its adhan; rest day suppresses prayer plan', () => {
 const input={now:time(0),days:[prayers],prayer:settings,plans:[],logs:{},checkins:{[`fajr_${date}`]:{status:'qada'}},restDays:[]};
 const plan=buildSchedule(input);assert.ok(plan.some(n=>n.id===`athan:${date}:fajr`));assert.ok(!plan.some(n=>n.id===`pfu:${date}:fajr`));
 assert.equal(buildSchedule({...input,restDays:[date]}).length,0);
 assert.equal(buildSchedule({...input,prayer:{...settings,enabled:false}}).length,0);
});
test('Hifz never awards empty or non-finite tests and repeated passes never add verses twice', () => {
 const lengths=Array(114).fill(7);let h=newState({start:{s:114,a:1},order:'juzAmma',perDay:1});
 assert.equal(completeToday(h,date,1,lengths).passed,false);
 h=startToday(h,date,['114:1']);assert.equal(completeToday(h,date,NaN,lengths).learned,0);
 const result=completeToday(h,date,1,lengths);assert.equal(result.learned,1);assert.equal(completeToday(result.state,date,1,lengths).learned,0);
});
test('Profile validates trimmed names and requires a supported gender', () => {
 assert.equal(profileError('  أحمد  ','male'),null);assert.equal(profileError('مريم','female'),null);
 assert.ok(profileError(' ','male'));assert.ok(profileError('أحمد',''));assert.ok(profileError('a'.repeat(51),'male'));assert.ok(profileError('<script>','female'));
});


test('An imminent adhan is preserved by the planner instead of being dropped within five seconds', () => {
 const plan=buildSchedule({now:new Date(prayers.fajr.getTime()-1000),days:[prayers],prayer:settings,plans:[],logs:{},checkins:{},restDays:[]});
 assert.ok(plan.some(n=>n.id===`athan:${date}:fajr`));
});
