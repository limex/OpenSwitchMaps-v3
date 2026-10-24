const Vue = require('vue').default;
const { getMapMetadata } = require('../map-catalog');

const storage = chrome.storage;
const storageArea = storage.sync;

const enabledMaps = Vue.observable(Object.fromEntries(
  getMapMetadata().map((map) => [
    map.name, 'default_check' in map ? map.default_check : true,
  ])
));

init();

module.exports = {
  init,
  observableEnabledMaps: enabledMaps,
  setMapEnabled,
};

function init() {
  storageArea.get('enabledMaps', (stored) => {
    Object.assign(enabledMaps, stored.enabledMaps);
  });
  storage.onChanged.addListener(onChanged);
}

function setMapEnabled(map, enabled) {
  enabledMaps[map.name] = enabled;
  storageArea.set({enabledMaps}, () => {});
}

function onChanged(changes, areaName) {
  if (areaName === 'sync' && changes.enabledMaps && changes.enabledMaps.newValue) {
    Object.assign(enabledMaps, changes.enabledMaps.newValue);
  }
}
