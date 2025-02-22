import { filter, groupBy } from 'lodash-es';
const Vue = require('vue').default;
const Options = require('./Options.vue');

chrome.storage.local.get(['key'], (result) => {
  new Vue(Options).$mount('#options');
});

chrome.storage.local.set({ key: value }, () => {
  // ...existing code...
});
