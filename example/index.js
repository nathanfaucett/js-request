global.request = require("../src/index.js");

request.defaults.withCredentials = true;
request.defaults.headers["Content-Type"] = "application/json";

request.get("http://localhost/html5/node/request/package.json", {
    success: function(response) {
        console.log(response);
    },
    error: function(error) {
        console.log(error);
    }
});

request.get("http://localhost/html5/node/request/package.json").then(
    function(response) {
        console.log(response);
    },
    function(response) {
        console.log(response);
    }
);
