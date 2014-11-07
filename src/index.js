var methods = require("methods"),
    each = require("each"),
    type = require("type"),

    defaults = require("./defaults"),
    request = process.browser ? require("./request_browser") : require("./request_node");


each(methods, function(method) {
    var upper = method.toUpperCase();

    request[method] = function(url, data, options) {
        if (options === undefined && type.isObject(data)) {
            options = data;
            data = options.data;
        }
        if (type.isObject(url)) {
            options = url;
            data = options.data;
            url = options.url || options.src;
        }

        options || (options = {});

        options.url = url;
        options.data = data;
        options.method = upper;

        return request(options);
    };
});
request.mSearch = request["m-search"];

request.defaults = defaults.values;


module.exports = request;
