"use strict";

var config = require("../config/config.json"),
    express = require("express"),
    routes = require("./routes"),
    path = require("path"),
    tweet = require("./tweet"),
    session = require("express-session"),
    memoryStore = session.MemoryStore,
    sessionStore = new memoryStore(),
    cookieParser = require("cookie-parser");

var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('body-parser').json());
app.use(cookieParser(config.secret));
app.use(session({
    secret: config.secret,
    store: sessionStore,
    //TODO: use it and also check how to decode it in tweet.js init
    //cookie: { secure: true },
    resave: false,
    saveUninitialized: true
}));

app.get('/', routes.index);
app.post('/tweets/search', routes.setSearch);
app.put('/tweets/stream', routes.toggleStream);

http.listen(3000, function () {
    console.log("listening on *:3000");
});

tweet.init(io, sessionStore);
