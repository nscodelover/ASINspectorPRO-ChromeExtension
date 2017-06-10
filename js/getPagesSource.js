chrome.extension.sendMessage({
    action: "getSource",
    //source: DOMtoString(document);
    source: document.getElementsByTagName('html')[0].innerHTML
});