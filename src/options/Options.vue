<template>
  <div>
    <div
      v-for="(maps, columnName) in columns"
      :key="columnName"
      class="map"
    >
      <p class="title">{{ columnName }}</p>
      <p
        v-for="map in maps"
        class="column"
        :key="map.name"
      >
        <label>
          <input
            type="checkbox"
            :checked="enabledMaps[map.name]"
            @change="setMapEnabled(map, $event.target.checked)"
          >
          <div class="tooltip">
            <img :src="'https://www.google.com/s2/favicons?domain=' + map.domain">
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
import { groupBy } from 'lodash-es';
import storage from './storage';
import { getAllMaps } from '../maps';

export default {
  data() {
    return {
      columns: groupBy(getAllMaps(), 'category'),
      enabledMaps: storage.observableEnabledMaps,
    };
  },
  methods: {
    setMapEnabled(map, enabled) {
      storage.setMapEnabled(map, enabled);
    },
  },
  mounted() {
    chrome.storage.local.get(['key'], (result) => {
      const value = result.key || 'default_value'; // Replace 'default_value' with the actual default value or logic

      chrome.storage.local.set({ key: value }, () => {
        console.log('Value is set to ' + value);
      });
    });
  },
};
</script>

<style>
body {
  font-family: "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;
  font-size: 10pt;
}

p.column {
  padding: 2px;
  margin: 2px;
}

.map {
  min-width: 800px;
}

.maps {
  display: table;
}

.map img {
  vertical-align: text-bottom;
  margin-right: 5px;
}

.map input {
  vertical-align: middle;
}

.title {
  font-weight: bold;
  font-size: larger;
  text-align: center;
}

.column {
  display: inline-table;
  white-space: nowrap;
}

.tooltip {
  display: inherit;
}

.tooltip .tooltiptext {
  visibility: hidden;
  background-color: rgba(0, 0, 0, 0.671);
  color: #fff;
  text-align: center;
  border-radius: 2px;
  padding: 2px 2px;
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
