// Generated by CoffeeScript 1.9.2
(function() {
  var app, express, http, path;

  express = require("express");

  http = require("http");

  path = require("path");

  app = express();

  app.set("port", process.env.PORT || 3000);

  app.use(express.favicon());

  app.use(express.logger("dev"));

  app.use(express.json());

  app.use(express.urlencoded());

  app.use(express.methodOverride());

  app.use(app.router);

  require('../lib')({
    resolve: __dirname
  }, app);

  app.use("/api", function(err, req, res, next) {
    return res.send("错误");
  });

  http.createServer(app).listen(app.get("port"), function() {
    console.log("Express server listening on port " + app.get("port"));
  });

}).call(this);

//# sourceMappingURL=app.js.map
