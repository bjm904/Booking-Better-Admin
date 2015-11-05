chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  // dispatch based on command
  if (request.command == 'showCSV') {
    chrome.tabs.create({ 
      url: chrome.extension.getURL('viewer.html')
        + "?url=" + request.url
    });
  } else if (request.command == 'getData') {
    getData(request.url, sendResponse); 
    return true;
  }
});

function getData(url, cb) {
  // now load the CSV and display it
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    try {
      if (xhr.readyState === 4) {
        cb(xhr.responseText);
      }
    } catch (e) {
      console.log(e);
      console.error(e);
    }
  };
  xhr.open('GET', url, true);
  xhr.send();
}

function parseURLParams(url) {
    var queryStart = url.indexOf("?") + 1,
        queryEnd   = url.indexOf("#") + 1 || url.length + 1,
        query = url.slice(queryStart, queryEnd - 1),
        pairs = query.replace(/\+/g, " ").split("&"),
        parms = {}, i, n, v, nv;

    if (query === url || query === "") {
        return;
    }

    for (i = 0; i < pairs.length; i++) {
        nv = pairs[i].split("=");
        n = decodeURIComponent(nv[0]);
        v = decodeURIComponent(nv[1]);

        if (!parms.hasOwnProperty(n)) {
            parms[n] = [];
        }

        parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
}
function isSelectedProperty(){
	
}

chrome.pageAction.onClicked.addListener(function(tab){
	var GET=parseURLParams(tab.url);
	chrome.tabs.create({url:"main.html?ses="+GET.ses[0]+"&hotel_id="+GET.hotel_id[0]});
});

chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {
                        hostEquals: 'admin.booking.com',
						queryContains: 'hotel_id'
                    }
                })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});