var methods = require("methods"),
    type = require("type"),
    each = require("each"),
    urlPath = require("url_path"),
    HttpError = require("http_error"),
    http, url;


var isBrowser = !!(typeof(window) !== "undefined" && typeof(navigator) !== "undefined" && window.document),
    request;

function noop() {}

function mixin(a, b) {
    var key, value;

    for (key in b) {
        if (a[key] == null && (value = b[key]) != null) a[key] = value;
    }
    return a;
}

function Response(request, status) {
    this._request = request;

    this.status = status;
    this.data = null;
}


if (isBrowser) {
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

    Response.prototype.getHeader = function(name) {

        return this._request.getResponseHeader(name);
    };

    var sameOrigin_url = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,
        sameOrigin_parts = sameOrigin_url.exec(location.href),

        sameOrigin = function(href) {
            if (!urlPath.isAbsoluteURL(href)) return true;
            var parts = sameOrigin_url.exec(href.toLowerCase()),
                urlPort, testPort;

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
        };

    request = function request(opts) {
        opts = mixin(opts || {}, request.defaults);

        var xhr = new XMLHttpRequest,

            src = type.isString(opts.src || (opts.src = opts.url)) ? opts.src : null,
            method = type.isString(opts.method) ? opts.method.toUpperCase() : "GET",

            before = type.isFunction(opts.before) ? opts.before : noop,
            success = type.isFunction(opts.success) ? opts.success : noop,
            error = type.isFunction(opts.error) ? opts.error : noop,

            processData = opts.processData ? !!opts.processData : true,
            data = opts.data,
            hasData = data != null,

            dataType = type.isString(opts.type) ? opts.type : null,
            contentType = type.isString(opts.contentType) ? opts.contentType : false,
            withCredentials = opts.withCredentials ? !!opts.withCredentials : false,

            async = opts.async != undefined ? !!opts.async : true,
            crossDomain = !sameOrigin(src);


        xhr.addEventListener("load", function load() {
            var status = this.status,
                response = new Response(this, status),
                responseText, processedData;

            if ((status > 199 && status < 301) || status == 304) {
                responseText = this.responseText;

                if (processData) {
                    if (dataType === "json") {
                        try {
                            processedData = JSON.parse(responseText);
                        } catch (e) {
                            error(new HttpError(422, e.message));
                            return;
                        }
                        response.data = processedData;
                    } else {
                        response.data = responseText;
                    }
                } else {
                    response.data = responseText;
                }

                success(response);
            } else {
                error(new HttpError(status, method + " " + src));
            }
        }, false);

        xhr.addEventListener("error", function error() {
            error(new HttpError(method + " " + src));
        }, false);

        xhr.open(method, src, async, opts.username, opts.password);

        if (xhr.overrideMimeType) {
            if (dataType === "json") {
                xhr.overrideMimeType("application/json");
            } else if (dataType === "xml") {
                xhr.overrideMimeType("application/xml");
            } else if (contentType) {
                xhr.overrideMimeType(contentType);
            }
        }

        if (hasData) {
            if (contentType !== false) {
                xhr.setRequestHeader("Content-Type", contentType);
            }
            if (!type.isObject(data)) {
                if (dataType === "json") {
                    data = JSON.stringify(data);
                } else {
                    data = data + "";
                }
            }
        }

        if (crossDomain) {
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
        }

        if (before !== noop) before.call(xhr, xhr);

        xhr.send(data);
    };
} else {
    http = require("http");
    url = require("url");

    request = function request(opts) {
        opts = mixin(opts || {}, request.defaults);

        Response.prototype.getHeader = function(name) {

            return this._request.getHeader(name);
        };

        var src = type.isString(opts.src || (opts.src = opts.url)) ? opts.src : null,
            fullUrl = url.parse(src),

            method = type.isString(opts.method) ? opts.method.toUpperCase() : "GET",

            before = type.isFunction(opts.before) ? opts.before : noop,
            success = type.isFunction(opts.success) ? opts.success : noop,
            error = type.isFunction(opts.error) ? opts.error : noop,

            processData = opts.processData ? !!opts.processData : true,
            data = opts.data,
            hasData = data != null,

            dataType = type.isString(opts.type) ? opts.type : null,
            contentType = type.isString(opts.contentType) ? opts.contentType : false,
            withCredentials = opts.withCredentials ? !!opts.withCredentials : false,

            async = opts.async != undefined ? !!opts.async : true,

            options = {
                hostname: fullUrl.hostname,
                port: fullUrl.port || 80,
                path: fullUrl.pathname,
                method: method,
                auth: (opts.user && opts.password) ? opts.user + ":" + opts.password : null,
                agent: opts.agent,
                headers: {}
            },

            req, results = "";

        if (dataType === "json") {
            options.headers["content-type"] = "application/json";
        } else if (dataType === "xml") {
            options.headers["content-type"] = "application/xml";
        } else if (contentType) {
            options.headers["content-type"] = contentType;
        }

        if (hasData) {
            if (contentType !== false) {
                options.headers["content-type"] = contentType;
            }
            if (!type.isObject(data)) {
                if (dataType === "json") {
                    data = JSON.stringify(data);
                } else {
                    data = data + "";
                }
            }
        }

        req = http.request(options, function callback(res) {

            res.on("data", function data(chunk) {
                results += chunk;
            });

            res.on("end", function load() {
                var status = res.statusCode,
                    response = new Response(req, status),
                    responseText;

                if ((status > 199 && status < 301) || status == 304) {
                    responseText = results;

                    if (processData) {
                        if (dataType === "json") {
                            try {
                                processedData = JSON.parse(responseText);
                            } catch (e) {
                                error(new HttpError(422, e.message));
                                return;
                            }
                            response.data = processedData;
                        } else {
                            response.data = responseText;
                        }
                    } else {
                        response.data = responseText;
                    }

                    success(response);
                } else {
                    error(new HttpError(status, method + " " + src));
                }
            });
        });

        req.on("error", function error(e) {
            error(new HttpError(e || method + " " + src));
        });

        if (before !== noop) before.call(req, req);

        req.end(data);
    };
}

request.defaults = {
    url: null,

    method: "GET",

    before: noop,

    processData: true,
    data: null,

    type: null,
    contentType: false,
    withCredentials: false
};

each(methods, function(method) {
    var upper = method.toUpperCase();

    request[method] = function(opts) {
        if (type.isString(opts)) {
            opts = {
                src: opts
            };
        }
        opts || (opts = {});
        opts.method = upper;

        return request(opts);
    };
});


module.exports = request;
