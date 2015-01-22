var PolyPromise = require("promise"),
    isFunction = require("is_function"),
    isString = require("is_string"),
    forEach = require("for_each"),
    trim = require("trim"),
    //urlPath = require("url_path"),
    extend = require("extend"),
    defaults = require("./defaults"),
    helpers = require("./helpers"),
    environment = require("environment");


var window = environment.window,
    supportsFormData = typeof(FormData) !== "undefined";

//sameOrigin_url = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,
//sameOrigin_parts = sameOrigin_url.exec(location.href);


defaults.values.XMLHttpRequest = (
    window.XMLHttpRequest ||
    function XMLHttpRequest() {
        try {
            return new ActiveXObject("Msxml2.XMLHTTP.6.0");
        } catch (e1) {
            try {
                return new ActiveXObject("Msxml2.XMLHTTP.3.0");
            } catch (e2) {
                try {
                    return new XDomainRequest();
                } catch (e3) {
                    throw new Error("XMLHttpRequest is not supported");
                }
            }
        }
    }
);

/*
function sameOrigin(href) {
    var parts, urlPort, testPort;

    if (!urlPath.isAbsoluteURL(href)) return true;

    parts = sameOrigin_url.exec(href.toLowerCase());

    if (!parts) return false;

    urlPort = sameOrigin_parts[3];
    testPort = parts[3];

    return !(
        (parts[1] !== sameOrigin_parts[1]) ||
        (parts[2] !== sameOrigin_parts[2]) || !(
            (testPort === urlPort) ||
            (!testPort && (urlPort === "80" || urlPort === "443")) ||
            (!urlPort && (testPort === "80" || testPort === "443"))
        )
    );
}
*/

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
        canSetRequestHeader = isFunction(xhr.setRequestHeader),
        canOverrideMimeType = isFunction(xhr.overrideMimeType),
        isFormData, defer;

    options = defaults(options);

    isFormData = (supportsFormData && options.data instanceof FormData);

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

    function oncomplete() {
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
                        onerror(response);
                        return;
                    }
                } else if (responseText) {
                    response.data = responseText;
                }
            }
        }

        if ((statusCode > 199 && statusCode < 301) || statusCode === 304) {
            onsuccess(response);
        } else {
            onerror(response);
        }
    }

    if (isFunction(xhr.addEventListener)) {
        xhr.addEventListener("load", oncomplete, false);
        xhr.addEventListener("error", oncomplete, false);
    } else if (isFunction(xhr.attachEvent)) {
        xhr.attachEvent("onload", oncomplete);
        xhr.attachEvent("onerror", oncomplete);
    } else {
        xhr.onreadystatechange = function onreadystatechange() {
            if (+xhr.readyState === 4) {
                oncomplete();
            }
        };
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
    /*
    if (canSetRequestHeader && !sameOrigin(options.url) && !isFormData) {
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    }
    */
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
