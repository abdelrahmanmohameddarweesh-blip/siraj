import test from 'node:test';
import assert from 'node:assert/strict';
import { createJsonStore } from '../src/storage/createJsonStore';

test('Concurrent activity updates never lose increments or other days', async () => {
 const map=new Map<string,string>();
 const store=createJsonStore({getItem:async key=>map.get(key)??null,setItem:async(key,value)=>{await Promise.resolve();map.set(key,value);}});
 await store.updateJSON('logs',{},()=>({'2026-10-24':1}));
 await Promise.all(Array.from({length:50},()=>store.updateJSON<Record<string,number>>('logs',{},previous=>({...previous,'2026-10-25':(previous['2026-10-25']||0)+1}))));
 assert.deepEqual(await store.readJSON('logs',{}),{'2026-10-24':1,'2026-10-25':50});
});
test('Persistence errors surface to the caller and later writes can recover', async () => {
 let fail=true;let raw:string|null=null;
 const store=createJsonStore({getItem:async()=>raw,setItem:async(_key,value)=>{if(fail)throw Error('disk full');raw=value;}});
 await assert.rejects(store.updateJSON('activity',0,n=>n+1),/disk full/);
 fail=false;await store.updateJSON('activity',0,n=>n+1);
 assert.equal(await store.readJSON('activity',0),1);
});
test('Corrupt saved data fails visibly rather than silently overwriting a user history', async () => {
 let writes=0;
 const store=createJsonStore({getItem:async()=>'{broken',setItem:async()=>{writes++;}});
 await assert.rejects(store.updateJSON('history',{},()=>({})),SyntaxError);
 assert.equal(writes,0);
});
