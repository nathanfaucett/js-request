var PolyPromise = require("promise"),
    type = require("type"),
    each = require("each"),
    utils = require("utils"),
    http = require("http"),
    nodeURL = require("url");


var defaults = require("./defaults");

function capitalize(str) {

    return str[0].toUpperCase() + str.slice(1);
}

function camelCaseHeader(str) {

    return each.map(str.split("-"), capitalize).join("-");
}

function parseResponseHeaders(responseHeaders) {
    var headers = {};

    each(responseHeaders, function(value, key) {
        if (key && value) {
            key = camelCaseHeader(key);
            value = value.trim();

            if (key === "Content-Length") {
                value = +value;
            }

            headers[key] = value;
        }
    });

    return headers;
}

function parseContentType(str) {
    var index;

    if (str) {
        if ((index = str.indexOf(";")) !== -1) {
            str = str.substring(0, index);
        }
        if ((index = str.indexOf(",")) !== -1) {
            return str.substring(0, index);
        }

        return str;
    }

    return "application/octet-stream";
}

function request(options) {
    var results = "",
        defer, fullUrl, nodeOptions, req;

    options = defaults(options);

    if (options.isPromise) {
        defer = PolyPromise.defer();
    }

    function onsuccess(response) {
        if (options.isPromise) {
            defer.resolve(response);
        } else {
            options.success && options.success(response);
        }
    }

    function onerror(response) {
        if (options.isPromise) {
            defer.reject(response);
        } else {
            options.error && options.error(response);
        }
    }

    function oncomplete(res) {
        res.on("data", function ondata(chunk) {
            results += chunk;
        });

        res.on("end", function onload() {
            var statusCode = +res.statusCode,
                response = {},
                responseText = results,
                processedData;

            response.statusCode = statusCode;

            response.responseHeaders = parseResponseHeaders(res.headers);
            response.requestHeaders = options.headers ? utils.copy(options.headers) : {};

            response.data = null;

            if (parseContentType(response.responseHeaders["Content-Type"]) === "application/json") {
                try {
                    processedData = JSON.parse(responseText);
                } catch (e) {
                    onerror(response);
                    return;
                }
                response.data = processedData;
            } else if (responseText) {
                response.data = responseText;
            }

            if ((statusCode > 199 && statusCode < 301) || statusCode === 304) {
                onsuccess(response);
            } else {
                onerror(response);
            }
        });
    }

    fullUrl = nodeURL.parse(options.url);
    nodeOptions = {
        hostname: fullUrl.hostname,
        port: fullUrl.port || 80,
        path: fullUrl.pathname,
        method: options.method,
        auth: (options.user && options.password) ? options.user + ":" + options.password : null,
        agent: options.agent,
        headers: options.headers
    };

    if (!type.isString(options.data)) {
        if (options.headers["Content-Type"] === "application/json") {
            options.data = JSON.stringify(options.data);
        } else {
            options.data = options.data + "";
        }
    }

    req = http.request(nodeOptions);

    req.on("response", oncomplete);
    req.on("error", oncomplete);

    req.end(options.data);

    return defer ? defer.promise : undefined;
}


module.exports = request;
