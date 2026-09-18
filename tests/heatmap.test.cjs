const {test} = require('node:test');
const assert = require('node:assert/strict');
const {parseDay, summarize} = require('../assets/heatmap.js');
const record = (date, url='/thoughts/a/') => ({date, url, title:'A'});
test('rejects invalid dates and accepts leap day', () => {
  for (const day of ['2025-02-29','2026-02-30','2026-13-01','2026-9-18','']) assert.equal(parseDay(day), null);
  assert.notEqual(parseDay('2024-02-29'), null);
});
test('empty site has exactly 365 days and no invented activity', () => {
  const d=summarize([], '2026-09-18');
  assert.equal(d.days.length,365); assert.equal(d.total,0); assert.equal(d.active,0);
  assert.equal(d.days[0].date,'2025-09-19'); assert.equal(d.days.at(-1).date,'2026-09-18');
  assert.equal(d.offset,5);
});
test('includes range boundaries but excludes old and future records', () => {
  const d=summarize([record('2025-09-18','/a/'),record('2025-09-19','/b/'),record('2026-09-18','/c/'),record('2026-09-19','/d/')], '2026-09-18');
  assert.equal(d.total,2); assert.equal(d.active,2);
});
test('counts separate posts on same day but deduplicates same URL', () => {
  const d=summarize([record('2026-09-18'),record('2026-09-18'),record('2026-09-18','/novels/chapter-1/')],'2026-09-18');
  assert.equal(d.total,2); assert.equal(d.active,1);assert.equal(d.days.at(-1).records.length,2);
});
test('crosses leap day without date drift', () => {
  const d=summarize([record('2024-02-29')],'2024-03-01');
  assert.equal(d.days.length,365); assert.equal(d.days.at(-2).date,'2024-02-29'); assert.equal(d.total,1);
});
test('bad or contradictory source dates fail rather than show misleading totals', () => {
  assert.throws(()=>summarize([record('2026-02-30')],'2026-09-18'));
  assert.throws(()=>summarize([record('2026-09-17'),record('2026-09-18')],'2026-09-18'));
});
