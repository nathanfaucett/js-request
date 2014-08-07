var request = global.request = require("../../src/index.js");


request.get({
    url: "http://localhost/html5/node/request/package.json",
    type: "json",
}).then(
    function(response) {
        console.log(response);
    },
    function(error) {
        console.log(error);
    }
);