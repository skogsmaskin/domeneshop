var Promise = require("bluebird");
var psl = require("psl");

var utils = require("./utils");
var domeneshop = require("./domeneshop");
var processedDomains = require("./processed");

var getUnique = function(value, index, self) {
    return self.indexOf(value) === index;
};

var getCurrentIPAdress = function() {
    return utils.lookupIPaddress();
};

var checkIpAddressForDomain = function(currentIP, domain) {
    return utils.lookupDNS(domain).then(function(domainIP) {
        return [domain, currentIP === domainIP];
    });
};

var getMainDomains = function(domains) {
    return domains.map(psl.parse)
                  .map(function(a) {return a.domain})
                  .filter(getUnique);
};

var filterDomainsInRegiser = function(register) {
    return function(domain) {
        if(register[domain]) {
            return true;
        } else {
            console.log(domain + " is not in your Domeneshop register");
            return false;
        }
    };
};

var updateSubDomainsForDomain = function(domainsToBeUpdated, ip) {
    return function(subDomainsSettings) {
        var updateSettings = domainsToBeUpdated.filter(function(domain) {
            return subDomainsSettings.hasOwnProperty(domain);
        }).map(function(domain) {
            var settings = subDomainsSettings[domain];
            settings.data = ip;
            return [domain, settings];
        });

        return Promise.map(updateSettings, function(toBeUpdated) {
            var domain  = toBeUpdated[0];
            var setting = toBeUpdated[1];

            var url = setting.updateUrl;
            delete setting.updateUrl;

            processedDomains.add(domain);
            return domeneshop.updateSubdomain(url, setting);
        }).all();
    }
};

module.exports = function(username, password, domains) {

    if(typeof domains === "string" || !Array.isArray(domains)) {
        throw "domains must be string or array of strings";
    }

    if(!Array.isArray(domains)) {
        domains = [domains];
    }


    console.log("Verifying ip addresses");
    getCurrentIPAdress().then(function(currentIP) {

        return Promise.map(domains, function(domain) {
            return checkIpAddressForDomain(currentIP, domain);

        }).filter(function(isMatching) {
            return !isMatching[1];

        }).then(function(notMatchingDomains) {
            var processed = processedDomains.get();
            notMatchingDomains = notMatchingDomains.filter(function(domain) {
                return processed.indexOf(domain[0]) === -1;
            });

            if(notMatchingDomains.length === 0) {
                console.log("All domains are up to date");
                return;
            }

            var domains = notMatchingDomains.map(function(a) {return a[0]});

            console.log("");
            console.log("The following domains needs updating:");
            domains.forEach(function(a) {console.log(a);});
            console.log("");

            return domeneshop.login({
                password: password,
                username: username
            })
             .then(domeneshop.getDomains)
             .then(function(domainsInRegister) {

                var mainDomains = getMainDomains(domains);

                return Promise
                 .filter(mainDomains, filterDomainsInRegiser(domainsInRegister))
                 .map(function(mainDomain) {
                    return domeneshop.getSubdomains(domainsInRegister[mainDomain]);
                 })
                 .each(updateSubDomainsForDomain(domains, currentIP));
            });

        });

    })
    .then(processedDomains.write)
    .always(domeneshop.logout)
    .done(function() {
        console.log("Done!");
    }, function(error) {
        throw error;
    });

};
