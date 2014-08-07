var methods = require("methods"),
    urlPath = require("url_path"),
    HttpError = require("http_error"),
    utils = require("utils"),
    Promise = require("promise"),
    http, url;


var isBrowser = !!(typeof(window) !== "undefined" && typeof(navigator) !== "undefined" && window.document),
    request, sameOrigin, sameOrigin_url, sameOrigin_parts;


function Response(status) {
    this.status = status;
    this.data = null;
};


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
    
    sameOrigin_url = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,
    sameOrigin_parts = sameOrigin_url.exec(location.href);

    sameOrigin = function sameOrigin(href) {
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
        opts = utils.defaults(opts || {}, request.defaults);
        
        var xhr = new XMLHttpRequest,
    
            src = utils.isString(opts.src || (opts.src = opts.url)) ? opts.src : null,
            method = utils.isString(opts.method) ? opts.method.toUpperCase() : "GET",
    
            before = utils.isFunction(opts.before) ? opts.before : utils.noop,
    
            processData = opts.processData ? !! opts.processData : true,
            data = opts.data,
            hasData = data != null,
    
            type = utils.isString(opts.type) ? opts.type : null,
            contentType = utils.isString(opts.contentType) ? opts.contentType : false,
            withCredentials = opts.withCredentials ? !!opts.withCredentials : false,
    
            async = opts.async != undefined ? !! opts.async : true,
            crossDomain = !sameOrigin(src);
        
        return new Promise(function resolver(resolve, reject) {
            
            xhr.addEventListener("load", function load() {
                var status = this.status,
                    response = new Response(status),
                    responseText, processedData;
        
                if ((status > 199 && status < 301) || status == 304) {
                    responseText = this.responseText;
                    
                    if (processData) {
                        if (type === "json") {
                            try {
                                processedData = JSON.parse(responseText);
                            } catch (e) {
                                reject(new HttpError(422, e.message));
                                return;
                            }
                            response.data = processedData;
                        } else {
                            response.data = responseText;
                        }
                    } else {
                        response.data = responseText;
                    }
        
                    resolve(response);
                } else {
                    reject(new HttpError(status, method + " " + src));
                }
            }, false);
        
            xhr.addEventListener("error", function error() {
                reject(new HttpError(method + " " + src));
            }, false);
            
            xhr.open(method, src, async, opts.username, opts.password);
    
            if (xhr.overrideMimeType) {
                if (type === "json") {
                    xhr.overrideMimeType("application/json");
                } else if (type === "xml") {
                    xhr.overrideMimeType("application/xml");
                } else if (contentType) {
                    xhr.overrideMimeType(contentType);
                }
            }
        
            if (hasData) {
                if (contentType !== false) {
                    xhr.setRequestHeader("Content-Type", contentType);
                }
                if (!utils.isObject(data)) {
                    if (type === "json") {
                        data = JSON.stringify(data);
                    } else {
                        data = data + "";
                    }
                }
            }
    
            if (crossDomain) {
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
            }
        
            if (before !== utils.noop) before.call(xhr, xhr);
        
            xhr.send(data);
        });
    };
} else {
    http = require("http");
    url = require("url");

    request = function request(opts) {
        opts = utils.defaults(opts || {}, request.defaults);
        
        var src = utils.isString(opts.src || (opts.src = opts.url)) ? opts.src : null,
            fullUrl = url.parse(src),
            
            method = utils.isString(opts.method) ? opts.method.toUpperCase() : "GET",
    
            before = utils.isFunction(opts.before) ? opts.before : utils.noop,
    
            processData = opts.processData ? !! opts.processData : true,
            data = opts.data,
            hasData = data != null,
    
            type = utils.isString(opts.type) ? opts.type : null,
            contentType = utils.isString(opts.contentType) ? opts.contentType : false,
            withCredentials = opts.withCredentials ? !!opts.withCredentials : false,
    
            async = opts.async != undefined ? !! opts.async : true,
            
            options = {
                hostname: fullUrl.hostname,
                port: fullUrl.port || 80,
                path: fullUrl.pathname,
                method: method,
                auth: (opts.user && opts.password) ? opts.user +":"+ opts.password : null,
                agent: opts.agent,
                headers: {}
            };
        
        return new Promise(function resolver(resolve, reject) {
            var results = "", req ;
            
            if (type === "json") {
                options.headers["content-type"] = "application/json";
            } else if (type === "xml") {
                options.headers["content-type"] = "application/xml";
            } else if (contentType) {
                options.headers["content-type"] = contentType;
            }
            
            if (hasData) {
                if (contentType !== false) {
                    options.headers["content-type"] = contentType;
                }
                if (!utils.isObject(data)) {
                    if (type === "json") {
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
                        response = new Response(status),
                        responseText;
                    
                    if ((status > 199 && status < 301) || status == 304) {
                        responseText = results;
                        
                        if (processData) {
                            if (type === "json") {
                                try {
                                    processedData = JSON.parse(responseText);
                                } catch (e) {
                                    reject(new HttpError(422, e.message));
                                    return;
                                }
                                response.data = processedData;
                            } else {
                                response.data = responseText;
                            }
                        } else {
                            response.data = responseText;
                        }
            
                        resolve(response);
                    } else {
                        reject(new HttpError(status, method + " " + src));
                    }
                }); 
            });
            
            req.on("error", function error(e) {
                reject(new HttpError(e || method + " " + src));
            });
            
            if (before !== utils.noop) before.call(req, req);
            
            req.end(data);
        });
    };
}

request.defaults = {
    url: null,
    
    method: "GET",

    before: utils.noop,

    processData: true,
    data: null,

    type: null,
    contentType: false,
    withCredentials: false
};

methods.forEach(function(method) {
    var upper = method.toUpperCase();
    
    request[method] = function(opts) {
        if (utils.isString(opts)) {
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