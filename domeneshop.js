var Promise = require("bluebird");
var rp = require('request-promise');
var querystring = require("querystring");
var extend = require("xtend");
var headers = require("./headers");
var $ = require('cheerio');


var login = {
    username:"**********",
    password:"**********"
};


exports.login = function() {

    console.log("Logging in");

    return rp({
        uri: "https://www.domeneshop.no",
        headers: headers.getHeaders(),
        resolveWithFullResponse: true

    }).then(function(response) {
        headers.setCookies(response.headers["set-cookie"]);

        var loginData = querystring.stringify(login);

        return rp({
            uri: "https://www.domeneshop.no/admin.cgi",
            method : "POST",
            headers: extend(headers.getHeaders(), {
                "Referer": "https://www.domeneshop.no/",
                "Content-Length": loginData.length
            }),
            body: loginData
        });

    });
};

exports.getDomains = function() {

    console.log("getting domain info")

    return rp({
        uri: "https://www.domeneshop.no/admin.cgi?view=domains",
        headers: extend(headers.getHeaders(), {
            "Referer": "https://www.domeneshop.no/admin.cgi"
        })
    }).then(function(response) {

        var links = $(response).find("a[href^='https://www.domeneshop.no/admin.cgi?id=']");

        var linksObj = {}
        links.each(function() {
            var $el = $(this);
            linksObj[$el.text()] = $el.attr("href");
        });

        return linksObj;
    })
}

exports.updateSubdomain = function(uri, domains, ip) {

    console.log("updating subdomain");

    return rp({
        uri: uri + "&edit=dns",
        headers: extend(headers.getHeaders(), {
            "Referer": "https://www.domeneshop.no/admin.cgi?view=domains"
        })
    }).then(function(response) {
        var cleanedHtml = response.replace(/<\/td>\s*<\/td>/gi, "");
        var trs = $(cleanedHtml).find("table.Admin tr")

        var obj = {};
        trs.each(function() {
            var formValues  = {"modify.x": 5, "modify.y": 4}
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
    }).then(function(domainsSettings) {
        if(!Array.isArray(domains)) {
            domains = [domains];
        }

        return Promise.map(domains, function(domain) {
            var settings = domainsSettings[domain]
            if(!settings) {
                return;
            }
            settings.data = ip;

            var postData = querystring.stringify(settings);

            return rp({
                uri: uri + "&edit=dns",
                method : "POST",
                headers: extend(headers.getHeaders(), {
                    "Content-Length": postData.length,
                    "Referer": uri + "&edit=dns"
                }),
                body: postData
            });
        });
    });
};
