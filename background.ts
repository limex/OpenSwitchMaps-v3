// import isMatchingAMap from './maps';
import chrome from 'chrome';



chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (isMatchingAMap(tab.url)) {
    chrome.action.show(tabId);
  } else {
    chrome.action.hide(tabId);
  }
});
