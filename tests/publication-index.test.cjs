const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {build, output} = require('../scripts/build-publication-index.cjs');

test('committed publication index matches category entries and article bodies', () => {
  assert.equal(fs.readFileSync(output, 'utf8'), build());
});
