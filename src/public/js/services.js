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
                    }
                }
            };
        }
    ])
    .factory("mySocket", function (socketFactory) {
        var mySocket = socketFactory();
        mySocket.forward("tweet");
        return mySocket;
    });

})(angular);
