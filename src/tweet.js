"use strict";

var Twit = require("twit"),
    moment = require("moment"),
    config = require("../config/config.json");

var T = new Twit({
    consumer_key: config.twitter.consumer_key,
    consumer_secret: config.twitter.consumer_secret,
    access_token: config.twitter.access_token,
    access_token_secret: config.twitter.access_token_secret
});

var clients = [];

function initStream(sid, search) {
    console.log("initStream("+sid+", "+search+")");
    var stream = getStreamByClient(sid);
    var socket = getSocketByClient(sid);
    if (!socket) {
        return;
    }
    if (!search) {
        search = config.search;
    }
    if (stream) {
        stream.stop();
    }
    stream = T.stream("statuses/filter", {"track": search});
    clients[sid].stream = stream;
    stream.on("tweet", function (tweet) {
        console.log("clients num = " + clients.length);
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
    io.use(function (handshake, next) {
        var req = handshake.request;
        if (req.headers.cookie) {
            var cookies = cookie.parse(req.headers.cookie);
            req.sessionID = cookieParser.signedCookie(
                cookies['connect.sid'],
                "SECRET"
            );
            next();
        } else {
            console.log('Not authorized!');
            next(new Error('Not authorized!'));
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
        socket.emit('tweetstarted', '1');

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
    return ("undefined" !== typeof clients[sid] && clients[sid].stream) || null;
}

function getSocketByClient(sid)
{
    return ("undefined" !== typeof clients[sid] && clients[sid].socket) || null;
}

exports.setSearch = function (sid, search) {
    if ("undefined" === typeof clients[sid]) {
        return;
    }
    initStream(sid, search);
    console.log("new search = " + search);
};

exports.toggleStream = function (sid, command) {
    var stream = getStreamByClient();
    if (!stream) {
        return;
    }
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
    return ("undefined" !== typeof clients[sid] && true === clients[sid].streamRunning) || false;
};
