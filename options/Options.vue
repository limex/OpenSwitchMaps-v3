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
          <div class="tooltip"> <img :src="'https://www.google.com/s2/favicons?domain=' + map.domain">
            <span class="tooltiptext">{{ map.description }}&nbsp;</span>
          </div>
          <div class="tooltip"> {{ map.name }} 
            <span class="tooltiptext">{{ map.description }}&nbsp;</span>
          </div>
        </label>
      </p>
    </div>
  </div>
</template>
<script>
import { groupBy } from 'lodash';
import './storage';
import '../maps';

export function data() {
  return {
    columns: groupBy(getAllMaps(), 'category'),
    enabledMaps: observableEnabledMaps,
  };
}
export const methods={
  setMapEnabled(map, enabled) {
    _setMapEnabled(map, enabled);
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
  /* width: 120px; */
  background-color: rgba(0, 0, 0, 0.671);
  color: #fff;
  text-align: center;
  border-radius: 2px;
  padding: 2px 2px;

  /* Position the tooltip */
  white-space:normal; 
  width: 0px;
  position: absolute;
  z-index: 10;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
  width: 100px;
}

</style>
