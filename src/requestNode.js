var PromisePolyfill = require("@nathanfaucett/promise_polyfill"),
    isString = require("@nathanfaucett/is_string"),
    isNull = require("@nathanfaucett/is_null"),
    extend = require("@nathanfaucett/extend"),
    http = require("http"),
    url = require("@nathanfaucett/url"),
    objectForEach = require("@nathanfaucett/object-for_each"),
    objectFilter = require("@nathanfaucett/object-filter"),
    trim = require("@nathanfaucett/trim"),
    Response = require("./Response"),
    defaults = require("./defaults"),
    camelcaseHeader = require("./camelcaseHeader"),
    parseContentType = require("./parseContentType");


var defaultHeaders = {
    "Transfer-Encoding": "chunked"
};


module.exports = request;


function request(options) {
    var results = "",
        plugins = request.plugins,
        defer = null,
        fullUrl, nodeOptions, req;

    options = defaults(options);

    fullUrl = url.parse(options.url);
    nodeOptions = {
        hostname: fullUrl.hostname,
        port: fullUrl.port || 80,
        path: fullUrl.path,
        method: options.method,
        auth: (options.user && options.password) ? options.user + ":" + options.password : null,
        agent: options.agent,
        headers: objectFilter(options.headers, isString)
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
            if (!isNull(options.success)) {
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
            if (!isNull(options.error)) {
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
                response = new Response(),
                responseText = results;

            response.url = fullUrl.href;
            response.method = options.method;

            response.statusCode = statusCode;

            response.responseHeaders = parseResponseHeadersNode(res.headers);
            response.requestHeaders = options.headers ? extend({}, defaultHeaders, options.headers) : extend({}, defaultHeaders);

            response.data = null;

            if (responseText) {
                if (options.transformResponse) {
                    response.data = options.transformResponse(responseText);
                } else {
                    if (parseContentType(response.responseHeaders["Content-Type"]) === "application/json") {
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

        response.url = fullUrl.href;
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

    return isNull(defer) ? undefined : defer.promise;
}


function parseResponseHeadersNode(responseHeaders) {
    var headers = {};

    objectForEach(responseHeaders, function(value, key) {
        if (key && value) {
            key = camelcaseHeader(key);
            value = trim(value);

            if (key === "Content-Length") {
                value = +value;
            }

            headers[key] = value;
        }
    });

    return headers;
}