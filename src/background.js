const { isMatchingAMap } = require('./maps');

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url) {
        const isMatch = isMatchingAMap(changeInfo.url);
        console.log('URL:', changeInfo.url,' -> isMatchingAMap:', isMatch);
        if (isMatch) {
            // Enable extension icon for the tab that matches a map
            chrome.action.enable(tabId);
            chrome.action.setIcon({ tabId, path: 'icon128.png' });
        } else {
            // Disable extension icon for the tab that does not match a map
            chrome.action.disable(tabId);
            // Change the extension icon for the tab that does not match a map
            chrome.action.setIcon({ tabId, path: 'icon128-no.png' });
        }
    }
});
