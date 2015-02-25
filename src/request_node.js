var PromisePolyfill = require("promise_polyfill"),
    isString = require("is_string"),
    extend = require("extend"),
    http = require("http"),
    url = require("url"),
    forEach = require("for_each"),
    trim = require("trim"),
    defaults = require("./defaults"),
    helpers = require("./helpers");


function parseResponseHeadersNode(responseHeaders) {
    var camelCaseHeader = helpers.camelCaseHeader,
        headers = {};

    forEach(responseHeaders, function(value, key) {
        if (key && value) {
            key = camelCaseHeader(key);
            value = trim(value);

            if (key === "Content-Length") {
                value = +value;
            }

            headers[key] = value;
        }
    });

    return headers;
}


function request(options) {
    var results = "",
        plugins = request.plugins,
        fullUrl, nodeOptions, req, defer;

    options = defaults(options);

    fullUrl = url.parse(options.url);
    nodeOptions = {
        hostname: fullUrl.hostname,
        port: fullUrl.port || 80,
        path: fullUrl.pathname,
        method: options.method,
        auth: (options.user && options.password) ? options.user + ":" + options.password : null,
        agent: options.agent,
        headers: options.headers
    };
    req = http.request(nodeOptions);

    plugins.emit("before", req, options);

    if (options.isPromise) {
        defer = PromisePolyfill.defer();
    }

    function onSuccess(response) {
        plugins.emit("response", response, req, options);
        plugins.emit("load", response, req, options);

        if (options.isPromise) {
            defer.resolve(response);
        } else {
            if (options.success) {
                options.success(response);
            }
        }
    }

    function onError(response) {
        plugins.emit("response", response, req, options);
        plugins.emit("error", response, req, options);

        if (options.isPromise) {
            defer.reject(response);
        } else {
            if (options.error) {
                options.error(response);
            }
        }
    }

    function onComplete(res) {
        res.on("data", function ondata(chunk) {
            results += chunk;
        });

        res.on("end", function onload() {
            var statusCode = +res.statusCode,
                response = {},
                responseText = results;

            response.url = options.url;
            response.method = options.method;

            response.statusCode = statusCode;

            response.responseHeaders = parseResponseHeadersNode(res.headers);
            response.requestHeaders = options.headers ? extend({}, options.headers) : {};

            response.data = null;

            if (responseText) {
                if (options.transformResponse) {
                    response.data = options.transformResponse(responseText);
                } else {
                    if (helpers.parseContentType(response.responseHeaders["Content-Type"]) === "application/json") {
                        try {
                            response.data = JSON.parse(responseText);
                        } catch (e) {
                            response.data = e;
                            onError(response);
                            return;
                        }
                    } else if (responseText) {
                        response.data = responseText;
                    }
                }
            }

            if ((statusCode > 199 && statusCode < 301) || statusCode === 304) {
                onSuccess(response);
            } else {
                onError(response);
            }
        });
    }

    function onCompleteError(error) {
        var response = {};

        response.url = options.url;
        response.method = options.method;

        response.statusCode = 0;

        response.responseHeaders = {};
        response.requestHeaders = options.headers ? extend({}, options.headers) : {};

        response.data = error;

        onError(response);
    }

    if (options.transformRequest) {
        options.data = options.transformRequest(options.data);
    } else {
        if (!isString(options.data)) {
            if (options.headers["Content-Type"] === "application/json") {
                options.data = JSON.stringify(options.data);
            } else {
                options.data = options.data + "";
            }
        }
    }

    req.on("response", onComplete);
    req.on("error", onCompleteError);

    req.end(options.data);
    plugins.emit("request", req, options);

    return defer ? defer.promise : undefined;
}


module.exports = request;
