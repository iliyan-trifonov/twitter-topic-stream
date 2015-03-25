(function (angular) {
    "use strict";

    angular.module("TwitterTopicStream.controllers", [
        "TwitterTopicStream.services",
        "TwitterTopicStream.vars",
        "ngSanitize",
        "ngAnimate"
    ])
    .controller("IndexCtrl", [
        '$scope', '$window', 'mySocket', 'maxTweets', 'search', 'Api', '$interval', '$timeout', 'streamRunning',
        function ($scope, $window, mySocket, maxTweets, search, Api, $interval, $timeout, streamRunning) {

            var listen = streamRunning,
                notifications = [],
                displayingMessage = false;

            $scope.tweets = [];

            $scope.maxTweets = maxTweets;
            $scope.search = search;
            $scope.messageTxt = "";
            $scope.toggleStreamButtonTxt = "Pause";
            $scope.alert = "";
            $scope.info = "";

            $scope.pageRefresh = function () {
                $window.location.reload();
            };

            //TODO: on disconnect: stop listen and isrunning = false in the controller

            //TODO: separate error messages for stream and socket errors
            $scope.$on("socket:error", function (ev, data) {
                streamRunning = false;
                listen = false;
                $scope.alert = "Stream error: " + data;
            });

            $scope.$on("socket:info", function (ev, data) {
                $scope.info = "Stream message: " + data;
                $timeout(function () {
                    $scope.info = "";
                }, 5E3);
            });

            $scope.$on("socket:tweetClients", function (ev, data) {
                $scope.tweetsClients = data;
            });
            $scope.$on("socket:tweetStats", function (ev, data) {
                $scope.tweetsFirst = data.tweetsFirst;
                $scope.tweetsCount = data.tweetsCount;
            });

            $scope.$on("socket:tweetStarted", function () {
                streamRunning = true;
                listen = true;
            });

            $scope.$on("socket:tweet", function (ev, data) {
                if (!listen) {
                    return;
                }

                $scope.tweets.push(data);
                var len = $scope.tweets.length;
                if (len > maxTweets) {
                    //$scope.tweets.splice(0, len - maxTweets);
                    $scope.tweets.splice(0, 1);
                }
            });

            $scope.updateSearch = function () {
                listen = false;
                $scope.tweets = [];

                Api.tweets.setSearch($scope.search)
                    .success(function () {
                        listen = true;
                        streamRunning = true;
                        showMessage("Updated");
                    });
            };

            $scope.toggleStream = function () {
                var command;

                if (true === streamRunning) {
                    listen = false;
                    command = "stop";
                } else {
                    listen = true;
                    command = "start";
                }
                Api.tweets.toggleStream(command)
                    .success(function () {
                        streamRunning = ("start" === command);
                    });
            };

            function showMessage(message)
            {
                notifications.push(message);
            }

            function setButtonText(text)
            {
                $scope.toggleStreamButtonTxt = text;
            }

            function streamRunningWatch (newVal) {
                if (true === newVal) {
                    showMessage("Started");
                    setButtonText("Pause");
                } else {
                    showMessage("Paused");
                    setButtonText("Start");
                }
            }

            $scope.$watch(function () {
                return streamRunning;
            }, function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    streamRunningWatch(newVal);
                }
            });

            $interval(function () {
                if (notifications.length > 0 && !displayingMessage) {
                    displayingMessage = true;
                    $scope.messageTxt = notifications.splice(0, 1);
                    $timeout(function () {
                        $scope.messageTxt = "";
                        displayingMessage = false;
                    }, 1E3);
                }
            }, 500);

            if (!streamRunning) {
                streamRunningWatch(1);
            }
        }
    ]);

})(angular);
