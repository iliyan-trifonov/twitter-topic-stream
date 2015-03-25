(function (angular) {
    "use strict";

    angular.module("TwitterTopicStream.services", [
        "btford.socket-io"
    ])
    .service("Api", [
        '$http',
        function ($http) {
            return {
                "tweets": {
                    "setSearch": function (search) {
                        return $http({
                            "url": "/tweets/search",
                            "data": { "search": search },
                            "method": "POST",
                            "cache": false
                        });
                    },
                    "toggleStream": function (command) {
                        return $http({
                            "url": "/tweets/stream",
                            "data": { "command": command },
                            "method": "PUT",
                            "cache": false
                        });
                    }
                }
            };
        }
    ])
    .factory("mySocket", function (socketFactory) {
        var mySocket = socketFactory();
        //TODO: on disconnect: stop listen and isrunning = false in the controller
        mySocket.forward("tweet");
        mySocket.forward("tweetStarted");
        mySocket.forward("tweetClients");
        mySocket.forward("tweetStats");
        mySocket.forward("error");
        mySocket.forward("info");
        //TODO: forward connection error
        //TODO: like mySocket.on("error", ...)
        //TODO: separate error messages for stream and socket errors
        return mySocket;
    });

})(angular);
