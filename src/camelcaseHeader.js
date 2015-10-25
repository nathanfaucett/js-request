var arrayMap = require("array-map"),
    capitalizeString = require("capitalize_string");


module.exports = function camelcaseHeader(str) {
    return arrayMap(str.split("-"), capitalizeString).join("-");
};
