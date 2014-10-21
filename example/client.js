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
    var formData = new FormData(),
        file = new File(["{\"hey\": \"value\"}"], "hey.json", {
            type: "application/json"
        });

    formData.append("jsonFile", file);
    formData.append("firstName", "Nathan");
    formData.append("lastName", "Faucett");

    console.time("post");
    request.post("http://localhost:3000", formData, {
        headers: {
            "Content-Type": null
        }
    }).then(
        function(response) {
            console.timeEnd("post");
            console.log(response);
        },
        function(response) {
            console.log(response);
        }
    );
};
