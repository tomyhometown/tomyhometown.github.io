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
const {countWords, visibleDays, wordLevel, latestRecords} = require('../assets/heatmap.js');
test('mixed Chinese and English count excludes punctuation and whitespace', () => {
  assert.equal(countWords('你好，world! 你好。'),5);
  assert.equal(countWords('Hello world 2026'),3);
  assert.equal(countWords('你好world再见'),5);
  assert.equal(countWords(' \n，。!?'),0);
  assert.equal(countWords("don't re-read"),2);
});
test('mobile range changes while cumulative totals retain older publications', () => {
  const data=summarize([{...record('2024-01-01','/thoughts/old/'),words:200},{...record('2026-09-18'),words:100},{...record('2026-09-19','/thoughts/future/'),words:800}],'2026-09-18',180);
  assert.equal(data.days.length,180); assert.equal(data.total,1);
  assert.equal(data.allTotal,2); assert.equal(data.allWords,300); assert.equal(data.days.at(-1).words,100);
  assert.equal(visibleDays(390),180);assert.equal(visibleDays(480),270);assert.equal(visibleDays(800),365);
});
test('word intensity uses daily sum and duplicate entries do not inflate it', () => {
  const data=summarize([{...record('2026-09-18'),words:1300},{...record('2026-09-18'),words:1300},{...record('2026-09-18','/novels/b/'),words:900}],'2026-09-18');
  assert.equal(data.allWords,2200); assert.equal(data.days.at(-1).words,2200);
  assert.deepEqual([0,1,2000,2001,4000,4001,6001,8001].map(wordLevel),[0,1,1,2,2,3,4,5]);
});
test('latest publications are ordered by date and limited without mutating input', () => {
  const records = [record('2026-09-16','/a/'), {...record('2026-09-18','/c/'),title:'C'}, {...record('2026-09-18','/b/'),title:'B'}, record('2026-09-17','/d/')];
  const original = records.map(item => item.url);
  assert.deepEqual(latestRecords(records).map(item => item.url), ['/b/','/c/','/d/']);
  assert.deepEqual(records.map(item => item.url), original);
});
