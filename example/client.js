global.request = require("../src/index.js");

request.defaults.withCredentials = true;
request.defaults.headers["Content-Type"] = "application/json";


console.time("get");
request.get("http://localhost:3000").then(
    function(response) {
        console.timeEnd("get");
        console.log(response);
    },
    function(response) {
        console.timeEnd("get");
        console.log(response);
    }
);

global.uploadObject = function() {

    request.post("http://localhost:3000", {
        firstName: "Nathan",
        lastName: "Faucett"
    }).then(
        function(response) {
            console.log(response);
        },
        function(response) {
            console.log(response);
        }
    );
};
