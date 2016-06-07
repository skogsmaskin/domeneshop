var Promise = require("bluebird");
var rp = require('request-promise');
var querystring = require("querystring");
var extend = require("xtend");
var headers = require("./headers");
var $ = require('cheerio');


exports.login = function(login) {

    return rp({
        uri: "https://www.domeneshop.no",
        headers: headers.getHeaders(),
        resolveWithFullResponse: true

    }).then(function(response) {
        headers.setCookies(response.headers["set-cookie"]);

        var loginData = querystring.stringify(login);

        return rp({
            uri: "https://www.domeneshop.no/admin",
            method : "POST",
            headers: extend(headers.getHeaders(), {
                "Referer": "https://www.domeneshop.no/",
                "Content-Length": loginData.length
            }),
            body: loginData
        });

    });
};

exports.logout = function() {
    return rp({
        uri: "https://www.domeneshop.no/logout",
        headers: extend(headers.getHeaders(), {
            "Referer": "https://www.domeneshop.no/"
        })
    });
};


exports.getDomains = function() {

    return rp({
        uri: "https://www.domeneshop.no/admin?view=domains",
        headers: extend(headers.getHeaders(), {
            "Referer": "https://www.domeneshop.no/admin"
        })
    }).then(function(response) {
        var links = $(response).find("a[href^='https://www.domeneshop.no/admin?id=']");

        var linksObj = {}
        links.each(function() {
            var $el = $(this);
            linksObj[$el.text()] = $el.attr("href");
        });
        return linksObj;
    })
};

exports.getSubdomains = function(uri) {

    return rp({
        uri: uri + "&edit=dns",
        headers: extend(headers.getHeaders(), {
            "Referer": "https://www.domeneshop.no/admin?view=domains"
        })
    }).then(function(response) {
        var cleanedHtml = response.replace(/<\/td>\s*<\/td>/gi, "");
        var trs = $(cleanedHtml).find("table.Admin tr")

        var obj = {};
        trs.each(function() {
            var formValues  = {updateUrl: uri + "&edit=dns", "modify.x": 5, "modify.y": 4};
            var $tr     = $(this);
            var url     = $tr.find("td").first().text().split("->")[0].trim();

            $tr.find("input").each(function() {
                var $input = $(this);
                var value = $input.val();

                if(value) {
                    formValues[$input.attr("name")] = $input.val();
                }
            });

            obj[url] = formValues
        });

        return obj;
    });
};

exports.updateSubdomain = function(uri, data) {
    var postData = querystring.stringify(data);

    return rp({
        uri: uri,
        method : "POST",
        headers: extend(headers.getHeaders(), {
            "Content-Length": postData.length,
            "Referer": uri
        }),
        body: postData
    });
};
