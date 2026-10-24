const Vue = require('vue').default;
const { getMapMetadata, normalizeCategoryOrder } = require('../map-catalog');

const storage = chrome.storage;
const storageArea = storage.sync;
const preferences = Vue.observable({categoryOrder: normalizeCategoryOrder()});

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
  observablePreferences: preferences,
  setCategoryOrder,
};

function init() {
  storageArea.get(['enabledMaps', 'categoryOrder'], (stored) => {
    Object.assign(enabledMaps, stored.enabledMaps);
    applyCategoryOrder(stored.categoryOrder);
  });
  storage.onChanged.addListener(onChanged);
}

function setMapEnabled(map, enabled) {
  enabledMaps[map.name] = enabled;
  storageArea.set({enabledMaps}, () => {});
}

function applyCategoryOrder(order) {
  preferences.categoryOrder = normalizeCategoryOrder(order);
}

function setCategoryOrder(order) {
  applyCategoryOrder(order);
  storageArea.set({categoryOrder: preferences.categoryOrder.slice()}, () => {});
}

function onChanged(changes, areaName) {
  if (areaName === 'sync' && changes.categoryOrder) {
    applyCategoryOrder(changes.categoryOrder.newValue);
  }
  if (areaName === 'sync' && changes.enabledMaps && changes.enabledMaps.newValue) {
    Object.assign(enabledMaps, changes.enabledMaps.newValue);
  }
}
