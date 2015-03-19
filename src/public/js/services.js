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
                    "list": function () {
                        return $http({
                            "url": "/tweets",
                            "method": "GET",
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
