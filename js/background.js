var successURL = 'http://asinspector.com/licence/fb_login_success_v2.php';
var get_url_parameter=function (p_param,search)
    {
        return decodeURIComponent((new RegExp('[?|&]' + p_param + '=' + '([^&;]+?)(&|#|;|$)').exec(search)||[,""])[1].replace(/\+/g, '%20'))||null;
    }
    
function onFacebookLogin() {
//alert(localStorage.accessToken+" 1")
                if (!localStorage.accessToken) {
                    chrome.tabs.getAllInWindow(null, function(tabs) {
                        for (var i = 0; i < tabs.length; i++) {
                            if (tabs[i].url.indexOf(successURL) == 0) {
                                var params = tabs[i].url.split('#')[1];
                                access = params.split('&')[0]
                                console.log(access);
                                console.log(get_url_parameter('tabid',tabs[i].url));
                                localStorage.accessToken = access;
                                
                                chrome.tabs.reload(parseInt(get_url_parameter('tabid',tabs[i].url)))
                                
                                //chrome.tabs.onUpdated.removeListener(onFacebookLogin);
                                //alert(localStorage.accessToken+" 2")
                                //chrome.tabs.remove(tabs[i].id);
                                return;
                            }
                        }
                    });
                }
            }
            chrome.tabs.onUpdated.addListener(onFacebookLogin);  



chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.gethaspopup == 1) {
            sendResponse({hasPopup: localStorage['hasPopup']});
        }
    }
);
