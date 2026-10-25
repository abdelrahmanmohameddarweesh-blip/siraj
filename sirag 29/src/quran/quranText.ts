// alquran.cloud prepends the basmala to verse 1 of every surah except al-Fatiha and at-Tawbah.
export const plain=(t:string)=>t.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'').replace(/\u0671/g,'\u0627');
export function splitBasmala(a:{text:string;numberInSurah:number;surah:{number:number}}):string{
 if(a.numberInSurah!==1||a.surah.number===1||a.surah.number===9)return a.text;
 const words=a.text.split(/\s+/);
 return plain(words.slice(0,4).join(' '))==='بسم الله الرحمن الرحيم'?words.slice(4).join(' '):a.text;
}
