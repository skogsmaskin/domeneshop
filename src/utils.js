var Promise = require("bluebird");
var rp = require('request-promise');
var dns = require("dns");

exports.lookupDNS = function(domain) {
    return new Promise(function (resolve, reject) {
        dns.lookup(domain, 4, function(err, address, family) {
            if(err) {
                reject(err);
            } else {
                resolve(address);
            }
        });
    });
};

exports.lookupIPaddress = function() {
    return rp("https://api.ipify.org/?format=text").then(function(respose) {
        return respose.trim();
    });
};
