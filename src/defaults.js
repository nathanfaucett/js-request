var utils = require("utils"),
    type = require("type");


function defaults(options) {
    options = utils.mixin(options || {}, defaults.values);

    options.url = type.isString(options.url || (options.url = options.src)) ? options.url : null;
    options.method = type.isString(options.method) ? options.method.toUpperCase() : "GET";

    options.data = options.data;

    options.withCredentials = options.withCredentials != null ? !!options.withCredentials : false;
    options.headers = utils.mixin({}, options.headers);
    options.async = options.async != null ? !!options.async : true;

    options.success = type.isFunction(options.success) ? options.success : null;
    options.error = type.isFunction(options.error) ? options.error : null;
    options.isPromise = !type.isFunction(options.success) && !type.isFunction(options.error);

    return options;
}

defaults.values = {
    url: "",
    method: "GET",
    headers: {}
};


module.exports = defaults;
