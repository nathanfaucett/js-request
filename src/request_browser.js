var PromisePolyfill = require("promise_polyfill"),
    XMLHttpRequestPolyfill = require("xmlhttprequest_polyfill"),
    isFunction = require("is_function"),
    isString = require("is_string"),
    forEach = require("for_each"),
    trim = require("trim"),
    extend = require("extend"),
    defaults = require("./defaults"),
    helpers = require("./helpers");


var supportsFormData = typeof(FormData) !== "undefined";


defaults.values.XMLHttpRequest = XMLHttpRequestPolyfill;


function parseResponseHeaders(responseHeaders) {
    var camelCaseHeader = helpers.camelCaseHeader,
        headers = {},
        raw = responseHeaders.split("\n");

    forEach(raw, function(header) {
        var tmp = header.split(":"),
            key = tmp[0],
            value = tmp[1];

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
    var xhr = new defaults.values.XMLHttpRequest(),
        plugins = request.plugins,
        canSetRequestHeader = isFunction(xhr.setRequestHeader),
        canOverrideMimeType = isFunction(xhr.overrideMimeType),
        isFormData, defer;

    options = defaults(options);

    plugins.emit("before", xhr, options);

    isFormData = (supportsFormData && options.data instanceof FormData);
    if (options.isPromise) {
        defer = PromisePolyfill.defer();
    }

    function onSuccess(response) {
        plugins.emit("response", response, xhr, options);
        plugins.emit("load", response, xhr, options);

        if (options.isPromise) {
            defer.resolve(response);
        } else {
            if (options.success) {
                options.success(response);
            }
        }
    }

    function onError(response) {
        plugins.emit("response", response, xhr, options);
        plugins.emit("error", response, xhr, options);

        if (options.isPromise) {
            defer.reject(response);
        } else {
            if (options.error) {
                options.error(response);
            }
        }
    }

    function onComplete() {
        var statusCode = +xhr.status,
            responseText = xhr.responseText,
            response = {};

        response.url = xhr.responseURL || options.url;
        response.method = options.method;

        response.statusCode = statusCode;

        response.responseHeaders = xhr.getAllResponseHeaders ? parseResponseHeaders(xhr.getAllResponseHeaders()) : {};
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
    }

    function onReadyStateChange() {
        switch (+xhr.readyState) {
            case 1:
                plugins.emit("request", xhr, options);
                break;
            case 4:
                onComplete();
                break;
        }
    }

    if (isFunction(xhr.addEventListener)) {
        xhr.addEventListener("readystatechange", onReadyStateChange, false);
    } else if (isFunction(xhr.attachEvent)) {
        xhr.attachEvent("onreadystatechange", onReadyStateChange);
    } else {
        xhr.onreadystatechange = onReadyStateChange;
    }

    if (options.withCredentials && options.async) {
        xhr.withCredentials = options.withCredentials;
    }

    xhr.open(
        options.method,
        options.url,
        options.async,
        options.username,
        options.password
    );

    if (canSetRequestHeader) {
        forEach(options.headers, function(value, key) {
            if (key === "Content-Type" && canOverrideMimeType) {
                xhr.overrideMimeType(value);
            }
            xhr.setRequestHeader(key, value);
        });
    }

    if (options.transformRequest) {
        options.data = options.transformRequest(options.data);
    } else {
        if (!isString(options.data) && !isFormData) {
            if (options.headers["Content-Type"] === "application/json") {
                options.data = JSON.stringify(options.data);
            } else {
                options.data = options.data + "";
            }
        }
    }

    xhr.send(options.data);

    return defer ? defer.promise : undefined;
}


module.exports = request;
