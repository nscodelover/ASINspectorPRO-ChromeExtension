jQuery(document).ready(function($){

    //Make request to get the HTML of the current tab
    chrome.tabs.executeScript(null, {file: "js/getPagesSource.js"}, function() {
        if (chrome.extension.lastError) {
            chrome.tabs.query({currentWindow: true, active: true}, function (tab) {
                chrome.tabs.update(tab.id, {url: 'http://www.amazon.com/'});
                terminalError('Please make your search on Amazon, then click on ASINspector button again')
                $('body, .error-message').css({height:'60px'});
            });
        }
    });

    //START PROGRAM
    chrome.extension.onMessage.addListener(function(request, sender) {

        if (request.action == "getSource") {

            chrome.tabs.query({active:true,currentWindow:true},function(tabArray){
                var source = request.source;
                var activeTab = tabArray[0].url;

                var domain = getDomain(activeTab);

                if (domain != 'amazon')
                {

                    if (domain == 'ebay' || domain == 'walmart' || domain == 'overstock' || domain == 'wayfair' || domain == 'kohls' || domain == 'target' || domain == 'toysrus' || domain == 'homedepot' ||  domain == 'asda' ||  domain == 'argos' ||  domain == 'pcworld')
                    {
                        var storage = setLocalStorage(source, activeTab);
                        if (storage)
                            window.open(chrome.extension.getURL("html/wait.html")+'?'+storage);
                    }
                    else
                    {
                        chrome.tabs.query({currentWindow: true, active: true}, function (tab) {
                            chrome.tabs.update(tab.id, {url: 'http://www.amazon.com/'});
                            terminalError('Please make your search on Amazon, then click on ASINspector button again')
                            $('body, .error-message').css({height:'60px'});
                        });
                    }
                }
                else
                {
                    var storage = setLocalStorage(source, activeTab);
                    if (storage)
                        window.open(chrome.extension.getURL("html/popup.html")+'?'+storage);
                }
            });

        }
    });
});
