var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");

var writeFile = Promise.promisify(fs.writeFile);
var storePath = path.join(process.env["HOME"], ".domeneshop.json");

var UPDATE_TIME = 24 * 60 * 60 * 1000; // one day

var store = {processed:[]};
try {
    store = JSON.parse(fs.readFileSync(storePath, "utf-8"));
} catch (error) {}

// clean outdated changes
var now = Date.now();
store.processed = store.processed.filter(function(updated) {
    return updated.time + UPDATE_TIME > now;
});


exports.add = function(domain) {
    store.processed.push({time: Date.now(), domain: domain});
};

exports.write = function() {
    return writeFile(storePath, JSON.stringify(store), "utf-8");
};

exports.get = function(domain) {
    return store.processed.map(function(updated) {
        return updated.domain;
    })
};