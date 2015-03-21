"use strict";

var Twit = require("twit"),
    moment = require("moment");

var T = new Twit({
    consumer_key: "yV0MmRg98kaiwuruZqe7613aL",
    consumer_secret: "C48W4eAGfAi6Q0vfplrcUI85F7dwIQ7bkZbDqZ2jfWcLEwkPry",
    access_token: "68644911-imLxX2tekVg0I7r7QG7B2Cof5I0dy7DNiXvDli7c6",
    access_token_secret: "V21qUsOoxHC7uVtjGpRgFxDPtQVcI5gIMIOtueZP4gqOe"
});

var clients = [];

function initStream(sid, search) {
    var stream = getStreamByClient(sid);
    var socket = getSocketByClient(sid);
    if (!search) {
        search = "linux";
    }
    if (stream) {
        stream.stop();
        stream.close();
    }
    stream = T.stream("statuses/filter", {"track": search});
    clients[sid].stream = stream;
    socket.emit('tweetstarted', '1');
    stream.on("tweet", function (tweet) {
        var result = {
            "id": tweet.id_str,
            "date": moment(tweet.created_at).format("DD.MM.YYYY HH:mm:ss"),
            "text": tweet.text,
            "source": tweet.source,
            "user": {
                "name": tweet.user.name,
                "screen_name": tweet.user.screen_name,
                "avatar": tweet.user.profile_image_url
            },
            "url": "https://twitter.com/statuses/" + tweet.id_str
        };
        console.log(moment().format("DD.MM.YYYY HH:mm:ss") + " new tweet for '"+search+"'");
        socket.emit('tweet', result);
    });
}

var cookie = require("cookie");
var cookieParser = require("cookie-parser");

exports.init = function (io) {
    io.use(function (socket, next) {
        var req = socket.request;
        if (req.headers.cookie) {
            var cookies = cookie.parse(req.headers.cookie);
            req.sessionID = cookieParser.signedCookie(
                cookies['connect.sid'],
                "SECRET"
            );
            next();
        } else {
            next(new Error('not authorized'));
        }
    });

    io.on('connection', function(socket) {
        console.log(
            'A socket with sessionID ' +
            socket.request.sessionID +
            ' connected!'
        );

        clients[socket.request.sessionID] = {
            "stream": null,
            "socket": socket,
            "streamRunning": false
        };

        initStream(socket.request.sessionID);

        socket.on('disconnect', function () {
            console.log(
                'A socket with sessionID ' +
                socket.request.sessionID +
                ' disconnected!'
            );
        });
    });

};

function getStreamByClient(sid)
{
    return (clients.indexOf(sid) !== -1 && clients[sid].stream) || null;
}

function getSocketByClient(sid)
{
    return clients[sid].socket;
}

exports.setSearch = function (sid, search) {
    initStream(sid, search);
    console.log("new search = " + search);
};

exports.toggleStream = function (sid, command) {
    var stream = getStreamByClient();
    if ("start" === command) {
        stream.start();
        clients[sid].streamRunning = true;
        console.log("stream started");
    } else if ("stop" === command) {
        stream.stop();
        clients[sid].streamRunning = false;
        console.log("stream stopped");
    }
};

exports.isRunning = function (sid) {
    return (clients.indexOf(sid) !== -1 && true === clients[sid].streamRunning) || false;
};
