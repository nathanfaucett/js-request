var request = global.request = require("../src/index.js");


request.get({
    url: "http://localhost/html5/node/request/package.json",
    type: "json",
    success: function(response) {
        console.log(response);
    },
    error: function(error) {
        console.log(error);
    }
});
