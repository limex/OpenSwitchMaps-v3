/**
 * Script to extract map information from maps.js and write to markdown
 */

const fs = require('fs');
const path = require('path');

// Read the maps.js file
const mapsJsPath = path.join(__dirname, 'src', 'maps.js');
const mapsJsContent = fs.readFileSync(mapsJsPath, 'utf8');

// Extract the maps_raw array content
const mapsRawStart = mapsJsContent.indexOf('const maps_raw = [');
const mapsRawContent = mapsJsContent.slice(mapsRawStart);

// Split by object boundaries - each map object starts with "  {"
const objectBlocks = mapsRawContent.split(/\n  \{/).slice(1);

const maps = [];

for (const block of objectBlocks) {
  // Stop if we've reached the end of maps_raw
  if (block.includes('const maps = sortByKey')) break;

  // Extract name
  const nameMatch = block.match(/name:\s*"([^"]+)"/);
  if (!nameMatch) continue;

  // Extract category
  const categoryMatch = block.match(/category:\s*(\w+)/);

  // Extract domain
  const domainMatch = block.match(/domain:\s*"([^"]+)"/);

  // Extract description (optional)
  const descriptionMatch = block.match(/description:\s*"([^"]*)"/);

  maps.push({
    name: nameMatch[1],
    domain: domainMatch ? domainMatch[1] : '',
    description: descriptionMatch ? descriptionMatch[1] : '',
    category: categoryMatch ? categoryMatch[1] : ''
  });
}

// Map category variable names to their values
const categoryMap = {
  'CAMPER_CATEGORY': 'Camper',
  'CYCLING_CATEGORY': 'Cycling',
  'MISC_CATEGORY': 'Misc',
  'OSM_CATEGORY': 'OpenStreetMap',
  'OUTDOOR_CATEGORY': 'Outdoor',
  'POI_CATEGORY': 'POI',
  'ROUTER_CATEGORY': 'Router',
  'SATELLITE_CATEGORY': 'Satellite',
  'TOOLS_CATEGORY': 'Tools',
  'WEATHER_CATEGORY': 'Weather, Science',
  'WINTER_CATEGORY': 'Winter',
  'WATER_CATEGORY': 'Water'
};

// Generate markdown content
let markdown = '# Maps List\n\n';
markdown += 'Extracted from OpenSwitchMaps maps.js\n\n';

maps.forEach((map, index) => {
  const categoryName = categoryMap[map.category] || map.category;
  const domainLink = `[${map.domain}](https://${map.domain})`;
  const parts = [map.name, domainLink, categoryName];
  if (map.description) {
    parts.push(map.description);
  }
  markdown += `${index + 1}. ${parts.join(', ')}\n`;
});

markdown += `---\n\nTotal: ${maps.length} maps\n`;

// Write to markdown file
const outputPath = path.join(__dirname, 'maps-list.md');
fs.writeFileSync(outputPath, markdown, 'utf8');

console.log(`Extracted ${maps.length} maps to maps-list.md`);
