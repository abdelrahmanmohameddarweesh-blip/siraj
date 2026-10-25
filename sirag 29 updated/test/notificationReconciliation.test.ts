import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileSchedule } from '../src/notifications/reconcileSchedule';
import type { Planned } from '../src/notifications/schedulePlan';
const request:Planned={id:'athan:2026-10-25:fajr',at:new Date('2026-10-25T05:00:00'),title:'الأذان',body:'حان وقت الفجر',channel:'athan',sound:'athan',data:{type:'prayer_athan',prayer:'fajr'}};
test('An unchanged pending adhan stays in the OS without cancellation or rescheduling',()=>{
 const previous=JSON.parse(JSON.stringify([request]));
 assert.deepEqual(reconcileSchedule(previous,[request],[request.id]),{cancel:[],schedule:[]});
});
test('Changing sound replaces the matching request and checking in removes only the follow-up',()=>{
 const followup:Planned={...request,id:'pfu:2026-10-25:fajr',channel:'checkin',sound:'default'};
 const silent:Planned={...request,sound:null,channel:'silent'};
 const diff=reconcileSchedule([request,followup],[silent],[request.id,followup.id]);
 assert.deepEqual(diff.cancel,[request.id,followup.id]);assert.deepEqual(diff.schedule,[silent]);
});
test('Lost OS requests are restored even if the previous saved plan matches',()=>{
 assert.deepEqual(reconcileSchedule([request],[request],[]),{cancel:[],schedule:[request]});
});
