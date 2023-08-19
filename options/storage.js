import { storage as _storage } from "webextension-polyfill";
import { map as _map, zipObject, extend } from 'lodash';
import 'vue';
import '../maps';

const storage = _storage;
const storageArea = storage.sync || storage.local;

const mapNames = _map(getAllMaps(), 'name');

const mapChecks = _map(getAllMaps(), function (map){
	if ('default_check' in map) {
		return map['default_check'];
	} else {
		return true;
	};
});
const enabledMaps = vue.observable(zipObject(mapNames, mapChecks));

init();

export default {
  init,
  observableEnabledMaps: enabledMaps,
  setMapEnabled,
};

function init() {
  storageArea.get('enabledMaps').then((stored) => {
    extend(enabledMaps, stored.enabledMaps);
  });
  storage.onChanged.addListener(onChanged);
}

function setMapEnabled(map, enabled) {
  enabledMaps[map.name] = enabled;
  storageArea.set({enabledMaps});
}

function onChanged(changes) {
  extend(enabledMaps, changes.enabledMaps.newValue);
}
