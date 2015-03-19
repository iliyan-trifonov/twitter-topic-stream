"use strict";

var express = require('express'),
    routes = require("./routes"),
    path = require("path");

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', routes.index);
app.get('/tweets', routes.tweets);

var server = app.listen(3000, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Twitter topic stream app listening at http://%s:%s', host, port);

});
