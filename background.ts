// import isMatchingAMap from './maps';
import 'chrome';

function isMatchingAMap(url: string):boolean {
  throw new Error('Function not implemented.');
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (isMatchingAMap(tab.url)) {
    chrome.pageAction.show(tabId);
  } else {
    chrome.pageAction.hide(tabId);
  }
});

