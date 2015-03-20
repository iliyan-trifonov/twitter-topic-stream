"use strict";

var express = require('express'),
    routes = require("./routes"),
    path = require("path"),
    tweet = require("./tweet");

var app = express();

var http = require("http").Server(app);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('body-parser').json());

app.get('/', routes.index);
app.post('/tweets/search', routes.setSearch);
app.put('/tweets/stream', routes.toggleStream);

http.listen(3000, function () {
    console.log("listening on *:3000");
});

var io = require("socket.io")(http);

//TODO: check how to give new stream for new user, not one shared globally
tweet.stream(io);
