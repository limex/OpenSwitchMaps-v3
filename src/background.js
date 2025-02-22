const { isMatchingAMap } = require('./maps');

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (isMatchingAMap(tab.url)) {
      // Enable extension icon for the tab that matches a map
      chrome.action.enable(tabId);
    } else {
      // Disable extension icon for the tab that does not match a map
      chrome.action.disable(tabId);
    }
});
