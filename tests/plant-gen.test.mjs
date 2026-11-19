import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPECIES } from '../src/data/species.js';
import { plantSVG } from '../src/scene/plant-gen.js';

test('every species draws at growth 0, 0.5 and 1 without NaN', () => {
  for (const sp of SPECIES) {
    for (const g of [0, 0.1, 0.3, 0.5, 0.85, 0.95, 1]) {
      const svg = plantSVG(sp, g, 7);
      assert.ok(svg.startsWith('<g') && svg.endsWith('</g>'), sp.id);
      assert.ok(!/NaN|undefined|Infinity/.test(svg), `${sp.id} @${g}: ${svg.slice(0, 120)}`);
    }
  }
});

test('the same seed redraws identically', () => {
  assert.equal(plantSVG(SPECIES[0], 0.7, 3), plantSVG(SPECIES[0], 0.7, 3));
});

test('every species has a fact and unique id', () => {
  const ids = new Set();
  for (const sp of SPECIES) {
    assert.ok(sp.fact.length > 20, sp.id);
    assert.ok(!ids.has(sp.id));
    ids.add(sp.id);
  }
});
