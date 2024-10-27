<script>
import { computed } from 'vue'
import _ from 'lodash'
import browser from 'webextension-polyfill'
import { getLatLonZoom, getAllMaps } from '../maps'
import storage from '../options/storage'

export default {
  setup() {
    const columns = computed(() => {
      const enabledMaps = _.filter(
        getAllMaps(),
        (map) => storage.observableEnabledMaps[map.name]
      )
      return _.groupBy(enabledMaps, 'category')
    })

    async function openMapInCurrentTab(map) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [lat, lon, zoom] = getLatLonZoom(tab.url);
        const mapUrl = map.getUrl(lat, lon, zoom);
        const code = `window.location.href = ${JSON.stringify(mapUrl)};`;
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (code) => { eval(code); },
          args: [code]
        });
        window.close();
      } catch (error) {
        console.error('Error opening map:', error);
      }
    }

    async function openMapInOtherTab(map) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [lat, lon, zoom] = getLatLonZoom(tab.url);
        const mapUrl = map.getUrl(lat, lon, zoom);
        const code = `window.open(${JSON.stringify(mapUrl)});`;
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (code) => { eval(code); },
          args: [code]
        });
        window.close();
      } catch (error) {
        console.error('Error opening map:', error);
      }
    }

    async function open(map, getCode) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [lat, lon, zoom] = getLatLonZoom(tab.url);
        const mapUrl = map.getUrl(lat, lon, zoom);
        const code = getCode(mapUrl);
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (code) => { eval(code); },
          args: [code]
        });
        window.close();
      } catch (error) {
        console.error('Error opening map:', error);
      }
    }

    function openOptionsPage() {
      browser.runtime.openOptionsPage()
    }

    return {
      columns,
      openMapInCurrentTab,
      openMapInOtherTab,
      openOptionsPage
    }
  }
}
</script>

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
              :src="'https://www.google.com/s2/favicons?domain=' + map.domain"
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

<style>
body {
  font-family: "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;
  font-size: 10pt;
  display: table;
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
  min-width: 820px;
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
  display: inline-table;
  vertical-align: top;
  white-space: nowrap;
  width: 150px;
  /* float:left; */
  /* clear:both; */
  overflow: hidden;
}

#mapmenu {
  display: contents;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  /* width: 450px;
  column-count: 3;
  display:flex;
  flex-direction: row;
  flex-wrap: wrap;
  flex-flow: 3 wrap; */
}

.tooltip {
  display: inherit;
}


.tooltip .tooltiptext {
  visibility: hidden;
  /* width: 120px; */
  background-color: rgba(0, 0, 0, 0.671);
  color: #fff;
  text-align: center;
  border-radius: 2px;
  padding: 2px 2px;

  /* Position the tooltip */
  white-space: normal;
  width: 0px;
  position: absolute;
  z-index: 10;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
  width: 100px;
}
</style>

