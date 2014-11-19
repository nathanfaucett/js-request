var each = require("each"),
    utils = require("utils");


var helpers = module.exports;


function capitalize(str) {

    return str[0].toUpperCase() + str.slice(1);
}

function camelCaseHeader(str) {

    return each.map(str.split("-"), capitalize).join("-");
}

helpers.parseResponseHeadersNode = function(responseHeaders) {
    var headers = {};

    each(responseHeaders, function(value, key) {
        if (key && value) {
            key = camelCaseHeader(key);
            value = utils.trim(value);

            if (key === "Content-Length") {
                value = +value;
            }

            headers[key] = value;
        }
    });

    return headers;
};

helpers.parseResponseHeaders = function(responseHeaders) {
    var headers = {},
        raw = responseHeaders.split("\n");

    each(raw, function(header) {
        var tmp = header.split(":"),
            key = tmp[0],
            value = tmp[1];

        if (key && value) {
            key = camelCaseHeader(key);
            value = utils.trim(value);

            if (key === "Content-Length") {
                value = +value;
            }

            headers[key] = value;
        }
    });

    return headers;
};

helpers.parseContentType = function(str) {
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
};
