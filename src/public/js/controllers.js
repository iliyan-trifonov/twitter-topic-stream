(function (angular) {
    "use strict";

    angular.module("TwitterTopicStream.controllers", [
        "TwitterTopicStream.services",
        "TwitterTopicStream.vars",
        "ngSanitize",
        "ngAnimate"
    ])
    .controller("IndexCtrl", [
        '$scope', 'mySocket', 'maxTweets', 'search', 'Api',
        function ($scope, mySocket, maxTweets, search, Api) {

            var listen = true;

            $scope.tweets = [];

            $scope.maxTweets = maxTweets;
            $scope.search = search;
            $scope.updated = false;

            $scope.$on("socket:tweet", function (ev, data) {
                if (!listen) {
                    return;
                }
                $scope.tweets.push(data);
                var len = $scope.tweets.length;
                if (len > maxTweets) {
                    //or .splice(0, 1)
                    $scope.tweets.splice(0, len - maxTweets);
                }
            });

            $scope.updateSearch = function () {
                listen = false;
                $scope.tweets = [];
                $scope.updated = false;
                Api.tweets.setSearch($scope.search)
                    .success(function () {
                        listen = true;
                        $scope.updated = true;
                    });
            };
        }
    ]);

})(angular);
