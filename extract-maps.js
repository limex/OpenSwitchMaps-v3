/**
 * Script to extract map information from map-metadata.json and write to markdown
 */

const fs = require('fs');
const path = require('path');

// Read metadata without loading browser APIs or coordinate converters.
const maps = require('./src/map-metadata.json');

// Generate markdown content
let markdown = '# Maps List\n\n';
markdown += 'Extracted from OpenSwitchMaps map-metadata.json\n\n';

maps.forEach((map, index) => {
  const categoryName = map.category;
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
