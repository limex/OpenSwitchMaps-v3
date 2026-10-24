const assert = require('node:assert/strict');
const { test, after } = require('node:test');
const { mkdirSync, mkdtempSync, rmSync } = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

// Compile the real map module with the project's existing build tool.
// Keep the temporary bundle in the repository so Node resolves its dependencies.
const root = path.resolve(__dirname, '..');
mkdirSync(path.join(root, '.cache'), { recursive: true });
const output = mkdtempSync(path.join(root, '.cache', 'roundtrips-'));
after(() => rmSync(output, { recursive: true, force: true }));
execFileSync(path.join(root, 'node_modules/.bin/parcel'), [
  'build', 'src/maps.js', '--target', 'node', '--out-dir', output,
  '--no-cache', '--no-source-maps',
], { cwd: root, stdio: 'pipe' });
global.chrome = { tabs: { query: (_query, callback) => callback([]) } };
const { getAllMaps, getLatLonZoom, isMatchingAMap } = require(path.join(output, 'maps.js'));
const { getMapMetadata, groupMapsByCategory, normalizeCategoryOrder } = require('../src/map-catalog');
delete global.chrome;

const origin = 'https://bikerouter.de/#map=13/46.6478/12.1939/standard,mapterhorn-hillshading&profile=hiking-beta';
const expected = [46.6478, 12.1939, 13];
const destinations = {
  'Google Maps': 'https://www.google.com/maps/@46.6478,12.1939,13z',
  CamperMap: 'https://umap.openstreetmap.fr/en/map/campermap_514529#13/46.6478/12.1939',
};
function jump(url, name) {
  assert.ok(isMatchingAMap(url), `Unrecognized source: ${url}`);
  const coordinates = getLatLonZoom(url);
  assert.ok(coordinates, `Cannot read coordinates: ${url}`);
  const destination = getAllMaps().find(map => map.name === name);
  assert.ok(destination, `Missing map: ${name}`);
  return destination.getUrl(...coordinates);
}
function assertOrigin(url) {
  assert.deepEqual(getLatLonZoom(url)?.map(Number), expected,
    `Latitude, longitude and zoom must survive the round trip: ${url}`);
}

test('reads the supplied Bikerouter origin', () => assertOrigin(origin));
test('saved category orders tolerate stale entries and append new categories', () => {
  const defaults = Object.keys(groupMapsByCategory(getMapMetadata()));
  const last = defaults[defaults.length - 1];
  assert.deepEqual(normalizeCategoryOrder([last, 'Removed category', last]),
    [last, ...defaults.slice(0, -1)]);
  assert.deepEqual(normalizeCategoryOrder(null), defaults);
  assert.deepEqual(normalizeCategoryOrder('invalid'), defaults);
  const visible = getMapMetadata().filter(map => map.category !== last);
  const reversed = defaults.slice().reverse();
  assert.deepEqual(Object.keys(groupMapsByCategory(visible, reversed)),
    reversed.filter(category => category !== last));
});
test('the lightweight catalog and full map list have identical metadata and order', () => {
  const metadata = getMapMetadata();
  assert.equal(new Set(metadata.map(map => map.name)).size, metadata.length);
  assert.deepEqual(getAllMaps().map(({ getUrl, getLatLonZoom, ...map }) => {
    assert.equal(typeof getUrl, 'function', `Missing URL generator for ${map.name}`);
    return map;
  }), metadata);
  const categories = groupMapsByCategory(metadata);
  assert.deepEqual(Object.keys(categories), [...new Set(metadata.map(map => map.category))]);
  for (const [category, maps] of Object.entries(categories)) {
    assert.deepEqual(maps, metadata.filter(map => map.category === category));
  }
});
for (const [name, expectedUrl] of Object.entries(destinations)) {
  test(`Bikerouter → ${name} → Bikerouter preserves XYZ`, () => {
    const outbound = jump(origin, name);
    assert.equal(outbound, expectedUrl);
    assertOrigin(jump(outbound, 'Bikerouter'));
  });
}
test('Bikerouter → Google Maps → CamperMap → Bikerouter preserves XYZ', () => {
  const returned = ['Google Maps', 'CamperMap', 'Bikerouter']
    .reduce(jump, origin);
  assertOrigin(returned);
});
