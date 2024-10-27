import { isMatchingAMap } from './maps.js';

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && isMatchingAMap(tab.url)) {
    chrome.action.enable(tabId);
  } else {
    chrome.action.disable(tabId);
  }
});
