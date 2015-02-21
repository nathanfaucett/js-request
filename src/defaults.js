var mixin = require("mixin"),
    isString = require("is_string"),
    isFunction = require("is_function");


function defaults(options) {
    options = mixin({}, options, defaults.values);

    options.url = isString(options.url || (options.url = options.src)) ? options.url : null;
    options.method = isString(options.method) ? options.method.toUpperCase() : "GET";

    options.data = options.data;

    options.transformRequest = isFunction(options.transformRequest) ? options.transformRequest : null;
    options.transformResponse = isFunction(options.transformResponse) ? options.transformResponse : null;

    options.withCredentials = options.withCredentials != null ? !!options.withCredentials : false;
    options.headers = mixin({}, defaults.values.headers, options.headers);
    options.async = options.async != null ? !!options.async : true;

    options.success = isFunction(options.success) ? options.success : null;
    options.error = isFunction(options.error) ? options.error : null;
    options.isPromise = !isFunction(options.success) && !isFunction(options.error);

    options.user = isString(options.user) ? options.user : undefined;
    options.password = isString(options.password) ? options.password : undefined;

    return options;
}

defaults.values = {
    url: "",
    method: "GET",
    headers: {
        Accept: "*/*",
        "X-Requested-With": "XMLHttpRequest"
    }
};


module.exports = defaults;
