var Cors = require("cors"),
    BodyParser = require("body_parser"),
    layers = require("layers"),
    context = require("context"),

    router = new layers.Router(),
    server = new require("http").Server(function(req, res) {

        context.init(req, res);
        router.handler(req, res);
    });

router.use(
    new Cors({
        origin: "http://localhost",
        credentials: true
    }),
    new BodyParser()
);

router.route()
    .get(function(req, res, next) {

        res.json({
            message: "home"
        });
        next();
    })
    .post(function(req, res, next) {

        res.json(req.body);
        next();
    })
    .patch(function(req, res, next) {

        res.json(req.body);
        next();
    })
    .all(function(err, req, res, next) {
        if (!res.sent) {
            res.statusCode = (res.statusCode < 301 || res.statusCode === 304) ? 404 : res.statusCode;

            res.json({
                statusCode: res.statusCode,
                message: (err || "Not Found") + ""
            });
        }
        next();
    });

server.listen(3000);
