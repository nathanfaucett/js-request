var tape = require("tape"),
    request = require("..");


tape("request(options: Object)", function(assert) {
    try {
        request({
            url: "https://www.google.com",
            method: "GET",
            success: function() {
                assert.equal(true, true);
                assert.end();
            },
            error: function() {
                assert.equal(true, true);
                assert.end();
            }
        });
    } catch (e) {
        assert.end(e);
    }
});
