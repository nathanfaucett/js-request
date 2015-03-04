var map = require("map"),
    capitalizeString = require("capitalize_string");


module.exports = function camelcaseHeader(str) {
    return map(str.split("-"), capitalizeString).join("-");
};
