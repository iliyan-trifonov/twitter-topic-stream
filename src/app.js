"use strict";

var express = require('express'),
    routes = require("./routes"),
    path = require("path"),
    moment = require("moment");

var app = express();

var http = require("http").Server(app);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', routes.index);

http.listen(3000, function () {
    console.log("listening on *:3000");
});

//////

var io = require("socket.io")(http);

var Twit = require("twit");

var T = new Twit({
    consumer_key: "yV0MmRg98kaiwuruZqe7613aL",
    consumer_secret: "C48W4eAGfAi6Q0vfplrcUI85F7dwIQ7bkZbDqZ2jfWcLEwkPry",
    access_token: "68644911-imLxX2tekVg0I7r7QG7B2Cof5I0dy7DNiXvDli7c6",
    access_token_secret: "V21qUsOoxHC7uVtjGpRgFxDPtQVcI5gIMIOtueZP4gqOe"
});

var stream = T.stream("statuses/filter", { track: "playstation" });

stream.on("tweet", function (tweet) {
    var result = {
        "timestamp": new Date(tweet.created_at).getTime(),
        "date": moment(tweet.created_at).format("DD.MM.YYYY HH:mm:ss"),
        "text": tweet.text,
        "source": tweet.source,
        "user": {
            "name": tweet.user.name,
            "screen_name": tweet.user.screen_name
        }
    };
    io.emit('tweet', result);
});
