"use strict";

var Twit = require("twit"),
    moment = require("moment"),
    config = require("../config/config.json"),
    cookie = require("cookie"),
    cookieParser = require("cookie-parser"),
    socketio,
    sessionStore;

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
    var client = getClientBySid(sid);
    var stream = client.stream;
    search = search || config.search;
    if (!stream || search !== client.search) {
        console.log("creating a new stream");
        if (stream) {
            stream.stop();
        }
        stream = T.stream("statuses/filter", {"track": search});

        client.streamRunning = true;
        client.search = search;

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
            //TODO: put it in queue and pop every second only
            clients[sid].socket.emit('tweet', result);
            sendTweetStats(1);
        });

        client.socket.emit('tweetStarted', '1');

        stream.on("disconnect", function (disconnectMessage) {
            var msg = "stream disconnected: " + disconnectMessage;
            console.log(msg);
            clients[sid].socket.emit("error", msg);
        });

        stream.on("limit", function (limitMessage) {
            var msg = "stream limit: " + limitMessage;
            console.log(msg);
            clients[sid].socket.emit("info", msg);
        });

        stream.on("reconnect", function (req, res, connectInterval) {
            var msg = "stream reconnect after: " + connectInterval/1000 + " seconds";
            console.log(msg);
            clients[sid].socket.emit("info", msg);
        });

        stream.on("connect", function (req) {
            var msg = "stream connect";
            console.log(msg);
            //clients[sid].socket.emit("error", msg);
        });

/*
        stream.on("connected", function (res) {
            var msg = "stream connected";
            console.log(msg);
            //clients[sid].socket.emit("error", msg);
        });
*/

        stream.on("warning", function (warning) {
            var msg = "stream warning: " + warning;
            console.log(msg);
            clients[sid].socket.emit("error", msg);
        });

        client.stream = stream;
    } else {
        console.log("reusing the old stream");
        console.log("old stream running: " + clients[sid].streamRunning);
        //if not stopped
        if (client.streamRunning) {
            stream.start();
            client.socket.emit('tweetStarted', '1');
        }
    }
}

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

function removeClient(sid) {
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

function toggleStream(sid, command) {
    console.log("toggleStream("+sid+", "+command+") called");
    var stream = getClientBySid(sid).stream;
    if (!stream) {
        console.log("no stream set for this client!");
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
}

function sessionAuth(handshake, next) {
    var req = handshake.request;
    if (req.headers.cookie) {
        var cookies = cookie.parse(req.headers.cookie);
        //TODO: look for examples with signedCookie() and compare
        var sid = cookieParser.signedCookie(
            cookies[config.session_key],
            config.secret
        );
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
}

function getClientBySid(sid) {
    return "undefined" !== typeof clients[sid] ?
        clients[sid] :
        null;
}

function removeClientCleanup(sid) {
    var client = getClientBySid(sid);
    if (!client) {
        return;
    }
    if (client.cleanup) {
        clearTimeout(client.cleanup);
        delete client.cleanup;
        console.log("removed cleanup for client " + sid);
    }
}

exports.init = function (io, store) {
    socketio = io;
    sessionStore = store;

    socketio.use(sessionAuth);

    socketio.on('connection', function(socket) {
        console.log("socket client connected");

        var client = getClientBySid(socket.request.sessionID);

        if (client) {
            console.log("old client detected");
            removeClientCleanup(socket.request.sessionID);
            //client socket changes after refresh
            clients[socket.request.sessionID].socket = socket;
            initStream(socket.request.sessionID, client.search);
        } else {
            console.log("new client detected");
            clients[socket.request.sessionID] = {
                "stream": null,
                "socket": socket,
                "streamRunning": false,
                "search": null
            };
            initStream(socket.request.sessionID);
        }

        socket.on('disconnect', function () {
            console.log("socket client disconnected");
            //needs to get the client var again
            var client = getClientBySid(socket.request.sessionID);
            //stop stream and delete client after some time
            client.stream.stop();
            client.cleanup = setTimeout(function () {
                removeClient(socket.request.sessionID);
                sendClientsNum();
            }, 60E3);//60 sec.
        });

        sendClientsNum();
        sendTweetStats();
    });

};

exports.setSearch = function (sid, search) {
    if ("undefined" === typeof clients[sid]) {
        return;
    }
    console.log("new search = " + search);
    initStream(sid, search);
};

exports.getSearch = function (sid) {
    return (
        "undefined" !== typeof clients[sid] &&
        clients[sid].search
        ) || false;
};

exports.toggleStream = toggleStream;

exports.isRunning = function (sid) {
    return (
        "undefined" !== typeof clients[sid] &&
        true === clients[sid].streamRunning
        ) || false;
};
