// UI metadata only: importing this module must not load URL converters or proj4.
const metadata = require('./map-metadata.json');
const maps = metadata.slice().sort((a, b) => {
  const left = a.name.toLowerCase();
  const right = b.name.toLowerCase();
  return left < right ? -1 : left > right ? 1 : 0;
});

function getMapMetadata() {
  return maps;
}

function groupMapsByCategory(maps) {
  return maps.reduce((groups, map) => {
    (groups[map.category] || (groups[map.category] = [])).push(map);
    return groups;
  }, {});
}

module.exports = { getMapMetadata, groupMapsByCategory };
