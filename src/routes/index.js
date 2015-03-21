"use strict";

var tweet = require("../tweet");

exports.index = function (req, res) {
    res.render("index.html", {
        search: "linux",
        maxTweets: 20,
        streamRunning: tweet.isRunning(req.sessionID)
    });
};

exports.setSearch = function (req, res) {
    tweet.setSearch(req.sessionID, req.body.search);
    res.end(req.body.search);
};

exports.toggleStream = function (req, res) {
    tweet.toggleStream(req.sessionID, req.body.command);
    res.end(req.body.command);
};
