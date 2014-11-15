var PolyPromise = require("promise"),
    type = require("type"),
    each = require("each"),
    //urlPath = require("url_path"),
    utils = require("utils"),
    defaults = require("./defaults");


var supoortsFormData = typeof(FormData) !== "undefined",
    //sameOrigin_url = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,
    //sameOrigin_parts = sameOrigin_url.exec(location.href),
    supportsEventListener;


defaults.values.XMLHttpRequest = (
    global.XMLHttpRequest ||
    function XMLHttpRequest() {
        try {
            return new ActiveXObject("Msxml2.XMLHTTP.6.0");
        } catch (e1) {
            try {
                return new ActiveXObject("Msxml2.XMLHTTP.3.0");
            } catch (e2) {
                throw new Error("XMLHttpRequest is not supported");
            }
        }
    }
);
supportsEventListener = type.isNative(defaults.values.XMLHttpRequest.prototype.addEventListener);

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
    var headers = {},
        raw = responseHeaders.split("\n");

    each(raw, function(header) {
        var tmp = header.split(":"),
            key = tmp[0],
            value = tmp[1];

        if (key && value) {
            value = utils.trim(value);

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
    var xhr = new defaults.values.XMLHttpRequest(),
        canSetRequestHeader = type.isFunction(xhr.setRequestHeader),
        canOverrideMimeType = type.isFunction(xhr.overrideMimeType),
        isFormData, defer;

    options = defaults(options);

    isFormData = (supoortsFormData && options.data instanceof FormData);

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
        response.requestHeaders = options.headers ? utils.copy(options.headers) : {};

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

    if (supportsEventListener) {
        xhr.addEventListener("load", oncomplete, false);
        xhr.addEventListener("error", oncomplete, false);
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
        each(options.headers, function(value, key) {
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
        if (!type.isString(options.data) && !isFormData) {
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
