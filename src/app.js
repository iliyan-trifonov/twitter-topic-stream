"use strict";

var express = require('express'),
    routes = require("./routes"),
    path = require("path"),
    tweet = require("./tweet"),
    session = require("express-session"),
    cookieParser = require("cookie-parser");

var app = express();

var http = require("http").Server(app);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('body-parser').json());
app.use(cookieParser("SECRET"));
app.use(session({
    secret: "SECRET",
    resave: false,
    saveUninitialized: true
}));

app.get('/', routes.index);
app.post('/tweets/search', routes.setSearch);
app.put('/tweets/stream', routes.toggleStream);

http.listen(3000, function () {
    console.log("listening on *:3000");
});

var io = require("socket.io")(http);

//TODO: check how to give new stream for new user, not one shared globally
tweet.init(io);
