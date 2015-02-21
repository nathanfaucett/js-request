var map = require("map");


var helpers = exports;


function capitalize(str) {

    return str[0].toUpperCase() + str.slice(1);
}

helpers.camelCaseHeader = function(str) {

    return map(str.split("-"), capitalize).join("-");
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
