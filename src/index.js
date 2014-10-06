var methods = require("methods"),
    each = require("each"),
    type = require("type"),
    utils = require("utils"),

    defaults = require("./defaults"),
    request = process.browser ? require("./request_browser") : require("./request_node");


each(methods, function(method) {
    var upper = method.toUpperCase();

    request[method] = function(url, options) {
        if (type.isObject(url)) {
            options = url;
            url = options.url || options.src;
        }

        options || (options = {});

        options.url = url;
        options.method = upper;

        return request(options);
    };
});

request.post = function(url, data, options) {
    return request(utils.mixin({
        url: url,
        data: data,
        method: "POST"
    }, options));
};

request.put = function(url, data, options) {
    return request(utils.mixin({
        url: url,
        data: data,
        method: "PUT"
    }, options));
};

request.patch = function(url, data, options) {
    return request(utils.mixin({
        url: url,
        data: data,
        method: "PATCH"
    }, options));
};

request.defaults = defaults.values;


module.exports = request;
