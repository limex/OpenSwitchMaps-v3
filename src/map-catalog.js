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

function groupMapsByCategory(maps, order) {
  const groups = maps.reduce((groups, map) => {
    (groups[map.category] || (groups[map.category] = [])).push(map);
    return groups;
  }, {});
  if (!order) return groups;
  return Object.fromEntries(normalizeCategoryOrder(order)
    .filter(category => groups[category])
    .map(category => [category, groups[category]]));
}

const categories = [...new Set(maps.map(map => map.category))];

function normalizeCategoryOrder(order) {
  const known = Array.isArray(order) ? order.filter(category => categories.includes(category)) : [];
  return [...new Set([...known, ...categories])];
}

module.exports = { getMapMetadata, groupMapsByCategory, normalizeCategoryOrder };
