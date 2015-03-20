"use strict";

var Twit = require("twit"),
    moment = require("moment");

var T = new Twit({
    consumer_key: "yV0MmRg98kaiwuruZqe7613aL",
    consumer_secret: "C48W4eAGfAi6Q0vfplrcUI85F7dwIQ7bkZbDqZ2jfWcLEwkPry",
    access_token: "68644911-imLxX2tekVg0I7r7QG7B2Cof5I0dy7DNiXvDli7c6",
    access_token_secret: "V21qUsOoxHC7uVtjGpRgFxDPtQVcI5gIMIOtueZP4gqOe"
});

var stream = T.stream("statuses/filter", { track: "linux" });

var socket;

function assignEvent () {
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
        console.log(moment().format("DD.MM.YYYY HH:mm:ss") + " new tweet");
        socket.emit('tweet', result);
    });
}

exports.stream = function (io) {
    socket = io;
    assignEvent();
    return stream;
};

exports.setSearch = function (search) {
    stream.stop();
    stream = T.stream("statuses/filter", {"track": search});
    assignEvent();
    console.log("set new search = " + search);
};
