var PromisePolyfill = require("@nathanfaucett/promise_polyfill"),
    XMLHttpRequestPolyfill = require("@nathanfaucett/xmlhttprequest_polyfill"),
    isFunction = require("@nathanfaucett/is_function"),
    isString = require("@nathanfaucett/is_string"),
    isNull = require("@nathanfaucett/is_null"),
    objectForEach = require("@nathanfaucett/object-for_each"),
    trim = require("@nathanfaucett/trim"),
    extend = require("@nathanfaucett/extend"),
    Response = require("./Response"),
    defaults = require("./defaults"),
    camelcaseHeader = require("./camelcaseHeader"),
    parseContentType = require("./parseContentType");


var supportsFormData = typeof(FormData) !== "undefined";


defaults.values.XMLHttpRequest = XMLHttpRequestPolyfill;
defaults.values.xmlHttpRequestOptions = {};


module.exports = request;


function request(options) {
    var plugins = request.plugins,
        defer = null,
        xhr, canSetRequestHeader, canOverrideMimeType, isFormData;

    options = defaults(options);

    xhr = new options.XMLHttpRequest(options.xmlHttpRequestOptions);
    canSetRequestHeader = isFunction(xhr.setRequestHeader);
    canOverrideMimeType = isFunction(xhr.overrideMimeType);

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
            if (!isNull(options.success)) {
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
            if (!isNull(options.error)) {
                options.error(response);
            }
        }
    }

    function onComplete() {
        var statusCode = +xhr.status,
            responseText = xhr.responseText,
            response = new Response();

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

    addEventListener(xhr, "readystatechange", onReadyStateChange);

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
        if (options.headers && options.headers["Content-Type"] && isFormData) {
            delete options.headers["Content-Type"];
        }

        objectForEach(options.headers, function(value, key) {
            if (isString(value)) {
                if (key === "Content-Type" && canOverrideMimeType) {
                    xhr.overrideMimeType(value);
                }
                xhr.setRequestHeader(key, value);
            }
        });
    }

    if (options.transformRequest) {
        options.data = options.transformRequest(options.data);
    } else if (options.data) {
        if (!isString(options.data) && !isFormData) {
            if (options.headers["Content-Type"] === "application/json") {
                options.data = JSON.stringify(options.data);
            } else {
                options.data = options.data + "";
            }
        }
    }

    xhr.send(options.data);

    return isNull(defer) ? undefined : defer.promise;
}


function parseResponseHeaders(responseHeaders) {
    var headers = {},
        raw = responseHeaders.split("\n");

    objectForEach(raw, function(header) {
        var tmp = header.split(":"),
            key = tmp[0],
            value = tmp[1];

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


function addEventListener(xhr, event, listener) {
    if (isFunction(xhr.addEventListener)) {
        xhr.addEventListener(event, listener, false);
    } else if (isFunction(xhr.attachEvent)) {
        xhr.attachEvent("on" + event, listener);
    } else {
        xhr["on" + event] = listener;
    }
}