"use strict";

exports.index = function (req, res) {
    res.render("index.html", { search: "linux", maxTweets: 20 });
};

exports.setSearch = function (req, res) {
    var tweet = require("../tweet");
    tweet.setSearch(req.body.search);
    res.end(req.body.search);
};
