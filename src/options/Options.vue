<template>
  <div>
    <section class="category-order" aria-label="Category order">
      <div ref="categoryCards" class="category-cards"
        @dragover.prevent="updateInsertion" @drop.prevent="dropCategory"
        @dragleave="leaveCards">
        <button
          v-for="category in categoryOrder"
          :key="category"
          type="button"
          class="category-card"
          :class="{ dragging: draggedCategory === category }"
          draggable="true"
          :aria-label="category + '. Use left or right arrow keys to reorder.'"
          @dragstart="startDrag(category, $event)"
          @dragend="endDrag"
          @keydown.left.prevent="moveCategory(category, -1)"
          @keydown.right.prevent="moveCategory(category, 1)"
        >{{ category }}</button>
        <span v-if="insertion" class="insertion-marker" aria-hidden="true"
          :style="{ left: insertion.x + 'px', top: insertion.y + 'px', height: insertion.height + 'px' }"></span>
      </div>
    </section>
    <hr>
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
            <img
              :src="'favicons/' + map.domain + '.png'"
              width="16"
              height="16"
              alt=""
              @error="useDefaultFavicon"
            >
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
import storage from './storage';
const { getMapMetadata, groupMapsByCategory } = require('../map-catalog');

export default {
  data() {
    return {
      draggedCategory: null,
      insertion: null,
      enabledMaps: storage.observableEnabledMaps,
    };
  },
  computed: {
    categoryOrder() {
      return storage.observablePreferences.categoryOrder;
    },
    columns() {
      return groupMapsByCategory(getMapMetadata(), this.categoryOrder);
    },
  },
  methods: {
    startDrag(category, event) {
      this.draggedCategory = category;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', category);
    },
    endDrag() {
      this.draggedCategory = null;
      this.insertion = null;
    },
    updateInsertion(event) {
      if (!this.draggedCategory) return;
      event.dataTransfer.dropEffect = 'move';
      const container = this.$refs.categoryCards;
      const bounds = container.getBoundingClientRect();
      const cards = Array.from(container.querySelectorAll('.category-card'))
        .map((card, index) => ({ index, rect: card.getBoundingClientRect() }));
      // Pick the nearest row first, then a boundary within that row. This also
      // accepts drops in the gaps and the empty space after a wrapped row.
      const nearest = cards.reduce((best, card) =>
        Math.abs(event.clientY - (card.rect.top + card.rect.height / 2)) <
        Math.abs(event.clientY - (best.rect.top + best.rect.height / 2)) ? card : best);
      const row = cards.filter(card => Math.abs(card.rect.top - nearest.rect.top) < 1);
      const next = row.find(card => event.clientX < card.rect.left + card.rect.width / 2);
      const anchor = next || row[row.length - 1];
      this.insertion = {
        index: anchor.index + (next ? 0 : 1),
        x: (next ? anchor.rect.left - 3 : anchor.rect.right + 3) - bounds.left,
        y: anchor.rect.top - bounds.top,
        height: anchor.rect.height,
      };
    },
    leaveCards(event) {
      if (!this.$refs.categoryCards.contains(event.relatedTarget)) this.insertion = null;
    },
    dropCategory(event) {
      this.updateInsertion(event);
      if (this.draggedCategory && this.insertion) {
        const from = this.categoryOrder.indexOf(this.draggedCategory);
        const to = this.insertion.index - (from < this.insertion.index ? 1 : 0);
        this.moveCategory(this.draggedCategory, to - from);
      }
      this.endDrag();
    },
    moveCategory(category, offset) {
      const order = this.categoryOrder.slice();
      const from = order.indexOf(category);
      const to = from + offset;
      if (from < 0 || to < 0 || to >= order.length || from === to) return;
      order.splice(from, 1);
      order.splice(to, 0, category);
      storage.setCategoryOrder(order);
    },
    useDefaultFavicon(event) {
      event.target.onerror = null;
      event.target.src = "favicons/default.svg";
    },
    setMapEnabled(map, enabled) {
      storage.setMapEnabled(map, enabled);
    },
  },
};
</script>

<style>
body {
  font-family: "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;
  font-size: 10pt;
}

.category-cards {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.category-card {
  font: inherit;
  white-space: nowrap;
  padding: 5px 9px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f5f5f5;
  color: #222;
  cursor: grab;
}

.category-card.dragging {
  opacity: 0.5;
}

.category-card:focus-visible {
  outline: 2px solid #3578b8;
  outline-offset: 1px;
}

.insertion-marker {
  position: absolute;
  width: 3px;
  margin-left: -1px;
  border-radius: 2px;
  background: #3578b8;
  pointer-events: none;
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
