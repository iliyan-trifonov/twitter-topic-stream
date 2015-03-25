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

var clients = {};

var stats = {
    "tweetsFirst": null,
    "tweetsCount": 0
};

function initStream(sid, search) {
    console.log("initStream("+sid+", "+search+") called");
    var stream = getStreamByClient(sid);
    var socket = getSocketByClient(sid);
    if (!socket) {
        console.log("no socket for this client!");
        return;
    }
    search = search || config.search;
    /*if (stream) {
        stream.stop();
        //TODO: check for better Twit cleanup
        delete clients[sid].stream;
    }*/
    if (!stream || search !== clients[sid].search) {
        console.log("creating a new stream");
        stream = T.stream("statuses/filter", {"track": search});

        stream.on("tweet", function (tweet) {
            console.log("clients num = " + Object.keys(clients).length);
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
            //TODO: put it in queue and pop every second only
            clients[sid].socket.emit('tweet', result);
            sendTweetStats(1);
        });

        clients[sid].socket.emit('tweetStarted', '1');

        stream.on("disconnect", function (disconnectMessage) {
            var msg = "stream disconnected: " + disconnectMessage;
            console.log(msg);
            clients[sid].socket.emit("error", msg);
        });

        clients[sid].stream = stream;
    } else {
        console.log("reusing the old stream");
        if (clients[sid].streamRunning) {
            stream.start();
            clients[sid].socket.emit('tweetStarted', '1');
        }
    }
}

var cookie = require("cookie");
var cookieParser = require("cookie-parser");
var socketio;

exports.init = function (io, sessionStore) {
    socketio = io;
    socketio.use(function (handshake, next) {
        var req = handshake.request;
        if (req.headers.cookie) {
            var cookies = cookie.parse(req.headers.cookie);
            //TODO: look for examples with signedCookie() and compare
            var sid = cookieParser.signedCookie(
                cookies[config.session_key],
                config.secret
            );
            sessionStore.length(function (err, len) {
                console.log("sessions length = " + len);
            });
            sessionStore.get(sid, function (err, session) {
                if (err || !session) {
                    console.log(err, session);
                    console.log("session with sid " + sid + " not found!");
                    next(new Error("Invalid session id!"));
                } else {
                    console.log("authorized");
                    req.sessionID = sid;
                    next();
                }
            });
        } else {
            console.log('Not authorized!');
            next(new Error('Not authorized!'));
        }
    });

    socketio.on('connection', function(socket) {
        console.log(
            'A socketio with sessionID ' +
            socket.request.sessionID +
            ' connected!'
        );

        if ("undefined" !== typeof clients[socket.request.sessionID]) {
            console.log("old client detected");
            var cl = clients[socket.request.sessionID];
            if (cl.cleanup) {
                clearTimeout(cl.cleanup);
                delete cl.cleanup;
                console.log("removed cleanup for client " + socket.request.sessionID);
            }
            //delete clients[socket.request.sessionID].socket;
            clients[socket.request.sessionID].socket = socket;
            //toggleStream(socket.request.sessionID, "start");
            initStream(socket.request.sessionID, cl.search);
        } else {
            console.log("new client detected");
            clients[socket.request.sessionID] = {
                "stream": null,
                "socket": socket,
                "streamRunning": false,
                "search": ""
            };

            //TODO: use socket.clients length
            console.log("clients num become: " + Object.keys(clients).length);

            initStream(socket.request.sessionID);
        }

        sendClientsNum();
        sendTweetStats();


        socket.on('disconnect', function () {
            console.log(
                'A socket with sessionID ' +
                socket.request.sessionID +
                ' disconnected!'
            );

            clients[socket.request.sessionID].stream.stop();
            //cleanup after some small period
            clients[socket.request.sessionID].cleanup = setTimeout(function () {
                removeClient(socket.request.sessionID);
                sendClientsNum();
            }, 6E3);

        });
    });

};

function sendTweetStats(newtweets)
{
    if ("undefined" !== typeof newtweets) {
        stats.tweetsCount += newtweets;
        if (!stats.tweetsFirst) {
            stats.tweetsFirst = moment().format("DD.MM.YYYY HH:mm:ss");
        }
    }
    socketio.emit("tweetStats", stats);
}

function removeClient(sid)
{
    var client = (
        "undefined" !== typeof clients[sid] &&
        clients[sid]
        ) || null;
    if (client) {
        client.stream.stop();
        delete clients[sid];
    }
    console.log("client " + sid + " deleted");
}

function sendClientsNum()
{
    //TODO: use socket.clients length
    socketio.emit("tweetClients", Object.keys(clients).length);
}

function getStreamByClient(sid)
{
    return (
        "undefined" !== typeof clients[sid] &&
        clients[sid].stream
        ) || null;
}

function getSocketByClient(sid)
{
    return (
        "undefined" !== typeof clients[sid] &&
        clients[sid].socket
        ) || null;
}

exports.setSearch = function (sid, search) {
    if ("undefined" === typeof clients[sid]) {
        return;
    }
    console.log("new search = " + search);
    initStream(sid, search);
    clients[sid].search = search;
};

exports.getSearch = function (sid) {
    return (
        "undefined" !== typeof clients[sid] &&
        clients[sid].search
        ) || false;
};

var toggleStream = function (sid, command) {
    console.log("toggleStream("+sid+", "+command+") called");
    var stream = getStreamByClient(sid);
    if (!stream) {
        console.log("stream is false, returning");
        return;
    }
    if ("start" === command) {
        stream.start();
        clients[sid].streamRunning = true;
        console.log("stream "+sid+" started");
    } else if ("stop" === command) {
        stream.stop();
        clients[sid].streamRunning = false;
        console.log("stream "+sid+" stopped");
    }
};

exports.toggleStream = toggleStream;

exports.isRunning = function (sid) {
    return (
        "undefined" !== typeof clients[sid] &&
        true === clients[sid].streamRunning
        ) || false;
};
