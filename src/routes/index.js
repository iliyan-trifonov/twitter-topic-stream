"use strict";

exports.index = function (req, res) {
    res.render("index.html", { topic: "@playstation" });
};

exports.tweets = function (req, res) {
    var Twit = require("twit");

    var T = new Twit({
        consumer_key: "yV0MmRg98kaiwuruZqe7613aL",
        consumer_secret: "C48W4eAGfAi6Q0vfplrcUI85F7dwIQ7bkZbDqZ2jfWcLEwkPry",
        access_token: "68644911-imLxX2tekVg0I7r7QG7B2Cof5I0dy7DNiXvDli7c6",
        access_token_secret: "V21qUsOoxHC7uVtjGpRgFxDPtQVcI5gIMIOtueZP4gqOe"
    });

    var stream = T.stream("statuses/filter", { track: "playstation" });

    stream.on("tweet", function (tweet) {
        var result = [{
            "date": tweet.created_at,
            "text": tweet.text,
            "source": tweet.source,
            "user": {
                "name": tweet.user.name,
                "screen_name": tweet.user.screen_name
            }
        }];
        console.log(result);
        stream.stop();
        return res.json(result);
    });
};
