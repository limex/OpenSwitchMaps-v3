import { filter, groupBy } from 'lodash-es';
import Vue from 'vue';
import Options from './Options.vue';

new Vue({
  render: h => h(Options)
}).$mount("#options");
