function invokeRequest(e, n, r, t) {
    randUser = arand(0, ak.length-1);

    var a = "http://webservices.amazon." + t + "/onca/xml?Service=AWSECommerceService",
        o = "&Timestamp=" + (new Date).toISOString(),
        s = "&AssociateTag=" + getAssociateTag(),
        e = "&Operation=" + e,
        n = "&ItemId=" + n,
        r = "&ResponseGroup=" + r,
        c = "&Version=2011-08-01",
        i = a + e + n + r + c + o + s,
        u = i.split("\n");
    i = "";
    for (var l in u) i += u[l];
    var d = new RegExp("^http:\\/\\/(.*)\\/onca\\/xml\\?(.*)$"),
        A = d.exec(i);
    if (null == A) return void alert("Could not find PA-API end-point in the URL. Please ensure the URL looks like the example provided.");
    var p = A[1].toLowerCase(),
        g = A[2],
        m = g.split("&");
    m = cleanupRequest(m), m = encodeNameValuePairs(m), m.sort();
    var f = m.join("&"),
        I = "GET\n" + p + "\n/onca/xml\n" + f,
        h = getSecretAccessKey(),
        v = sign(h, I),
        S = "http://" + p + "/onca/xml?" + f + "&Signature=" + v;
    return S
}

function encodeNameValuePairs(e) {
    for (var n = 0; n < e.length; n++) {
        var r = "",
            t = "",
            a = e[n],
            o = a.indexOf("="); - 1 == o ? r = a : 0 == o ? t = a : (r = a.substring(0, o), o < a.length - 1 && (t = a.substring(o + 1))), r = encodeURIComponent(decodeURIComponent(r)), t = t.replace(/\+/g, "%20"), t = encodeURIComponent(decodeURIComponent(t)), e[n] = r + "=" + t
    }
    return e
}

function cleanupRequest(e) {
    for (var n = !1, r = !1, t = getAccessKeyId(), a = e.length, o = 0; a > o;) {
        var s = e[o]; - 1 != s.search(/^Timestamp=/) ? n = !0 : -1 != s.search(/^(AWSAccessKeyId|SubscriptionId)=/) ? (e.splice(o, 1, "AWSAccessKeyId=" + t), r = !0) : -1 != s.search(/^Signature=/) && (e.splice(o, 1), o--, a--), o++
    }
    return n || e.push("Timestamp=" + getNowTimeStamp()), r || e.push("AWSAccessKeyId=" + t), e
}

function sign(e, n) {
    var r = str2binb(n),
        t = str2binb(e);
    t.length > 16 && (t = core_sha256(t, e.length * chrsz));
    for (var a = Array(16), o = Array(16), s = 0; 16 > s; s++) a[s] = 909522486 ^ t[s], o[s] = 1549556828 ^ t[s];
    var c = a.concat(r),
        i = core_sha256(c, 512 + n.length * chrsz),
        u = o.concat(i),
        l = core_sha256(u, 768),
        d = binb2b64(l),
        A = encodeURIComponent(d);
    return A
}

function addZero(e) {
    return (0 > e || e > 9 ? "" : "0") + e
}

function getNowTimeStamp() {
    var e = new Date,
        n = new Date(e.getTime() + 6e4 * e.getTimezoneOffset());
    return n.toISODate()
}

function getAccessKeyId() {
    return ak[randUser]
}

function getSecretAccessKey() {
    return sk[randUser]
}

function getAssociateTag() {
    return "f8n3ws0f-20"
}
var arand = function(e, n) {
    return e + Math.floor(Math.random() * (n - e))
}
var randUser = arand(0, 3);
var ak = ['AKIAJFXFDBSBZQP7CJ6A', 'AKIAI7JNJSWQ2HJWFDBA', 'AKIAIROV4NYLW6IUQDGA'];
var sk = ['zPGsRv1N7yiL10AEg/ryCMJeOceSeZflIRRS/VC9', 'yN82zTLj8ruwk9XBjtlf4xCoGfk2KC6ZAc2vDWZn', 'yR9oS6Qolwab+4TQyBiwceiAES91oJxLRYiwZ43n'];

var addSecrets = function(res) {
    var keys = atob(atob(res));
    keys = JSON.parse(keys);
    for (var x=0; x<keys.key.length; x++) {
        ak[ak.length] = keys.key[x][0];
        sk[sk.length] = keys.key[x][1];
    }
};

var xd = new Date();
var xhash = xd.getDate()+'9'+xd.getMonth();
xhash = btoa(btoa(xhash));

if (localStorage['api'] != xhash) {
    var jsonParameters = {};
    jsonParameters['hash'] = xhash;
    jsonParameters['keys'] = 1;
    $.post('http://asinspector.com/keyword/api/index.php', jsonParameters, function(res){
    //$.post('http://localhost/localhost/asinspector/keyword/api/index.php', jsonParameters, function(res){
        localStorage['api'] = xhash;
        localStorage['secret-api'] = res;
        addSecrets(res);
    });
} else {
    addSecrets(localStorage['secret-api']);
}
