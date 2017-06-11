chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete') {
    execute(tabId);
  }
});

function execute(tabId) {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "storage") {
      var storedShows;
      chrome.storage.sync.get({shows: []}, function (result) {
        storedShows = result.shows;
        console.log(storedShows);
        sendResponse({storage: storedShows});
      });
      /* this piece of shit return is needed - headache:
      https://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent/20077854#20077854 */
      return true;
    }
  });

  console.log("Executing script..");
  chrome.tabs.executeScript(tabId, {file: "content.js"});
};