import test from 'node:test';
import assert from 'node:assert';
import { nudgeLabel } from '../src/oasis/oasisStatus';

test('Home badge: new rewards come first, then seeds to plant, then water', () => {
  const base = { newRewards: 0, seeds: 0, drops: 0, canPlant: false, canWater: false };
  assert.strictEqual(nudgeLabel(base), null);
  assert.strictEqual(nudgeLabel({ ...base, newRewards: 2, canPlant: true, seeds: 1 }), 'مكافآت جديدة بانتظارك ✨');
  assert.strictEqual(nudgeLabel({ ...base, canPlant: true, seeds: 1 }), 'لديك بذرة جديدة 🌱');
  assert.strictEqual(nudgeLabel({ ...base, canPlant: true, seeds: 2 }), 'لديك بذرتان 🌱');
  assert.strictEqual(nudgeLabel({ ...base, canWater: true, drops: 3 }), 'لديك ماء لنبتاتك 💧');
});
