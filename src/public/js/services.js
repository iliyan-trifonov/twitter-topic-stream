(function (angular) {
    "use strict";

    angular.module("TwitterTopicStream.services", [])
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
        ]);


})(angular);
