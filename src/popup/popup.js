import { filter, groupBy } from 'lodash-es';
const Vue = require('vue').default;
const Popup = require('./Popup.vue');

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  new Vue(Popup).$mount('#popup');
});
