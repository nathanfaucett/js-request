var arrayMap = require("@nathanfaucett/array-map"),
    capitalizeString = require("@nathanfaucett/capitalize_string");


module.exports = function camelcaseHeader(str) {
    return arrayMap(str.toLowerCase().split("-"), capitalizeString).join("-");
};
