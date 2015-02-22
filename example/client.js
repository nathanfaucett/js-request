var request = global.request = require("../src/browser");

//request.defaults.withCredentials = true;
request.defaults.headers["Content-Type"] = "application/json";

request.plugins.on("before", function( /* nativeRequest, options */ ) {

});

request.plugins.on("request", function( /* nativeRequest, options */ ) {

});

// error and success same arguments
request.plugins.on("response", function( /* response, nativeRequest, options */ ) {

});

console.time("get");
request.get("http://localhost:3000", {
    headers: {
        "X-TEST_TEST": "ABCDEFG"
    }
}).then(
    function(response) {
        console.timeEnd("get");
        console.log(response);
    },
    function(response) {
        console.timeEnd("get");
        console.log(response);
    }
);

global.uploadFormData = function() {
    var formData = new FormData(),
        file = new File(["{\"hey\": \"value\"}"], "hey.json", {
            type: "application/json"
        });

    formData.append("jsonFile", file);
    formData.append("firstName", "Nathan");
    formData.append("lastName", "Faucett");

    console.time("post form data");
    request.post("http://localhost:3000", formData, {
        headers: {
            "Content-Type": null
        }
    }).then(
        function(response) {
            console.timeEnd("post form data");
            console.log(response);
        },
        function(response) {
            console.timeEnd("post form data");
            console.log(response);
        }
    );
};

global.uploadJSON = function() {
    var json = {
        email: "nathanfaucett@gmail.com"
    };

    console.time("post json");
    request.post("http://localhost:3000", json).then(
        function(response) {
            console.timeEnd("post json");
            console.log(response);
        },
        function(response) {
            console.timeEnd("post json");
            console.log(response);
        }
    );
};
