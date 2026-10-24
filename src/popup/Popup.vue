<template>
  <div id="mapmenu">
    <span class="options-link" @click="openOptionsPage">⚙</span>
    <div v-for="(maps, columnName) in columns" :key="columnName" class="map">
      <p class="title">{{ columnName }}</p>
      <p
        v-for="map in maps"
        class="column"
        :key="map.name"
        @click.middle="openMapInCurrentTab(map)"
        @click.left="openMapInOtherTab(map)"
      >
        <label class="maplabel">
          <div class="tooltip">
            <img
              :src="'favicons/' + map.domain + '.png'"
              width="16"
              height="16"
              alt=""
              @error="useDefaultFavicon"
            />
            <span class="tooltiptext">{{ map.description }}&nbsp;</span>
          </div>
          <div class="tooltip">
            {{ map.name }}
            <span class="tooltiptext">{{ map.description }}&nbsp;</span>
          </div>
        </label>
      </p>
    </div>
  </div>
</template>
<script>
const { groupMapsByCategory } = require('../map-catalog');
const { getLatLonZoom, getAllMaps } = require("../maps");
const storage = require("../options/storage");

module.exports = {
  computed: {
    columns() {
      const enabledMaps = getAllMaps().filter(
        (map) => storage.observableEnabledMaps[map.name]
      );
      return groupMapsByCategory(enabledMaps, storage.observablePreferences.categoryOrder);
    },
  },
  methods: {
    useDefaultFavicon(event) {
      event.target.onerror = null;
      event.target.src = "favicons/default.svg";
    },
    openMapInCurrentTab(map) {
      this.open(map, (mapUrl, tab) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (url) => { window.location.href = url; },
          args: [mapUrl]
        });
      });
    },
    openMapInOtherTab(map) {
      this.open(map, (mapUrl, tab) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (url) => { window.open(url); },
          args: [mapUrl]
        });
      });
    },
    open(map, executeScript) {
      chrome.tabs.query(
        {
          active: true,
          currentWindow: true,
        },
        function(tabs) {
          const tab = tabs[0];
          const [lat, lon, zoom] = getLatLonZoom(tab.url);
          const mapUrl = map.getUrl(lat, lon, zoom);
          executeScript(mapUrl, tab);
          window.close();
        }
      );
    },
    openOptionsPage() {
      chrome.runtime.openOptionsPage();
    },
  },
};
</script>
<style>
body {
  width: 800px;
  max-width: 100%;
  font-family: "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;
  font-size: 10pt;
  padding: 0;
  margin: 0;
}

p.column {
  padding: 2px;
  margin: 2px;
}

p.column img {
  vertical-align: text-bottom;
  margin-right: 5px;
}

p.column:hover {
  cursor: pointer;
  background-color: #eee;
}

.title,
.options-link {
  background-color: #eee;
  font-weight: bold;
  font-size: larger;
  text-align: center;
  padding: 5px;
  margin: 0;
}

.map {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.title {
  grid-column: 1 / -1;
}

.options-link {
  position: fixed;
  top: 0;
  right: 0;
  text-decoration: none;
  font-size: x-large;
  padding: 0px;
  padding-right: 6px;
}

.options-link:hover {
  cursor: pointer;
}


.column {
  min-width: 0;
  overflow-wrap: anywhere;
}

.maplabel {
  display: flex;
  align-items: flex-start;
}

.maplabel > .tooltip:first-child {
  flex-shrink: 0;
}

#mapmenu {
  display: contents;
}

.tooltip {
  position: relative;
}


.tooltip .tooltiptext {
  display: none;
  background-color: rgba(0, 0, 0, 0.671);
  color: #fff;
  text-align: center;
  border-radius: 2px;
  padding: 2px 2px;

  /* Position the tooltip */
  white-space: normal;
  width: 100px;
  position: absolute;
  left: 0;
  top: 100%;
  z-index: 10;
}

.column:nth-child(5n + 1) .tooltiptext {
  left: auto;
  right: 0;
}

.tooltip:hover .tooltiptext {
  display: block;
}
</style>
