import browser from 'webextension-polyfill';
import _ from 'lodash';
import { reactive } from 'vue';
import { getAllMaps } from '../maps';

const storage = browser.storage;
const storageArea = storage.sync || storage.local;

const mapNames = _.map(getAllMaps(), 'name');

const mapChecks = _.map(getAllMaps(), function (map) {
	if ('default_check' in map) {
		return map['default_check'];
	} else {
		return true;
	}
});

const enabledMaps = reactive(_.zipObject(mapNames, mapChecks));

init();

export default {
	init,
	observableEnabledMaps: enabledMaps,
	setMapEnabled,
};

function init() {
	storageArea.get('enabledMaps').then((stored) => {
		_.extend(enabledMaps, stored.enabledMaps);
	});
	storage.onChanged.addListener(onChanged);
}

function setMapEnabled(map, enabled) {
	enabledMaps[map.name] = enabled;
	storageArea.set({ enabledMaps });
}

function onChanged(changes) {
	_.extend(enabledMaps, changes.enabledMaps.newValue);
}
