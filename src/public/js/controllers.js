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

            var listen = true,
                streamRunning = true;

            $scope.tweets = [];

            $scope.maxTweets = maxTweets;
            $scope.search = search;
            $scope.messageTxt = "";
            $scope.updated = false;
            $scope.toggleStreamButtonTxt = "Stop";

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
                $scope.messageTxt = "";
                $scope.updated = false;
                streamRunning = false;
                Api.tweets.setSearch($scope.search)
                    .success(function () {
                        listen = true;
                        $scope.messageTxt = "Updated";
                        $scope.updated = true;
                        $scope.toggleStreamButtonTxt = "Stop";
                        streamRunning = true;
                    });
            };

            $scope.toggleStream = function () {
                var command = "", message = "", button = "";
                $scope.updated = false;
                if (true === streamRunning) {
                    streamRunning = false;
                    command = "stop";
                    listen = false;
                    message = "Stopped";
                    button = "Start";
                } else {
                    streamRunning = true;
                    command = "start";
                    listen = true;
                    message = "Started";
                    button = "Stop";
                }
                Api.tweets.toggleStream(command)
                    .success(function () {
                        $scope.toggleStreamButtonTxt = button;
                        $scope.messageTxt = message;
                        $scope.updated = true;
                    });
            };
        }
    ]);

})(angular);
