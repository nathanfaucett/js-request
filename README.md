Request
=======

http requests for the browser and node.js

```javascript
var request = require("@nathanfaucett/request");


request({
    url: "https://www.google.com",
    method: "GET",
    success: function(response) {
        console.log(response);
    },
    error: function(response) {
        console.log(response);
    }
});
```
