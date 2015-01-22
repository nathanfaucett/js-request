var methods = require("methods"),
    forEach = require("for_each"),
    environment = require("environment"),

    defaults = require("./defaults"),
    request = environment.browser ? require("./request_browser") : require("./request_node");


forEach(methods, function(method) {
    var upper = method.toUpperCase();

    request[method] = function(url, options) {
        options || (options = {});

        options.url = url;
        options.method = upper;

        return request(options);
    };
});
request.mSearch = request["m-search"];

forEach(["post", "patch", "put"], function(method) {
    var upper = method.toUpperCase();

    request[method] = function(url, data, options) {
        options || (options = {});

        options.url = url;
        options.data = data;
        options.method = upper;

        return request(options);
    };
});

request.defaults = defaults.values;


module.exports = request;
