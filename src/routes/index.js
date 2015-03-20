"use strict";

var tweet = require("../tweet");

exports.index = function (req, res) {
    res.render("index.html", {
        search: "linux",
        maxTweets: 20,
        streamRunning: tweet.isRunning()
    });
};

exports.setSearch = function (req, res) {
    tweet.setSearch(req.body.search);
    res.end(req.body.search);
};

exports.toggleStream = function (req, res) {
    tweet.toggleStream(req.body.command);
    res.end(req.body.command);
};
