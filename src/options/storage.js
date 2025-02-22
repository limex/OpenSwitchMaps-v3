import { map, zipObject, extend } from 'lodash-es';
const Vue = require('vue').default;
const { getAllMaps } = require('../maps');

const storage = chrome.storage;
const storageArea = storage.sync || storage.local;

const mapNames = map(getAllMaps(), 'name');

const mapChecks = map(getAllMaps(), function (map){
	if ('default_check' in map) {
		return map['default_check'];
	} else {
		return true;
	};
});
const enabledMaps = Vue.observable(zipObject(mapNames, mapChecks));

init();

module.exports = {
  init,
  observableEnabledMaps: enabledMaps,
  setMapEnabled,
};

function init() {
  storageArea.get('enabledMaps', (stored) => {
    extend(enabledMaps, stored.enabledMaps);
  });
  storage.onChanged.addListener(onChanged);
}

function setMapEnabled(map, enabled) {
  enabledMaps[map.name] = enabled;
  storageArea.set({enabledMaps}, () => {});
}

function onChanged(changes) {
  extend(enabledMaps, changes.enabledMaps.newValue);
}
