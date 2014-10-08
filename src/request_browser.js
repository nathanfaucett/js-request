var PolyPromise = require("promise"),
    type = require("type"),
    each = require("each"),
    urlPath = require("url_path"),
    utils = require("utils");


var defaults = require("./defaults"),

    TRIM_REGEX = /^[\s\xA0]+|[\s\xA0]+$/g,
    sameOrigin_url = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,
    sameOrigin_parts = sameOrigin_url.exec(location.href);


window.XMLHttpRequest || (window.XMLHttpRequest = function XMLHttpRequest() {
    try {
        return new ActiveXObject("Msxml2.XMLHTTP.6.0");
    } catch (e1) {
        try {
            return new ActiveXObject("Msxml2.XMLHTTP.3.0");
        } catch (e2) {
            throw new Error("XMLHttpRequest is not supported");
        }
    }
});

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

function trim(str) {

    return str.replace(TRIM_REGEX, "");
}

function parseResponseHeaders(responseHeaders) {
    var headers = {},
        raw = responseHeaders.split("\n");

    each(raw, function(header) {
        var tmp = header.split(":"),
            key = tmp[0],
            value = tmp[1];

        if (key && value) {
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
    var xhr = new XMLHttpRequest(),
        defer;

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

    function oncomplete() {
        var statusCode = +xhr.status,
            response = {},
            responseText = xhr.responseText,
            processedData;

        response.statusCode = statusCode;

        if (xhr.getAllResponseHeaders) {
            response.responseHeaders = parseResponseHeaders(xhr.getAllResponseHeaders());
        }
        response.requestHeaders = options.headers ? utils.copy(options.headers) : {};

        response.data = responseText;

        if (options.headers["Content-Type"] === "application/json") {
            try {
                processedData = JSON.parse(responseText);
            } catch (e) {
                onerror(response);
                return;
            }
            response.data = processedData;
        }

        if ((statusCode > 199 && statusCode < 301) || statusCode === 304) {
            onsuccess(response);
        } else {
            onerror(response);
        }
    }

    if (xhr.addEventListener) {
        xhr.addEventListener("load", oncomplete, false);
        xhr.addEventListener("error", oncomplete, false);
    } else {
        xhr.onreadystatechange = function onreadystatechange() {
            if (+xhr.readyState === 4) {
                oncomplete();
            }
        };
    }

    if (options.withCredentials && options.async !== false) {
        xhr.withCredentials = options.withCredentials;
    }

    xhr.open(
        options.method,
        options.url,
        options.async !== false,
        options.username,
        options.password
    );

    each(options.headers, function(value, key) {
        if (key === "Content-Type") {
            xhr.overrideMimeType(value);
        }
        xhr.setRequestHeader(key, value);
    });

    if (!sameOrigin(options.url)) {
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
    }

    if (!type.isString(options.data)) {
        if (options.headers["Content-Type"] === "application/json") {
            options.data = JSON.stringify(options.data);
        } else {
            options.data = options.data + "";
        }
    }

    xhr.send(options.data);

    return defer ? defer.promise : undefined;
}


module.exports = request;
