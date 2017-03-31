var methods = require("@nathanfaucett/methods"),
    arrayForEach = require("@nathanfaucett/array-for_each"),
    EventEmitter = require("@nathanfaucett/event_emitter"),
    defaults = require("./defaults");


module.exports = function createRequest(request) {

    arrayForEach(methods, function(method) {
        var upper = method.toUpperCase();

        request[method] = function(url, options) {
            options = options || {};

            options.url = url;
            options.method = upper;

            return request(options);
        };
    });

    arrayForEach(["post", "patch", "put"], function(method) {
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