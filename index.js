var Promise = require("bluebird");

var psl = require("psl");
var utils = require("./utils");
var domeneshop = require("./domeneshop");

var checkIpAddressForDomain = function(domain) {
    return Promise.all([
        utils.lookupDNS(fulldomain),
        utils.lookupIPaddress()
    ]).then(function(ips) {
        return ips[0] === ips[1];
    });
};


exports.verifyDomains = function(domains) {

    if(typeof domains === "string" || !Array.isArray(domains)) {
        throw "domains must be string or array of strings";
    }

    if(!Array.isArray(domains)) {
        domains = [domains];
    }

    domains.map(function(domain) {
        return checkIpAddressForDomain(domain);
    }).filter(function() {
        console.log(arguments);
    });

};

console.log("Finding current ip address");



Promise.all([
    utils.lookupDNS(fulldomain),
    utils.lookupIPaddress()
]).then(function(ips) {
    if(ips[0] === ips[1]) {
        console.log("Everything is ey ok!")
    } else {
        console.log("Your ip has changed, updating the records")
        return domeneshop.login()
            .then(domeneshop.getDomains)
            .then(function(links){
                var domain = psl.parse(fulldomain).domain;
                // TODO: map each domain to change
                if(links[domain]) {
                    return domeneshop.updateSubdomain(links[domain], fulldomain, "balle.no");
                }
            });
    }
});
