var extend = require("xtend");

var cookieJar = {};

exports.setCookies = function(cookies) {
    if(!cookies || !Array.isArray(cookies)) return;

    cookies.forEach(function(cookieStr) {
        var splitted = cookieStr.split("=");
        cookieJar[splitted[0]] = splitted[1];
    });
};


exports.getCookiesString = function(cookies) {
    return Object.keys(cookieJar).map(function(key, index) {
       return key + "=" + cookieJar[key];
    }).join("; ");
};

var defaultHeaders = {
    "Accept"              : "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language"     : "nb,en-GB;q=0.8,en;q=0.6,en-US;q=0.4",
    "Cache-Control"       : "no-cache",
    "Connection"          : "keep-alive",
    "Host"                : "www.domeneshop.no",
    "Origin"              : "https://www.domeneshop.no",
    "Pragma"              : "no-cache",
    "Referer"             : "https://www.domeneshop.no/",
    "User-Agent"          : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36",
}

exports.getHeaders = function() {
    return extend(defaultHeaders, {"Cookie": exports.getCookiesString()});
};
