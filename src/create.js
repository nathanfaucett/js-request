module.exports = function createRequest(request) {
    var methods = require("methods"),
        forEach = require("for_each"),
        EventEmitter = require("event_emitter"),
        defaults = require("./defaults");


    forEach(methods, function(method) {
        var upper = method.toUpperCase();

        request[method] = function(url, options) {
            options = options || {};

            options.url = url;
            options.method = upper;

            return request(options);
        };
    });
    request.mSearch = request["m-search"];

    forEach(["post", "patch", "put"], function(method) {
        var upper = method.toUpperCase();

        request[method] = function(url, data, options) {
            options = options || {};

            options.url = url;
            options.data = data;
            options.method = upper;

            return request(options);
        };
    });

    request.defaults = defaults.values;
    request.plugins = new EventEmitter(-1);

    return request;
};
