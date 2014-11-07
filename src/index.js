var methods = require("methods"),
    each = require("each"),

    defaults = require("./defaults"),
    request = process.browser ? require("./request_browser") : require("./request_node");


each(methods, function(method) {
    var upper = method.toUpperCase();

    request[method] = function(url, data, options) {
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
